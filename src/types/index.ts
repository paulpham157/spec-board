export type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';

// User Story types for spec.md parsing (T001)
export interface UserStory {
  id: string;           // 'US1', 'US2', etc.
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  description: string;
  acceptanceCriteria: string[];
}

// Technical Context types for plan.md parsing (T002)
export interface TechnicalContext {
  language: string;
  dependencies: string[];
  storage: string;
  testing: string;
  platform: string;
}

// Task Group types for user story grouping (T003)
export interface TaskGroup {
  storyId: string | null;  // 'US1', 'US2', or null for ungrouped
  storyTitle: string;      // From spec.md or "Other Tasks"
  tasks: Task[];
  completedCount: number;
  totalCount: number;
}

// Spec-Kit File types for additional files (T004)
export type SpecKitFileType = 'spec' | 'plan' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contract' | 'checklist' | 'analysis';

export interface SpecKitFile {
  type: SpecKitFileType;
  path: string;
  content: string;
  exists: boolean;
  // Per-file checklist progress (only for type='checklist')
  checklistProgress?: { completed: number; total: number };
}

// Analysis types for spec alignment tracking

/** Single saved analysis report file (T001) */
export interface AnalysisReport {
  filename: string;      // e.g., "2026-01-03-16-30-analysis.md"
  timestamp: string;     // ISO date extracted from filename
  path: string;          // Full filesystem path
  content: string;       // Markdown content
}

/** Collection of analysis reports for a feature (T002) */
export interface FeatureAnalysis {
  reports: AnalysisReport[];           // All reports, sorted newest first
  // Backwards compatibility with existing code
  markdownContent: string | null;      // Latest report content
  markdownPath: string | null;         // Latest report path
}

// Clarification types for tracking Q&A history
export interface Clarification {
  question: string;
  answer: string;
}

export interface ClarificationSession {
  date: string; // YYYY-MM-DD format
  clarifications: Clarification[];
}

// Constitution types for project-level principles
export interface ConstitutionPrinciple {
  name: string;
  description: string;
}

export interface ConstitutionSubsection {
  name: string;
  content: string;
}

export interface ConstitutionSection {
  name: string;
  content: string;
  subsections: ConstitutionSubsection[];
}

// Sync Impact Report from constitution.md HTML comment
export interface SyncImpactReport {
  versionChange?: string;        // e.g., "0.0.0 → 1.0.0 (Initial ratification)"
  modifiedPrinciples?: string;
  addedSections: string[];
  removedSections: string[];
  templatesStatus: { template: string; status: string }[];
  followUpTodos?: string;
}

export interface Constitution {
  rawContent: string;
  title?: string;
  principles: ConstitutionPrinciple[];
  sections: ConstitutionSection[];
  version?: string;
  ratifiedDate?: string;
  lastAmendedDate?: string;
  syncImpactReport?: SyncImpactReport;
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  parallel: boolean;
  userStory?: string;
  filePath?: string;
}

// Content block types for preserving interleaved order in phases
export type PhaseContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'task'; task: Task };

export interface TaskPhase {
  name: string;
  description?: string;  // Phase description (e.g., **Purpose**: ...) - kept for backwards compat
  tasks: Task[];         // All tasks in phase - kept for backwards compat
  contentBlocks: PhaseContentBlock[];  // Ordered content blocks preserving interleaved structure
}

