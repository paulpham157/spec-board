import type {
  AIConfig,
  AIProvider,
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GenerateSpecOptions,
  GenerateClarifyOptions,
  GeneratePlanOptions,
  GenerateTasksOptions,
  GenerateChecklistOptions,
  AnalyzeOptions,
  GenerateConstitutionOptions,
  GeneratedUserStory,
  GeneratedSpecKit,
  GeneratedSpec,
  ClarificationQuestion,
  GeneratedPlan,
  GeneratedTasks,
  GeneratedChecklist,
  AnalysisResult,
  GeneratedConstitution,
  ViolationDetectionOptions,
  ViolationReport,
  // Phase 1 artifacts
  GenerateResearchOptions,
  GenerateDataModelOptions,
  GenerateQuickstartOptions,
  GenerateContractsOptions,
  GeneratedResearch,
  GeneratedDataModel,
  GeneratedQuickstart,
  GeneratedContracts,
  // Priority labeling
  GeneratePriorityOptions,
  GeneratedPriority,
  BatchPriorityOptions,
  BatchPriorityResult
} from './types';
import { getAISettings, getAppSettings } from './settings';
import prisma from '@/lib/prisma';

// Provider config from database
interface ProviderConfig {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string | null;
  oauthToken: string | null;
  enabled: boolean;
  priority: number;
}

// Get all enabled providers sorted by priority
async function getEnabledProviders(): Promise<ProviderConfig[]> {
  try {
    const providers = await prisma.$queryRawUnsafe<ProviderConfig[]>(
      `SELECT "id", "provider", "label", "baseUrl", "model", "apiKey", "oauthToken", "enabled", "priority"
       FROM "ai_provider_configs"
       WHERE "enabled" = true
       ORDER BY "priority" ASC`
    );
    return providers;
  } catch {
    return [];
  }
}

/**
 * AI Client - OpenAI-Compatible API only
 * Supports Ollama, LM Studio, LocalAI, and any OpenAI-compatible endpoint
 */

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o'
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

