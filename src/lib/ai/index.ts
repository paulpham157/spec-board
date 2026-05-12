// AI Service exports
export * from './types';
export * from './settings';
export { AIService, aiService } from './client';
export { validateSpecCompleteness, SPEC_TEMPLATE_SECTIONS } from './spec-template';
export { orchestratePipeline } from './orchestrator';
export { readCode, readLocalCode, readGitHubCode } from './violation-detector';

import { aiService } from './client';
import { getAISettings } from './settings';
import type {
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GenerateSpecOptions,
  GenerateClarifyOptions,
  GeneratePlanOptions,
  GenerateTasksOptions,
  GenerateChecklistOptions,
  AnalyzeOptions,
  ViolationDetectionOptions,
  GeneratedUserStory,
  GeneratedSpecKit,
  GeneratedSpec,
  ClarificationQuestion,
  GeneratedPlan,
  GeneratedTasks,
  GeneratedChecklist,
  AnalysisResult,
  ViolationReport,
  AIProvider,
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

/**
 * Get current AI provider from settings
 * @throws Error if no API key is configured
 */
export async function getProvider(): Promise<AIProvider> {
  const settings = await getAISettings();

  // Only OpenAI-compatible API supported
  if (settings.provider === 'openai' && settings.apiKey) {
    return 'openai';
  }

  throw new Error(
    'Please configure AI settings before using this feature.'
  );
}

// Wrapper functions that use AIService
export async function generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
  const provider = await getProvider();
  console.log(`[AI] Generating user stories with ${provider}`);

  return aiService.generateUserStories(options);
}

export async function generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
  const provider = await getProvider();
  console.log(`[AI] Generating spec-kit with ${provider}`);

  return aiService.generateSpecKit(options);
}

// ============================================================================
// Speckit-aligned workflow: specify → clarify → plan → tasks → analyze
// ============================================================================

/**
 * Step 1: Specify - Generate feature specification from description
 * Creates spec.md with user stories, edge cases, requirements, success criteria
 */
export async function generateSpec(options: GenerateSpecOptions): Promise<GeneratedSpec> {
  const provider = await getProvider();
  console.log(`[AI] Generating spec with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateSpec(options);
}

/**
 * Step 2: Clarify - Generate clarification questions based on spec
 * Identifies ambiguities and generates targeted questions
 */
export async function generateClarify(options: GenerateClarifyOptions): Promise<ClarificationQuestion[]> {
  const provider = await getProvider();
  console.log(`[AI] Generating clarifications with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateClarify(options);
}

/**
 * Step 3: Plan - Generate technical plan based on spec and clarifications
 * Creates plan.md with technical context and project structure
 */
export async function generatePlan(options: GeneratePlanOptions): Promise<GeneratedPlan> {
  const provider = await getProvider();
  console.log(`[AI] Generating plan with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generatePlan(options);
}

/**
 * Step 4: Tasks - Generate task breakdown based on spec and plan
 * Creates tasks.md with phased task list
 */
export async function generateTasks(options: GenerateTasksOptions): Promise<GeneratedTasks> {
  const provider = await getProvider();
  console.log(`[AI] Generating tasks with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateTasks(options);
}

/**
 * Step 4.5: Checklist - Generate requirements quality checklist
 * Creates checklist items as "Unit Tests for Requirements"
 * Validates spec/plan/tasks quality: completeness, clarity, consistency
 */
export async function generateChecklist(options: GenerateChecklistOptions): Promise<GeneratedChecklist> {
  const provider = await getProvider();
  console.log(`[AI] Generating checklist with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateChecklist(options);
}

/**
 * Step 5: Analyze - Validate consistency across spec, plan, and tasks
 * Returns analysis report with issues and scores
 */
export async function analyzeDocuments(options: AnalyzeOptions): Promise<AnalysisResult> {
  const provider = await getProvider();
  console.log(`[AI] Analyzing documents with ${provider}`);

  // Use AIService for analysis - throws if no API key
  return aiService.analyzeDocuments(options);
}

/**
 * Generate Constitution - Create project constitution with AI
 * Returns principles and suggested sections based on project context
 */
export async function generateConstitution(options: {
  projectName: string;
  projectDescription?: string;
  existingPrinciples?: string;
}): Promise<{
  principles: Array<{ name: string; description: string }>;
  suggestedSections: Array<{ name: string; content: string }>;
}> {
  console.log(`[AI] Generating constitution...`);
  return aiService.generateConstitution(options);
}

// ============================================================================
// Phase 1 Artifacts: Research, Data Model, Quickstart, Contracts
// ============================================================================

/**
 * Phase 0: Research - Investigate technical decisions and best practices
 * Creates research.md with findings and recommendations
 */
export async function generateResearch(options: GenerateResearchOptions): Promise<GeneratedResearch> {
  const provider = await getProvider();
  console.log(`[AI] Generating research with ${provider}`);

  return aiService.generateResearch(options);
}

/**
 * Phase 1: Data Model - Design data schema and relationships
 * Creates data-model.md with entity definitions
 */
export async function generateDataModel(options: GenerateDataModelOptions): Promise<GeneratedDataModel> {
  const provider = await getProvider();
  console.log(`[AI] Generating data model with ${provider}`);

  return aiService.generateDataModel(options);
}

/**
 * Phase 1: Quickstart - Create getting started guide
 * Creates quickstart.md with installation and setup steps
 */
export async function generateQuickstart(options: GenerateQuickstartOptions): Promise<GeneratedQuickstart> {
  const provider = await getProvider();
  console.log(`[AI] Generating quickstart with ${provider}`);

  return aiService.generateQuickstart(options);
}

/**
 * Phase 1: Contracts - Design API contracts
 * Creates contracts (JSON) with endpoint definitions
 */
export async function generateContracts(options: GenerateContractsOptions): Promise<GeneratedContracts> {
  const provider = await getProvider();
  console.log(`[AI] Generating contracts with ${provider}`);

  return aiService.generateContracts(options);
}

export async function detectViolations(options: ViolationDetectionOptions): Promise<ViolationReport> {
  const provider = await getProvider();
  console.log(`[AI] Detecting spec violations with ${provider}`);

  return aiService.detectViolations(options);
}

// ============================================================================
// Feature Priority Labeling
// ============================================================================

/**
 * Generate priority label for a single feature
 * Analyzes the feature and determines if it's must_have, nice_to_have, or no_need
 */
export async function generatePriority(options: GeneratePriorityOptions): Promise<GeneratedPriority> {
  const provider = await getProvider();
  console.log(`[AI] Generating priority label with ${provider}`);

  return aiService.generatePriority(options);
}

/**
 * Generate priority labels for multiple features at once
 * More efficient than calling generatePriority multiple times
 */
export async function generateBatchPriority(options: BatchPriorityOptions): Promise<BatchPriorityResult> {
  const provider = await getProvider();
  console.log(`[AI] Generating batch priority labels with ${provider}`);

  return aiService.generateBatchPriority(options);
}
