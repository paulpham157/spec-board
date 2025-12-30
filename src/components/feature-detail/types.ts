import type { Feature, Task } from '@/types';

// Section IDs for navigation
export type SectionId =
  | 'overview'
  | 'spec'
  | 'plan'
  | 'tasks'
  | 'research'
  | 'data-model'
  | 'quickstart'
  | 'contracts'
  | 'checklists'
  | 'analysis';

// Section status indicators
export type SectionStatus = 'complete' | 'in-progress' | 'pending' | 'none';

// Workflow phase groupings
export type WorkflowPhase = 'overview' | 'planning' | 'coding' | 'qa' | 'qc';

// Section configuration
export interface SectionConfig {
  id: SectionId;
  label: string;
  phase: WorkflowPhase;
  show: boolean;
  status: SectionStatus;
  taskCount?: { completed: number; total: number };
  groupCount?: { count: number; label: string };  // e.g., "5 US" or "3 checklists"
  filePath?: string;
}

// Navigation item for drag-and-drop
export interface NavItemData {
  id: SectionId;
  label: string;
  status: SectionStatus;
  taskCount?: { completed: number; total: number };
}

// Split view state
export interface SplitViewState {
  isActive: boolean;
  leftPane: SectionId;
  rightPane: SectionId | null;
  splitRatio: number; // 0.0 to 1.0, default 0.5
  focusedPane: 'left' | 'right';
}

// Feature detail state
export interface FeatureDetailState {
  feature: Feature;
  activeSection: SectionId;
  splitView: SplitViewState;
  isLeftPanelCollapsed: boolean;
  selectedNavIndex: number;
}

// Props for sub-components
export interface HeaderBarProps {
  featureName: string;
  featureId: string;
  onClose: () => void;
  onToggleSplit: () => void;
  isSplitActive: boolean;
}

export interface StatusHeaderProps {
  feature: Feature;
  progressPercentage: number;
  nextTask: Task | null;
}

export interface NavSidebarProps {
  sections: SectionConfig[];
  activeSection: SectionId;
  selectedIndex: number;
  onSectionClick: (sectionId: SectionId) => void;
  onSectionDragStart: (sectionId: SectionId) => void;
  onSectionDragEnd: () => void;
}

export interface ContentPaneProps {
  sectionId: SectionId;
  feature: Feature;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface SplitViewProps {
  leftSection: SectionId;
  rightSection: SectionId | null;
  feature: Feature;
  splitRatio: number;
  onRatioChange: (ratio: number) => void;
  onCloseRight: () => void;
  focusedPane: 'left' | 'right';
  onFocusChange: (pane: 'left' | 'right') => void;
}

// Drag and drop types
export interface DragState {
  isDragging: boolean;
  draggedSection: SectionId | null;
  dropTarget: 'left' | 'right' | null;
}

// Stage order for determining progress
export const STAGE_ORDER = ['specify', 'plan', 'tasks', 'implement', 'complete'] as const;

// Phase configuration
export const PHASE_CONFIG: Record<WorkflowPhase, { label: string; sections: SectionId[] }> = {
  overview: {
    label: 'OVERVIEW',
    sections: ['overview', 'spec'],
  },
  planning: {
    label: 'PLANNING',
    sections: ['plan', 'research', 'data-model'],
  },
  coding: {
    label: 'CODING',
    sections: ['tasks'],
  },
  qa: {
    label: 'QA',
    sections: ['analysis'],
  },
  qc: {
    label: 'QC',
    sections: ['checklists'],
  },
};

// Helper to get stage index
export function getStageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
}

// Determine section status based on feature stage and file existence
export function getSectionStatus(sectionId: SectionId, feature: Feature): SectionStatus {
  const currentStageIndex = getStageIndex(feature.stage);

  if (sectionId === 'spec') {
    if (feature.hasSpec && currentStageIndex > 0) return 'complete';
    if (feature.stage === 'specify') return 'in-progress';
    if (!feature.hasSpec) return 'pending';
    return 'none';
  }

  if (sectionId === 'plan') {
    if (feature.hasPlan && currentStageIndex > 1) return 'complete';
    if (feature.stage === 'plan') return 'in-progress';
    if (!feature.hasPlan) return 'pending';
    return 'none';
  }

  if (sectionId === 'tasks') {
    if (feature.hasTasks && currentStageIndex > 2) return 'complete';
    if (feature.stage === 'tasks') return 'in-progress';
    if (!feature.hasTasks) return 'pending';
    return 'none';
  }

  return 'none';
}

// Get the next incomplete task
export function getNextTask(feature: Feature): Task | null {
  // Check task groups first (new format)
  if (feature.taskGroups && feature.taskGroups.length > 0) {
    for (const group of feature.taskGroups) {
      const nextTask = group.tasks.find(t => !t.completed);
      if (nextTask) return nextTask;
    }
  }

  // Fallback to phases (old format)
  for (const phase of feature.phases) {
    const nextTask = phase.tasks.find(t => !t.completed);
    if (nextTask) return nextTask;
  }

  // Fallback to flat tasks
  return feature.tasks.find(t => !t.completed) || null;
}