export interface Feature {
  id: string;
  name: string;
  path: string;
  stage: FeatureStage;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  tasks: Task[];
  phases: TaskPhase[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  // Feature branch name from spec.md or plan.md
  branch: string | null;
  // Clarification history from spec.md
  clarificationSessions: ClarificationSession[];
  totalClarifications: number;
  // Extended fields for full spec-kit integration (T005)
  userStories: UserStory[];
  technicalContext: TechnicalContext | null;
  taskGroups: TaskGroup[];
  specContent: string | null;
  planContent: string | null;
  tasksContent: string | null;
  additionalFiles: SpecKitFile[];
  // Analysis data for spec alignment tracking
  analysis: FeatureAnalysis | null;
  // Checklist completion tracking
  hasChecklists: boolean;
  totalChecklistItems: number;
  completedChecklistItems: number;
}

export interface Project {
  path: string;
  name: string;
  features: Feature[];
  lastUpdated: Date;
  // Project-level constitution
  constitution: Constitution | null;
  hasConstitution: boolean;
}

export interface WebSocketMessage {
  type: 'update' | 'error' | 'connected';
  data?: Project;
  error?: string;
}

// ============================================
// Parsed Markdown Types for Structured Viewers
// ============================================

// Plan.md parsed types
export interface PlanMetadata {
  branch?: string;
  date?: string;
  specLink?: string;
  input?: string;
}

export interface ConstitutionCheckItem {
  principle: string;
  requirement: string;
  status: string;
}

export interface ConstitutionCheckData {
  items: ConstitutionCheckItem[];
  note?: string;
}

export interface ComplexityItem {
  aspect: string;
  decision: string;
  rationale: string;
}

export interface ProjectStructureItem {
  title: string;
  codeBlock: string;
  description?: string;
}

export interface ComplexityTrackingData {
  items: ComplexityItem[];
  note?: string;
}

export interface PlanSection {
  title: string;
  content: string;
}

export interface ParsedPlan {
  rawContent: string;
  metadata: PlanMetadata;
  summary?: string;
  technicalContext: Record<string, string>;
  constitutionCheck: ConstitutionCheckData;
  qualityGates: string[];
  projectStructure: ProjectStructureItem[];
  complexityTracking: ComplexityTrackingData;
  otherSections: PlanSection[];
}

// Research.md parsed types
export interface TechnologyDecision {
  id: number;
  title: string;
  decision: string;
  rationale: string[];
  alternatives: { name: string; reason: string }[];
}

export interface ResearchSection {
  title: string;
  content: string;
}

export interface ParsedResearch {
  rawContent: string;
  feature?: string;
  date?: string;
  technologyDecisions: TechnologyDecision[];
  otherSections: ResearchSection[];
}

// Quickstart.md parsed types
export interface SetupStep {
  id: number;
  title: string;
  commands: { description?: string; code: string; language?: string }[];
}

export interface VerificationItem {
  text: string;
  checked: boolean;
}

export interface VerificationData {
  intro?: string;
  items: VerificationItem[];
}

export interface KeyFilesData {
  intro?: string;
  files: string[];
}

export interface BrowserSupportSubsection {
  intro: string;
  items: string[];
}

export interface BrowserSupportData {
  subsections: BrowserSupportSubsection[];
}

export interface QuickstartSection {
  title: string;
  content: string;
}

// Development section with subsections and code blocks
export interface DevelopmentSubsection {
  title: string;
  content: string;
  codeBlocks: { language?: string; code: string }[];
}

export interface DevelopmentSection {
  intro?: string;
  subsections: DevelopmentSubsection[];
  codeBlocks: { language?: string; code: string }[];
}

// Section types for ordering
export type QuickstartSectionType =
  | 'prerequisites'
  | 'setupSteps'
  | 'development'
  | 'developmentCommands'
  | 'projectScripts'
  | 'verification'
  | 'keyFiles'
  | 'browserSupport'
  | 'other';

export interface QuickstartSectionOrder {
  type: QuickstartSectionType;
  title: string;
  otherIndex?: number; // Index into otherSections array for 'other' type
}

export interface ParsedQuickstart {
  rawContent: string;
  feature?: string;
  date?: string;
  sectionOrder: QuickstartSectionOrder[]; // Order of sections as they appear in markdown
  sectionTitles: {
    prerequisites?: string;
    setupSteps?: string;
    verification?: string;
    keyFiles?: string;
    browserSupport?: string;
    developmentCommands?: string;
    development?: string;
    projectScripts?: string;
  };
  prerequisites: string[];
  setupSteps: SetupStep[];
  development?: DevelopmentSection;
  developmentCommands: { title: string; command: string; description?: string }[];
  projectScripts?: { title: string; content: string };
  verificationChecklist: VerificationData;
  keyFilesToCreate: KeyFilesData;
  browserSupport: BrowserSupportData;
  otherSections: QuickstartSection[];
}

// Data-model.md parsed types
export interface EntityProperty {
  name: string;
  type: string;
  description?: string;
}

export interface DataEntity {
  name: string;
  description?: string;
  properties: EntityProperty[];
  codeBlock?: string;
}

export interface DataEnum {
  name: string;
  values: { name: string; value: string; description?: string }[];
  codeBlock?: string;
}

export interface ValidationRule {
  field: string;
  rules: string[];
}

export interface StateTransition {
  state: string;
  condition: string;
  transitionsTo: string[];
}

export interface StateTransitionSubsection {
  title: string;
  codeBlock?: string;
  description?: string;
  transitions?: StateTransition[];
}

export interface StateTransitionsData {
  subsections: StateTransitionSubsection[];
}

export interface StorageSchemaKey {
  key: string;
  type: string;
  description: string;
}

export interface StorageSchemaSubsection {
  title: string;
  keys?: StorageSchemaKey[];
  codeBlock?: string;
  description?: string;
}

export interface StorageSchemaData {
  subsections: StorageSchemaSubsection[];
  note?: string;
}

export interface DataIntegrityRule {
  title: string;
  items: string[];
}

export interface DataModelSection {
  title: string;
  content: string;
}

export interface ParsedDataModel {
  rawContent: string;
  feature?: string;
  date?: string;
  entities: DataEntity[];
  enums: DataEnum[];
  validationRules: ValidationRule[];
  stateTransitions: StateTransitionsData;
  storageSchema: StorageSchemaData;
  sortingBehavior: { option: string; description: string }[];
  filteringBehavior: { filter: string; condition: string }[];
  searchBehavior: string[];
  dataIntegrity: DataIntegrityRule[];
  otherSections: DataModelSection[];
}

// ============================================
// Keyboard Shortcuts Types (005-quick-shortcut)
// ============================================

/** Category for grouping shortcuts in help overlay */
export type ShortcutCategory = 'navigation' | 'actions' | 'help';

/** Context where shortcut is active */
export type ShortcutContext = 'global' | 'kanban' | 'feature-detail' | 'modal';

/** Keyboard shortcut definition */
export interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: ShortcutCategory;
  context: ShortcutContext;
  action: string;
}

/** Kanban column type for focus tracking */
export type KanbanColumnType = 'backlog' | 'planning' | 'in_progress' | 'done';

/** Focus state for keyboard navigation on Kanban board */
export interface FocusState {
  column: KanbanColumnType | null;
  cardIndex: number | null;
  featureId: string | null;
}
