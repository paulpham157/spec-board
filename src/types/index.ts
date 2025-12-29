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
export type SpecKitFileType = 'spec' | 'plan' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contract' | 'checklist';

export interface SpecKitFile {
  type: SpecKitFileType;
  path: string;
  content: string;
  exists: boolean;
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

export interface ConstitutionSection {
  name: string;
  content: string;
}

export interface Constitution {
  rawContent: string;
  principles: ConstitutionPrinciple[];
  sections: ConstitutionSection[];
  version?: string;
  ratifiedDate?: string;
  lastAmendedDate?: string;
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  parallel: boolean;
  userStory?: string;
  filePath?: string;
}

export interface TaskPhase {
  name: string;
  tasks: Task[];
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
  // Clarification history from spec.md
  clarificationSessions: ClarificationSession[];
  totalClarifications: number;
  // Extended fields for full spec-kit integration (T005)
  userStories: UserStory[];
  technicalContext: TechnicalContext | null;
  taskGroups: TaskGroup[];
  specContent: string | null;
  planContent: string | null;
  additionalFiles: SpecKitFile[];
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

export interface DashboardMetrics {
  totalFeatures: number;
  featuresByStage: Record<FeatureStage, number>;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  tasksByPhase: Record<string, number>;
  // Clarification metrics
  totalClarifications: number;
  clarificationsByFeature: Record<string, number>;
}

export interface WebSocketMessage {
  type: 'update' | 'error' | 'connected';
  data?: Project;
  error?: string;
}