// Environment variables as fallback
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class AIService {
  private config: AIConfig;

  constructor(config: AIConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Update configuration
  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  // Get current provider
  async getProvider(): Promise<AIProvider> {
    const settings = await getAISettings();
    return settings.provider as AIProvider;
  }

  // Check if using real AI
  async isRealAI(): Promise<boolean> {
    const settings = await getAISettings();
    return !!settings.apiKey;
  }

  // Base URL getter
  private async getBaseUrl(): Promise<string> {
    const settings = await getAISettings();
    return settings.baseUrl || 'https://api.openai.com/v1';
  }

  // API key getter
  private async getApiKey(): Promise<string> {
    const settings = await getAISettings();
    return settings.apiKey || OPENAI_API_KEY || '';
  }

  // Model getter
  private async getModel(): Promise<string> {
    const settings = await getAISettings();
    return settings.model || this.config.model || 'gpt-4o';
  }

  // Build fetch URL from base URL
  private buildFetchUrl(baseUrl: string): string {
    let fetchUrl = baseUrl;
    if (fetchUrl.includes('/chat/completions')) {
      // Already has full endpoint
    } else if (fetchUrl.endsWith('/completions')) {
      fetchUrl = `${fetchUrl}/chat`;
    } else {
      fetchUrl = `${fetchUrl}/chat/completions`;
    }
    return fetchUrl;
  }

  // Build language-injected system prompt
  private async buildSystemPrompt(systemPrompt?: string): Promise<string> {
    const LANGUAGE_NAMES: Record<string, string> = {
      vi: 'Vietnamese (Tiếng Việt)',
      en: 'English',
      zh: 'Chinese (中文)',
      ja: 'Japanese (日本語)',
      ko: 'Korean (한국어)',
    };
    const appSettings = await getAppSettings();
    const lang = appSettings.language || 'vi';
    const langName = LANGUAGE_NAMES[lang] || lang;
    const langInstruction = `\n\nIMPORTANT: You MUST respond entirely in ${langName}. All text, titles, descriptions, names, and content must be written in ${langName}. Only keep technical terms, code, and JSON keys in English.`;

    return systemPrompt
      ? systemPrompt + langInstruction
      : `You are a helpful assistant.${langInstruction}`;
  }

  // Build request for Anthropic Messages API (different format)
  private buildAnthropicRequest(
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    maxTokens: number,
    baseUrl: string
  ): { url: string; init: RequestInit } {
    // Extract system message
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const url = baseUrl.endsWith('/v1/messages')
      ? baseUrl
      : baseUrl.endsWith('/v1')
        ? `${baseUrl}/messages`
        : `${baseUrl}/v1/messages`;

    return {
      url,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          ...(systemMsg ? { system: systemMsg.content } : {}),
          messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      },
    };
  }

  // Parse Anthropic response format
  private parseAnthropicResponse(data: Record<string, unknown>): string {
    const content = data.content as Array<{ type: string; text?: string }>;
    if (Array.isArray(content)) {
      return content
        .filter((block) => block.type === 'text' && block.text)
        .map((block) => block.text)
        .join('');
    }
    throw new Error('Unexpected Anthropic response format');
  }

  // Call a single provider with retry logic
  private async callSingleProvider(
    fetchUrl: string,
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    maxTokens: number,
    providerLabel: string,
    providerType?: string
  ): Promise<string> {
    const isAnthropic = providerType === 'anthropic';
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        let response: Response;

        if (isAnthropic) {
          const req = this.buildAnthropicRequest(apiKey, model, messages, maxTokens, fetchUrl);
          response = await fetch(req.url, req.init);
        } else {
          response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.7,
              max_tokens: maxTokens,
            }),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();

          // Auth errors (401/403) -- don't retry, throw immediately to skip to next provider
          if (response.status === 401 || response.status === 403) {
            throw new Error(`[${providerLabel}] Auth error (${response.status}): ${errorText}`);
          }

          // Rate limit (429) -- retry with backoff
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            let waitTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            if (retryAfter) {
              const parsed = parseInt(retryAfter, 10);
              if (!isNaN(parsed)) waitTime = parsed * 1000;
            }
            console.log(`[AI LB] ${providerLabel} rate limited. Wait ${waitTime}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
            if (attempt < MAX_RETRIES) {
              await this.sleep(waitTime);
              continue;
            }
          }

          // 5xx server errors -- retry
          if (response.status >= 500 && attempt < MAX_RETRIES) {
            const waitTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            console.log(`[AI LB] ${providerLabel} server error (${response.status}). Retry in ${waitTime}ms`);
            await this.sleep(waitTime);
            continue;
          }

          throw new Error(`[${providerLabel}] API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (isAnthropic) {
          return this.parseAnthropicResponse(data);
        }
        return data.choices[0].message.content;
      } catch (error) {
        lastError = error as Error;
        const msg = (error instanceof Error ? error.message : '').toLowerCase();

        // Network errors -- retry
        if (attempt < MAX_RETRIES && (msg.includes('network') || msg.includes('fetch') || msg.includes('econnrefused'))) {
          const waitTime = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
          console.log(`[AI LB] ${providerLabel} network error. Retry in ${waitTime}ms`);
          await this.sleep(waitTime);
          continue;
        }
        break;
      }
    }

    throw lastError || new Error(`[${providerLabel}] Failed after retries`);
  }

  // Internal API call with multi-provider load balancing
  private async callAPI(prompt: string, systemPrompt?: string, maxTokens: number = 4096): Promise<string> {
    const finalSystemPrompt = await this.buildSystemPrompt(systemPrompt);
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: prompt },
    ];

    // Try multi-provider load balancing first
    const providers = await getEnabledProviders();

    if (providers.length > 0) {
      const errors: string[] = [];

      for (const provider of providers) {
        const token = provider.oauthToken || provider.apiKey;
        if (!token) {
          console.log(`[AI LB] Skipping ${provider.label}: no auth token`);
          continue;
        }

        const isAnthropic = provider.provider === 'anthropic';
        const fetchUrl = isAnthropic ? provider.baseUrl : this.buildFetchUrl(provider.baseUrl);
        console.log(`[AI LB] Trying provider: ${provider.label} (${provider.provider}/${provider.model}) -> ${fetchUrl}`);

        try {
          const result = await this.callSingleProvider(
            fetchUrl, token, provider.model, messages, maxTokens, provider.label, provider.provider
          );
          console.log(`[AI LB] Success with provider: ${provider.label}`);
          return result;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`[AI LB] Failed with ${provider.label}: ${msg}`);
          errors.push(msg);
          // Continue to next provider
        }
      }

      // All providers failed -- throw combined error
      if (errors.length > 0) {
        throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
      }
    }

    // Fallback: use legacy single-provider settings (for backward compatibility)
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Please configure AI settings before using this feature.');
    }

    const baseUrl = await this.getBaseUrl();
    const model = await this.getModel();
    const fetchUrl = this.buildFetchUrl(baseUrl);

    console.log(`[AI LB] Fallback to legacy settings: ${model} -> ${fetchUrl}`);
    return this.callSingleProvider(fetchUrl, apiKey, model, messages, maxTokens, 'Legacy');
  }

  // Sleep helper
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate user stories
  async generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
    const content = await this.callAPI(
      this.buildUserStoriesPrompt(options.prdContent, options.projectContext),
      'You are a product analyst that creates user stories from PRD documents.',
      4096
    );
    return this.parseUserStoriesResponse(content);
  }

  // Generate full spec-kit
  async generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
    const content = await this.callAPI(
      this.buildSpecKitPrompt(options.prdContent, options.featureName, options.projectContext),
      'You are a product analyst and technical writer that creates full spec-kit from PRD documents.',
      8192
    );
    return this.parseSpecKitResponse(content);
  }

  // Step 1: Generate spec
  async generateSpec(options: GenerateSpecOptions): Promise<GeneratedSpec> {
    const content = await this.callAPI(
      this.buildSpecPrompt(options.featureName, options.description, options.projectContext),
      'You are a product analyst that generates feature specifications.',
      8192
    );
    return this.parseSpecResponse(content);
  }

  // Step 2: Generate clarifications
  async generateClarify(options: GenerateClarifyOptions): Promise<ClarificationQuestion[]> {
    const content = await this.callAPI(
      this.buildClarifyPrompt(options.specContent),
      'You are a product analyst that identifies ambiguities and generates clarification questions.',
      4096
    );
    return this.parseClarifyResponse(content);
  }

  // Step 3: Generate plan
  async generatePlan(options: GeneratePlanOptions): Promise<GeneratedPlan> {
    const content = await this.callAPI(
      this.buildPlanPrompt(options.specContent, options.clarifications, options.constitution, options.projectContext),
      'You are a technical architect that generates implementation plans.',
      8192
    );
    return this.parsePlanResponse(content);
  }

  // Step 4: Generate tasks
  async generateTasks(options: GenerateTasksOptions): Promise<GeneratedTasks> {
    const content = await this.callAPI(
      this.buildTasksPrompt(options.specContent, options.planContent),
      'You are a project manager that creates task breakdowns.',
      8192
    );
    return this.parseTasksResponse(content);
  }

  // Step 4.5: Generate checklist - "Unit Tests for Requirements"
  async generateChecklist(options: GenerateChecklistOptions): Promise<GeneratedChecklist> {
    const content = await this.callAPI(
      this.buildChecklistPrompt(options.specContent, options.planContent, options.tasksContent, options.theme),
      'You are a QA analyst that validates requirement quality. Create checklists that test the REQUIREMENTS themselves, not the implementation.',
      8192
    );
    return this.parseChecklistResponse(content);
  }

  // Step 5: Analyze documents
  async analyzeDocuments(options: AnalyzeOptions): Promise<AnalysisResult> {
    const content = await this.callAPI(
      this.buildAnalyzePrompt(options.specContent, options.planContent, options.tasksContent, options.constitution),
      'You are a QA analyst that validates consistency across documents.',
      8192
    );
    return this.parseAnalyzeResponse(content);
  }

  // ============================================
  // Phase 1 Artifacts: Research, Data Model, Quickstart, Contracts
  // ============================================

  // Phase 0: Generate research
  async generateResearch(options: GenerateResearchOptions): Promise<GeneratedResearch> {
    const content = await this.callAPI(
      this.buildResearchPrompt(options.specContent, options.planContent, options.clarifications),
      'You are a technical researcher that investigates technical decisions and best practices.',
      8192
    );
    return this.parseResearchResponse(content);
  }

  // Phase 1: Generate data model
  async generateDataModel(options: GenerateDataModelOptions): Promise<GeneratedDataModel> {
    const content = await this.callAPI(
      this.buildDataModelPrompt(options.specContent, options.planContent, options.researchContent),
      'You are a data architect that designs data models and schemas.',
      8192
    );
    return this.parseDataModelResponse(content);
  }

  // Phase 1: Generate quickstart
  async generateQuickstart(options: GenerateQuickstartOptions): Promise<GeneratedQuickstart> {
    const content = await this.callAPI(
      this.buildQuickstartPrompt(options.specContent, options.planContent, options.dataModelContent),
      'You are a technical writer that creates quickstart guides.',
      8192
    );
    return this.parseQuickstartResponse(content);
  }

  // Phase 1: Generate contracts
  async generateContracts(options: GenerateContractsOptions): Promise<GeneratedContracts> {
    const content = await this.callAPI(
      this.buildContractsPrompt(options.specContent, options.planContent, options.dataModelContent),
      'You are an API designer that creates API contracts and documentation.',
      8192
    );
    return this.parseContractsResponse(content);
  }

  // Generate Constitution
  async generateConstitution(options: GenerateConstitutionOptions): Promise<GeneratedConstitution> {
    const { projectName, projectDescription, existingPrinciples } = options;

    const systemPrompt = `You are an expert software architect specializing in development methodologies and best practices. Generate a project constitution with core principles and suggested sections for AI-assisted development.

Respond with valid JSON in this exact format:
{
  "principles": [
    { "name": "I. Principle Name", "description": "Detailed description of the principle" }
  ],
  "suggestedSections": [
    { "name": "Section Name", "content": "Section content" }
  ]
}`;

    const userPrompt = `Generate a constitution for project "${projectName}".

${projectDescription ? `Project description: ${projectDescription}` : ''}
${existingPrinciples ? `Current principles to improve on:\n${existingPrinciples}` : ''}

Consider:
- Development methodology (TDD, Agile, etc.)
- Code quality standards
- Accessibility requirements
- Testing requirements
- Security practices
- Performance guidelines
- Documentation standards

Generate 5-7 core principles and 2-3 suggested sections.`;

    const content = await this.callAPI(userPrompt, systemPrompt, 4096);
    return this.parseConstitutionResponse(content);
  }

  // ============================================
  // Feature Priority Labeling
  // ============================================

  /**
   * Generate priority label for a single feature
   * Analyzes the feature and determines if it's must_have, nice_to_have, or no_need
   */
  async generatePriority(options: GeneratePriorityOptions): Promise<GeneratedPriority> {
    const content = await this.callAPI(
      this.buildPriorityPrompt(options),
      'You are a product strategist that evaluates feature priorities based on business value, user impact, and technical necessity.',
      2048
    );
    return this.parsePriorityResponse(content);
  }

  /**
   * Generate priority labels for multiple features at once
   * More efficient than calling generatePriority multiple times
   */
  async generateBatchPriority(options: BatchPriorityOptions): Promise<BatchPriorityResult> {
    const content = await this.callAPI(
      this.buildBatchPriorityPrompt(options),
      'You are a product strategist that evaluates feature priorities based on business value, user impact, and technical necessity.',
      4096
    );
    return this.parseBatchPriorityResponse(content);
  }

  // ========================================================================
  // Prompt builders
  // ========================================================================

  async detectViolations(options: ViolationDetectionOptions): Promise<ViolationReport> {
    const codeContext = options.codeFiles
      .map(f => `### ${f.path}\n\`\`\`\n${f.content.substring(0, 5000)}\n\`\`\``)
      .join('\n\n');

    const content = await this.callAPI(
      this.buildViolationPrompt(options.specContent, codeContext, options.planContent, options.tasksContent, options.constitution),
      'You are a QA analyst that compares specifications against actual code implementations to detect violations and divergences.',
      8192
    );
    return this.parseViolationResponse(content);
  }

  private buildUserStoriesPrompt(prdContent: string, projectContext?: string): string {
    return `You are a product analyst. Generate user stories from the following PRD.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
PRD Content:
${prdContent}

Generate user stories in the following JSON format:
{
  "userStories": [
    {
      "id": "US01",
      "title": "Story title",
      "description": "As a [user], I want [action], so that [benefit]",
      "priority": "P1|P2|P3",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildSpecKitPrompt(prdContent: string, featureName: string, projectContext?: string): string {
    return `You are a product analyst and technical writer. Generate a complete spec-kit from the following PRD.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Feature Name: ${featureName}
PRD Content:
${prdContent}

Generate a complete spec-kit in the following JSON format:
{
  "spec": {
    "userStories": [...],
    "clarifications": [{"question": "...", "answer": "..."}]
  },
  "plan": {
    "summary": "...",
    "technicalContext": {
      "language": "...",
      "dependencies": [...],
      "storage": "...",
      "testing": "...",
      "platform": "..."
    }
  },
  "tasks": {
    "phases": [
      {
        "name": "Phase Name",
        "tasks": [{"id": "T001", "description": "...", "userStory": "US01"}]
      }
    ]
  }
}

Return ONLY valid JSON, no other text.`;
  }

  private buildSpecPrompt(featureName: string, description: string, projectContext?: string): string {
    return `You are a product analyst. Generate a feature specification from the following description.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Feature Name: ${featureName}
Description: ${description}

Generate a detailed spec in JSON format:
{
  "userStories": [{"id": "US01", "title": "...", "description": "As a [user], I want [action], so that [benefit]", "priority": "P1|P2|P3", "acceptanceCriteria": ["..."]}],
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "functionalRequirements": ["Requirement 1", "Requirement 2"],
  "successCriteria": ["Success criterion 1", "Success criterion 2"],
  "keyEntities": ["Entity 1", "Entity 2"]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildClarifyPrompt(specContent: string): string {
    return `You are a product analyst. Identify ambiguities in the following spec and generate targeted clarification questions.

Spec Content:
${specContent}

Generate clarification questions in JSON format:
{
  "clarifications": [
    {"question": "Question text", "context": "Why this matters"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildPlanPrompt(
    specContent: string,
    clarifications?: { question: string; answer: string }[],
    constitution?: string,
    projectContext?: string
  ): string {
    return `You are a technical architect. Generate a technical plan based on the spec and clarifications.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Spec Content:
${specContent}
${clarifications?.length ? `\nClarifications:\n${clarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n')}` : ''}
${constitution ? `\nProject Constitution:\n${constitution}` : ''}

Generate a technical plan in JSON format:
{
  "summary": "Brief summary of the implementation approach",
  "technicalContext": {
    "language": "e.g., TypeScript, Python",
    "version": "e.g., 5.0",
    "dependencies": ["dep1", "dep2"],
    "storage": "e.g., PostgreSQL",
    "testing": "e.g., Vitest, Playwright",
    "platform": "e.g., Web, Mobile"
  },
  "projectStructure": {
    "decision": "Why this structure",
    "structure": "Directory structure description"
  }
}

Return ONLY valid JSON, no other text.`;
  }

  private buildTasksPrompt(specContent: string, planContent: string): string {
    return `You are a project manager. Create a task breakdown based on the spec and plan.

Spec Content:
${specContent}

Plan Content:
${planContent}

Generate task breakdown in JSON format:
{
  "phases": [
    {
      "name": "Phase 1: Setup",
      "purpose": "Why this phase",
      "checkpoint": "Exit criteria",
      "tasks": [
        {"id": "T001", "description": "Task description", "userStory": "US01", "parallel": false}
      ]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildChecklistPrompt(
    specContent: string,
    planContent: string,
    tasksContent?: string,
    theme?: string
  ): string {
    const themeSection = theme ? `\nFocus on ${theme} requirements quality.` : '';
    const tasksSection = tasksContent ? `\n\nTasks Content:\n${tasksContent}` : '';

    return `You are a QA analyst that validates requirement quality. Create a checklist as "Unit Tests for Requirements" - validate the QUALITY of requirements, NOT the implementation.

CRITICAL: Each item must test whether the REQUIREMENTS are well-written, NOT whether the code works.

${themeSection}

## Spec Content:
${specContent}

## Plan Content:
${planContent}${tasksSection}

## Checklist Guidelines - "Unit Tests for Requirements":

**Quality Dimensions to Test:**
- Completeness: Are all necessary requirements present?
- Clarity: Are requirements unambiguous and specific?
- Consistency: Do requirements align with each other?
- Measurability: Can requirements be objectively verified?
- Coverage: Are all scenarios/edge cases addressed?

**PROHIBITED Patterns (testing implementation, NOT requirements):**
- ❌ "Verify landing page displays 3 cards"
- ❌ "Test hover states work"
- ❌ "Confirm logo click navigates home"
- ❌ Any item starting with "Verify", "Test", "Confirm", "Check"

**REQUIRED Patterns (testing requirements quality):**
- ✅ "Are the exact number and layout specified?" [Completeness]
- ✅ "Is 'prominent display' quantified with specific sizing?" [Clarity]
- ✅ "Are hover state requirements consistent across elements?" [Consistency]
- ✅ "Is fallback behavior defined when image fails to load?" [Edge Case]

Generate checklist in JSON format:
{
  "theme": "${theme || 'general'}",
  "items": [
    {"id": "CHK001", "question": "Are error handling requirements defined for all API failure modes? [Completeness]", "category": "Completeness", "reference": "[Gap]"},
    {"id": "CHK002", "question": "Is 'fast loading' quantified with specific timing thresholds? [Clarity, Spec §NFR-1]", "category": "Clarity", "reference": "Spec §NFR-1"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private parseChecklistResponse(content: string): GeneratedChecklist {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        theme: parsed.theme || 'general',
        items: parsed.items || []
      };
    } catch (error) {
      console.error('[AI] Failed to parse checklist response:', error);
      // Return empty checklist on parse error
      return { theme: 'general', items: [] };
    }
  }

  private buildAnalyzePrompt(
    specContent: string,
    planContent: string,
    tasksContent: string,
    constitution?: string
  ): string {
    return `You are a QA analyst. Validate consistency across the spec, plan, and tasks documents.

Spec Content:
${specContent}

Plan Content:
${planContent}

Tasks Content:
${tasksContent}
${constitution ? `\nConstitution:\n${constitution}` : ''}

Generate analysis in JSON format:
{
  "isValid": true,
  "specPlanConsistency": {
    "isConsistent": true,
    "score": 85,
    "details": "Explanation of consistency"
  },
  "planTasksConsistency": {
    "isConsistent": true,
    "score": 90,
    "details": "Explanation of consistency"
  },
  "constitutionAlignment": {
    "isConsistent": true,
    "score": 100,
    "details": "Explanation of alignment"
  },
  "issues": [
    {"severity": "warning", "category": "consistency", "message": "Issue description", "location": "spec.md:10"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildViolationPrompt(
    specContent: string,
    codeContext: string,
    planContent?: string,
    tasksContent?: string,
    constitution?: string
  ): string {
    return `You are a QA analyst. Compare the specification against the actual code implementation and identify violations where code diverges from spec.

Spec Content:
${specContent}
${planContent ? `\nPlan Content:\n${planContent}` : ''}
${tasksContent ? `\nTasks Content:\n${tasksContent}` : ''}
${constitution ? `\nConstitution:\n${constitution}` : ''}

Code Files:
${codeContext}

Analyze the code against the spec and generate a violation report in JSON format:
{
  "specConformance": {
    "score": 85,
    "status": "conformant|minor_violations|major_violations"
  },
  "violations": [
    {
      "severity": "error|warning|info",
      "specSection": "Section of spec that is violated",
      "codeFile": "path/to/file.ts",
      "description": "What is wrong",
      "expected": "What the spec says should happen",
      "actual": "What the code actually does"
    }
  ],
  "missingImplementations": ["Spec requirement not found in code"],
  "extraImplementations": ["Code functionality not covered by spec"],
  "summary": "Overall assessment"
}

Rules:
- score 90-100 = conformant, 70-89 = minor_violations, below 70 = major_violations
- Only report real violations, not style differences
- "expected" should quote or reference the spec
- "actual" should reference the code file and behavior

Return ONLY valid JSON, no other text.`;
  }

  // ========================================================================
  // Response parsers
  // ========================================================================

  private parseViolationResponse(content: string): ViolationReport {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          specConformance: parsed.specConformance || { score: 0, status: 'major_violations' },
          violations: parsed.violations || [],
          missingImplementations: parsed.missingImplementations || [],
          extraImplementations: parsed.extraImplementations || [],
          summary: parsed.summary || 'Analysis complete',
        };
      }
    } catch {
      console.error('Failed to parse violation response');
    }
    return {
      specConformance: { score: 0, status: 'major_violations' },
      violations: [],
      missingImplementations: [],
      extraImplementations: [],
      summary: 'Failed to parse violation analysis',
    };
  }

  private parseUserStoriesResponse(content: string): GeneratedUserStory[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.userStories || parsed.stories || [];
      }
      return [];
    } catch {
      console.error('Failed to parse user stories response');
      return [];
    }
  }

  private parseSpecKitResponse(content: string): GeneratedSpecKit {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed as GeneratedSpecKit;
      }
    } catch {
      console.error('Failed to parse spec-kit response');
    }
    return {
      spec: { userStories: [], clarifications: [] },
      plan: { summary: '', technicalContext: { language: '', dependencies: [], storage: '', testing: '', platform: '' } },
      tasks: { phases: [] }
    };
  }

  private parseSpecResponse(content: string): GeneratedSpec {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          userStories: parsed.userStories || [],
          edgeCases: parsed.edgeCases || [],
          functionalRequirements: parsed.functionalRequirements || [],
          successCriteria: parsed.successCriteria || [],
          keyEntities: parsed.keyEntities || []
        };
      }
    } catch {
      console.error('Failed to parse spec response');
    }
    return {
      userStories: [],
      edgeCases: [],
      functionalRequirements: [],
      successCriteria: [],
      keyEntities: []
    };
  }

  private parseClarifyResponse(content: string): ClarificationQuestion[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.clarifications || parsed.questions || [];
      }
    } catch {
      console.error('Failed to parse clarify response');
    }
    return [];
  }

  private parsePlanResponse(content: string): GeneratedPlan {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          technicalContext: parsed.technicalContext || { language: '', dependencies: [], storage: '', testing: '', platform: '' },
          projectStructure: parsed.projectStructure || { decision: '', structure: '' },
          complexityViolations: parsed.complexityViolations || []
        };
      }
    } catch {
      console.error('Failed to parse plan response');
    }
    return {
      summary: '',
      technicalContext: { language: '', dependencies: [], storage: '', testing: '', platform: '' },
      projectStructure: { decision: '', structure: '' }
    };
  }

  private parseTasksResponse(content: string): GeneratedTasks {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { phases: parsed.phases || [] };
      }
    } catch {
      console.error('Failed to parse tasks response');
    }
    return { phases: [] };
  }

  private parseAnalyzeResponse(content: string): AnalysisResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValid: parsed.isValid ?? true,
          specPlanConsistency: parsed.specPlanConsistency || { isConsistent: true, score: 100, details: '' },
          planTasksConsistency: parsed.planTasksConsistency || { isConsistent: true, score: 100, details: '' },
          constitutionAlignment: parsed.constitutionAlignment || { isConsistent: true, score: 100, details: '' },
          issues: parsed.issues || []
        };
      }
    } catch {
      console.error('Failed to parse analyze response');
    }
    return {
      isValid: true,
      specPlanConsistency: { isConsistent: true, score: 100, details: '' },
      planTasksConsistency: { isConsistent: true, score: 100, details: '' },
      constitutionAlignment: { isConsistent: true, score: 100, details: '' },
      issues: []
    };
  }

  private parseConstitutionResponse(content: string): GeneratedConstitution {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          principles: parsed.principles || [],
          suggestedSections: parsed.suggestedSections || []
        };
      }
    } catch {
      console.error('Failed to parse constitution response');
    }
    return {
      principles: [],
      suggestedSections: []
    };
  }

  // ============================================
  // Phase 1 Build Prompts & Parse Methods
  // ============================================

  private buildResearchPrompt(
    specContent: string,
    planContent: string,
    clarifications?: { question: string; answer: string }[]
  ): string {
    return `You are a technical researcher. Investigate technical decisions and provide research findings.

Spec Content:
${specContent}

Plan Content:
${planContent}
${clarifications?.length ? `\nClarifications:\n${clarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n')}` : ''}

Generate research findings in JSON format:
{
  "overview": "Brief overview of research scope",
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed research content",
      "bullets": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildDataModelPrompt(
    specContent: string,
    planContent: string,
    researchContent?: string
  ): string {
    const researchSection = researchContent ? `\nResearch Content:\n${researchContent}` : '';
    return `You are a data architect. Design a data model based on the spec and plan.

Spec Content:
${specContent}

Plan Content:
${planContent}${researchSection}

Generate data model in JSON format:
{
  "overview": "Brief overview of the data model",
  "entities": [
    {
      "name": "EntityName",
      "description": "What this entity represents",
      "fields": [
        {"name": "fieldName", "type": "string", "required": true, "description": "Field description"}
      ]
    }
  ],
  "relationships": [
    {"from": "EntityA", "to": "EntityB", "type": "one-to-many", "description": "How entities relate"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildQuickstartPrompt(
    specContent: string,
    planContent: string,
    dataModelContent?: string
  ): string {
    const dataModelSection = dataModelContent ? `\nData Model:\n${dataModelContent}` : '';
    return `You are a technical writer. Create a quickstart guide.

Spec Content:
${specContent}

Plan Content:
${planContent}${dataModelSection}

Generate quickstart guide in JSON format:
{
  "overview": "Brief overview of what the user will build",
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "steps": [
    {
      "title": "Step 1: Do Something",
      "content": "Detailed instructions",
      "code": "optional code example",
      "language": "javascript"
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildContractsPrompt(
    specContent: string,
    planContent: string,
    dataModelContent?: string
  ): string {
    const dataModelSection = dataModelContent ? `\nData Model:\n${dataModelContent}` : '';
    return `You are an API designer. Create API contracts.

Spec Content:
${specContent}

Plan Content:
${planContent}${dataModelSection}

Generate API contracts in JSON format:
{
  "contracts": [
    {
      "name": "GetUsers",
      "description": "Get all users",
      "endpoint": "/api/users",
      "method": "GET",
      "request": {
        "headers": {"Authorization": "Bearer token"},
        "queryParams": {"page": "page number"}
      },
      "response": {
        "status": 200,
        "body": {"users": []}
      },
      "errors": [
        {"status": 401, "message": "Unauthorized"}
      ]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private parseResearchResponse(content: string): GeneratedResearch {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          sections: parsed.sections || []
        };
      }
    } catch {
      console.error('Failed to parse research response');
    }
    return { overview: '', sections: [] };
  }

  private parseDataModelResponse(content: string): GeneratedDataModel {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          entities: parsed.entities || [],
          relationships: parsed.relationships || []
        };
      }
    } catch {
      console.error('Failed to parse data model response');
    }
    return { overview: '', entities: [], relationships: [] };
  }

  private parseQuickstartResponse(content: string): GeneratedQuickstart {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          prerequisites: parsed.prerequisites || [],
          steps: parsed.steps || []
        };
      }
    } catch {
      console.error('Failed to parse quickstart response');
    }
    return { overview: '', prerequisites: [], steps: [] };
  }

  private parseContractsResponse(content: string): GeneratedContracts {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          contracts: parsed.contracts || []
        };
      }
    } catch {
      console.error('Failed to parse contracts response');
    }
    return { contracts: [] };
  }

  // ========================================================================
  // Priority Labeling - Prompt Builders & Parsers
  // ========================================================================

  private buildPriorityPrompt(options: GeneratePriorityOptions): string {
    const existingFeaturesContext = options.existingFeatures?.length
      ? `\nExisting features in this project:\n${options.existingFeatures.map(f => `- ${f.name}${f.priority ? ` (${f.priority})` : ''}: ${f.description || 'No description'}`).join('\n')}`
      : '';

    return `Analyze this feature and determine its priority level.

Feature Name: ${options.featureName}
${options.featureDescription ? `Description: ${options.featureDescription}` : ''}
${options.specContent ? `\nSpec Content:\n${options.specContent.substring(0, 2000)}` : ''}
${options.projectDescription ? `\nProject Description: ${options.projectDescription}` : ''}
${options.constitution ? `\nProject Constitution/Principles:\n${options.constitution.substring(0, 1000)}` : ''}
${existingFeaturesContext}

Priority levels:
- must_have: Core functionality, critical for MVP, directly impacts primary user goals, or required by constitution/principles
- nice_to_have: Enhances UX, adds value but not critical, can be deferred to later versions
- no_need: Out of scope, duplicates existing features, low ROI, or conflicts with project goals

Consider:
1. User impact: How many users does this affect? How important is it for their workflow?
2. Business value: Does this directly contribute to project goals?
3. Technical necessity: Is this required for other features to work?
4. Constitution alignment: Does this align with project principles?
5. Scope fit: Is this within the defined scope of the project?

Respond with valid JSON:
{
  "priority": "must_have" | "nice_to_have" | "no_need",
  "reason": "Concise explanation (2-3 sentences) for why this priority was assigned",
  "confidence": 0-100
}

Return ONLY valid JSON, no other text.`;
  }

  private buildBatchPriorityPrompt(options: BatchPriorityOptions): string {
    const featuresContext = options.features.map(f => 
      `- ID: ${f.id}\n  Name: ${f.name}\n  Description: ${f.description || 'No description'}${f.specContent ? `\n  Spec excerpt: ${f.specContent.substring(0, 500)}...` : ''}`
    ).join('\n\n');

    return `Analyze these features and determine priority levels for each.

${options.projectDescription ? `Project Description: ${options.projectDescription}\n` : ''}
${options.constitution ? `Project Constitution/Principles:\n${options.constitution.substring(0, 1000)}\n` : ''}

Features to analyze:
${featuresContext}

Priority levels:
- must_have: Core functionality, critical for MVP, directly impacts primary user goals
- nice_to_have: Enhances UX, adds value but not critical, can be deferred
- no_need: Out of scope, duplicates, low ROI, or conflicts with goals

Respond with valid JSON:
{
  "features": [
    {
      "id": "feature_id",
      "priority": "must_have" | "nice_to_have" | "no_need",
      "reason": "Brief explanation",
      "confidence": 0-100
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private parsePriorityResponse(content: string): GeneratedPriority {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const priority = parsed.priority;
        
        // Validate priority value
        if (!['must_have', 'nice_to_have', 'no_need'].includes(priority)) {
          console.error(`Invalid priority value: ${priority}`);
          return { priority: 'nice_to_have', reason: 'Could not determine priority', confidence: 0 };
        }
        
        return {
          priority: priority as 'must_have' | 'nice_to_have' | 'no_need',
          reason: parsed.reason || 'No reason provided',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50
        };
      }
    } catch (error) {
      console.error('Failed to parse priority response:', error);
    }
    return { priority: 'nice_to_have', reason: 'Could not determine priority', confidence: 0 };
  }

  private parseBatchPriorityResponse(content: string): BatchPriorityResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (Array.isArray(parsed.features)) {
          return {
            features: parsed.features.map((f: { id: string; priority?: string; reason?: string; confidence?: number }) => ({
              id: f.id,
              priority: ['must_have', 'nice_to_have', 'no_need'].includes(f.priority || '')
                ? f.priority as 'must_have' | 'nice_to_have' | 'no_need'
                : 'nice_to_have',
              reason: f.reason || 'No reason provided',
              confidence: typeof f.confidence === 'number' ? f.confidence : 50
            }))
          };
        }
      }
    } catch (error) {
      console.error('Failed to parse batch priority response:', error);
    }
    return { features: [] };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for custom configurations
export { AIService };
