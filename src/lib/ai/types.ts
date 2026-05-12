/**
 * AI Service Types - Compatible with Claude & OpenAI API formats
 * Designed for easy swapping between mock and real AI providers
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  model?: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Provider types
export type AIProvider = 'openai' | 'qwen' | 'codex' | 'kimi' | 'iflow' | 'anthropic' | 'gemini' | 'mistral';

// Configuration
export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string; // For custom endpoints
}

// Generation workflow types - aligned with Speckit workflow
// specify → clarify → plan → tasks → analyze

// Step 1: Specify - Generate spec from feature description
export interface GenerateSpecOptions {
  featureName: string;
  description: string;
  projectContext?: string;
}

export interface GeneratedSpec {
  userStories: GeneratedUserStory[];
  edgeCases: string[];
  functionalRequirements: string[];
  successCriteria: string[];
  keyEntities: string[];
}

// Step 2: Clarify - Generate clarification questions
export interface GenerateClarifyOptions {
  specContent: string;
}

export interface ClarificationQuestion {
  question: string;
  context: string;
}

// Step 3: Plan - Generate technical plan
export interface GeneratePlanOptions {
  specContent: string;
  clarifications?: ClarificationAnswer[];
  constitution?: string;
  projectContext?: string;
}

export interface ClarificationAnswer {
  question: string;
  answer: string;
}

export interface GeneratedPlan {
  summary: string;
  technicalContext: TechnicalContext;
  projectStructure: ProjectStructure;
  complexityViolations?: ComplexityViolation[];
}

export interface TechnicalContext {
  language: string;
  version?: string;
  dependencies: string[];
  storage: string;
  testing: string;
  platform: string;
  performanceGoals?: string;
  constraints?: string;
}

export interface ProjectStructure {
  decision: string;
  structure: string;
}

export interface ComplexityViolation {
  violation: string;
  reason: string;
  rejectedAlternative: string;
}

// Step 4: Tasks - Generate task breakdown
export interface GenerateTasksOptions {
  specContent: string;
  planContent: string;
}

export interface GeneratedTasks {
  phases: TaskPhase[];
}

export interface TaskPhase {
  name: string;
  purpose: string;
  checkpoint?: string;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: string;
  description: string;
  userStory?: string;
  parallel?: boolean;
  priority?: string;
}

// Step 4.5: Checklist - Generate requirements quality checklist
export interface GenerateChecklistOptions {
  specContent: string;
  planContent: string;
  tasksContent?: string;
  theme?: string; // Optional theme like 'security', 'ux', 'api'
}

export interface GeneratedChecklist {
  items: ChecklistItem[];
  theme: string;
}

export interface ChecklistItem {
  id: string; // CHK001, CHK002, etc.
  question: string;
  category: string; // Completeness, Clarity, Consistency, etc.
  reference?: string; // Spec §X.Y or [Gap], [Ambiguity], etc.
}

// Step 5: Analyze - Validate consistency
export interface AnalyzeOptions {
  specContent: string;
  planContent: string;
  tasksContent: string;
  constitution?: string;
}

export interface AnalysisResult {
  isValid: boolean;
  specPlanConsistency: ConsistencyCheck;
  planTasksConsistency: ConsistencyCheck;
  constitutionAlignment: ConsistencyCheck;
  issues: AnalysisIssue[];
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  score: number; // 0-100
  details: string;
}

export interface AnalysisIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'consistency' | 'alignment' | 'completeness';
  message: string;
  location?: string;
}

// Legacy types - kept for backward compatibility
export interface GenerateUserStoriesOptions {
  prdContent: string;
  projectContext?: string;
}

export interface GenerateSpecKitOptions {
  prdContent: string;
  featureName: string;
  projectContext?: string;
}

// Constitution generation
export interface GenerateConstitutionOptions {
  projectName: string;
  projectDescription?: string;
  existingPrinciples?: string; // Current principles to improve on
}

export interface GeneratedPrinciple {
  name: string;
  description: string;
}

export interface GeneratedConstitution {
  principles: GeneratedPrinciple[];
  suggestedSections: Array<{ name: string; content: string }>;
}

// Output types
export interface GeneratedUserStory {
  id: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  acceptanceCriteria: string[];
}

export interface GeneratedSpecKit {
  spec: {
    userStories: GeneratedUserStory[];
    clarifications: Array<{ question: string; answer: string }>;
  };
  plan: {
    summary: string;
    technicalContext: {
      language: string;
      dependencies: string[];
      storage: string;
      testing: string;
      platform: string;
    };
  };
  tasks: {
    phases: Array<{
      name: string;
      tasks: Array<{
        id: string;
        description: string;
        userStory?: string;
      }>;
    }>;
  };
}

// ============================================
// Phase 1 Artifacts: Research, Data Model, Quickstart, Contracts
// ============================================

// Generate Research - Phase 0 of plan workflow
export interface GenerateResearchOptions {
  specContent: string;
  planContent: string;
  clarifications?: ClarificationAnswer[];
}

export interface GeneratedResearch {
  overview: string;
  sections: ResearchSection[];
}

export interface ResearchSection {
  title: string;
  content: string;
  bullets: string[];
}

// Generate Data Model - Phase 1 of plan workflow
export interface GenerateDataModelOptions {
  specContent: string;
  planContent: string;
  researchContent?: string;
}

export interface GeneratedDataModel {
  overview: string;
  entities: DataModelEntity[];
  relationships: DataModelRelationship[];
}

export interface DataModelEntity {
  name: string;
  description: string;
  fields: DataModelField[];
}

export interface DataModelField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface DataModelRelationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  description?: string;
}

// Generate Quickstart - Phase 1 of plan workflow
export interface GenerateQuickstartOptions {
  specContent: string;
  planContent: string;
  dataModelContent?: string;
}

export interface GeneratedQuickstart {
  overview: string;
  prerequisites: string[];
  steps: QuickstartStep[];
}

export interface QuickstartStep {
  title: string;
  content: string;
  code?: string;
  language?: string;
}

// Generate Contracts - Phase 1 of plan workflow
export interface GenerateContractsOptions {
  specContent: string;
  planContent: string;
  dataModelContent?: string;
}

export interface GeneratedContracts {
  contracts: ApiContract[];
}

export interface ApiContract {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  request: ContractRequest;
  response: ContractResponse;
  errors: ContractError[];
}

export interface ContractRequest {
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}

export interface ContractResponse {
  status: number;
  body?: Record<string, unknown>;
}

export interface ContractError {
  status: number;
  message: string;
}

// ============================================================================
// Structured Spec Template
// ============================================================================

export interface Requirement {
  id: string;
  description: string;
  priority?: 'MUST' | 'SHOULD' | 'MAY';
}

export interface StructuredSpec {
  problemStatement: string;
  userStories: GeneratedUserStory[];
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];
  edgeCases: string[];
  dataModel: string;
  apiContracts: string;
  successCriteria: string[];
  keyEntities: string[];
}

// ============================================================================
// Multi-Agent Orchestration
// ============================================================================

export interface StageResult {
  stage: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  content: string;
  issues?: string[];
}

export interface OrchestrationResult {
  stages: StageResult[];
  summary: string;
  totalDuration: number;
}

// ============================================================================
// Spec Violation Detection
// ============================================================================

export interface LocalCodeSource {
  type: 'local';
  path: string;
  include?: string[];
  exclude?: string[];
}

export interface GitHubCodeSource {
  type: 'github';
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  token?: string;
}

export type CodeSource = LocalCodeSource | GitHubCodeSource;

export interface ViolationDetectionOptions {
  specContent: string;
  planContent?: string;
  tasksContent?: string;
  codeFiles: CodeFile[];
  constitution?: string;
}

export interface CodeFile {
  path: string;
  content: string;
}

export interface Violation {
  severity: 'error' | 'warning' | 'info';
  specSection: string;
  codeFile: string;
  description: string;
  expected: string;
  actual: string;
}

export interface ViolationReport {
  specConformance: {
    score: number;
    status: 'conformant' | 'minor_violations' | 'major_violations';
  };
  violations: Violation[];
  missingImplementations: string[];
  extraImplementations: string[];
  summary: string;
}

// ============================================================================
// Feature Priority Labeling
// ============================================================================

export type FeaturePriorityValue = 'must_have' | 'nice_to_have' | 'no_need';

export interface GeneratePriorityOptions {
  featureName: string;
  featureDescription?: string;
  specContent?: string;
  projectDescription?: string;
  constitution?: string;
  existingFeatures?: Array<{ name: string; description?: string; priority?: string }>;
}

export interface GeneratedPriority {
  priority: FeaturePriorityValue;
  reason: string;
  confidence: number; // 0-100
}

export interface BatchPriorityOptions {
  projectDescription?: string;
  constitution?: string;
  features: Array<{
    id: string;
    name: string;
    description?: string;
    specContent?: string;
  }>;
}

export interface BatchPriorityResult {
  features: Array<{
    id: string;
    priority: FeaturePriorityValue;
    reason: string;
    confidence: number;
  }>;
}
