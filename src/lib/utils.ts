import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Feature, FeatureStage } from "@/types";

// Suggested command types for spec-kit workflow
export interface SuggestedCommand {
  command: string;
  title: string;
  description: string;
  isOptional: boolean;
}

export interface CommandSuggestion {
  primary: SuggestedCommand | null;
  optional: SuggestedCommand | null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    specify: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    plan: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tasks: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    implement: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    complete: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return colors[stage] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    specify: 'Specify',
    plan: 'Plan',
    tasks: 'Tasks',
    implement: 'Implement',
    complete: 'Complete',
  };
  return labels[stage] || stage;
}

// Kanban column types for 4-column view (with review column)
export type KanbanColumn = 'backlog' | 'in_progress' | 'review' | 'done';

// Map feature stages to kanban columns (legacy - use getFeatureKanbanColumn for checklist support)
export function getKanbanColumn(stage: FeatureStage): KanbanColumn {
  switch (stage) {
    case 'specify':
    case 'plan':
      return 'backlog';
    case 'tasks':
    case 'implement':
      return 'in_progress';
    case 'complete':
      return 'done';
    default:
      return 'backlog';
  }
}

/**
 * Get kanban column for a feature, considering checklist completion.
 * - Backlog: specify, plan stages
 * - In Progress: tasks, implement stages
 * - Review: complete stage but has incomplete checklists
 * - Done: complete stage with all checklists done (or no checklists)
 */
export function getFeatureKanbanColumn(feature: Feature): KanbanColumn {
  const baseColumn = getKanbanColumn(feature.stage);

  // Only apply review logic for features that would otherwise be "done"
  if (baseColumn === 'done') {
    // If feature has checklists and not all items are completed, put in review
    if (feature.hasChecklists && feature.completedChecklistItems < feature.totalChecklistItems) {
      return 'review';
    }
  }

  return baseColumn;
}

export function getKanbanColumnLabel(column: KanbanColumn): string {
  const labels: Record<KanbanColumn, string> = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
  };
  return labels[column];
}

export interface OpenInEditorResult {
  success: boolean;
  message: string;
}

/**
 * Type guard for Prisma errors with error codes.
 * Common codes: P2002 (unique constraint), P2025 (record not found)
 */
export function isPrismaError(error: unknown, code?: string): error is { code: string } {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }
  if (code) {
    return (error as { code: string }).code === code;
  }
  return typeof (error as { code: string }).code === 'string';
}

/**
 * Opens a file in the user's default editor (VS Code by default).
 * Uses the vscode:// URI scheme which works when VS Code is installed.
 *
 * @param filePath - Absolute path to the file to open
 * @param lineNumber - Optional line number to jump to
 * @returns Result object with success status and user-friendly message
 */
export function openInEditor(filePath: string | undefined, lineNumber?: number): OpenInEditorResult {
  if (!filePath) {
    return {
      success: false,
      message: 'No file path provided',
    };
  }

  try {
    // Build VS Code URI with optional line number
    let uri = `vscode://file/${encodeURIComponent(filePath)}`;
    if (lineNumber !== undefined && lineNumber > 0) {
      uri += `:${lineNumber}`;
    }

    window.open(uri, '_blank');

    // Note: window.open with custom URI schemes doesn't throw on failure,
    // so we can only confirm the attempt was made, not that VS Code opened.
    return {
      success: true,
      message: 'Opening in VS Code... (ensure VS Code is installed)',
    };
  } catch (error) {
    console.error('Failed to open file in editor:', error);
    return {
      success: false,
      message: 'Failed to open file. Is VS Code installed?',
    };
  }
}

/**
 * Get suggested spec-kit command based on feature state and project constitution.
 * Follows the spec-kit workflow:
 * /speckit.constitution → /speckit.specify → /speckit.clarify (optional)
 *         ↓
 * /speckit.plan → /speckit.checklist (optional) → /speckit.tasks
 *         ↓
 * /speckit.analyze (optional) → /speckit.implement
 */
export function getSuggestedCommand(feature: Feature, hasConstitution: boolean): CommandSuggestion {
  // Check constitution first (project-level)
  if (!hasConstitution) {
    return {
      primary: {
        command: '/speckit.constitution',
        title: 'Create Project Constitution',
        description: 'Define project principles, tech stack, and constraints that guide all feature development.',
        isOptional: false,
      },
      optional: null,
    };
  }

  // Stage: specify - no spec.md
  if (!feature.hasSpec) {
    return {
      primary: {
        command: '/speckit.specify',
        title: 'Create Feature Specification',
        description: 'Define user stories, acceptance criteria, and requirements for this feature.',
        isOptional: false,
      },
      optional: null,
    };
  }

  // Stage: plan - has spec, no plan.md
  if (!feature.hasPlan) {
    return {
      primary: {
        command: '/speckit.plan',
        title: 'Create Implementation Plan',
        description: 'Design the technical approach, architecture, and implementation strategy.',
        isOptional: false,
      },
      optional: feature.totalClarifications === 0 ? {
        command: '/speckit.clarify',
        title: 'Clarify Requirements',
        description: 'Ask questions to resolve ambiguities in the specification.',
        isOptional: true,
      } : null,
    };
  }

  // Stage: tasks - has plan, no tasks.md
  if (!feature.hasTasks) {
    return {
      primary: {
        command: '/speckit.tasks',
        title: 'Generate Task Breakdown',
        description: 'Break down the implementation plan into actionable, trackable tasks.',
        isOptional: false,
      },
      optional: !feature.hasChecklists ? {
        command: '/speckit.checklist',
        title: 'Create QA Checklist',
        description: 'Generate quality assurance checklists for testing and review.',
        isOptional: true,
      } : null,
    };
  }

  // Stage: implement - has tasks, not all complete
  if (feature.completedTasks < feature.totalTasks) {
    return {
      primary: {
        command: '/speckit.implement',
        title: 'Continue Implementation',
        description: `${feature.totalTasks - feature.completedTasks} tasks remaining. Continue building the feature.`,
        isOptional: false,
      },
      optional: !feature.analysis ? {
        command: '/speckit.analyze',
        title: 'Analyze Progress',
        description: 'Check implementation progress against the specification.',
        isOptional: true,
      } : null,
    };
  }

  // Stage: complete - all tasks done
  if (feature.completedTasks === feature.totalTasks && feature.totalTasks > 0) {
    // Check if analysis exists
    if (!feature.analysis) {
      return {
        primary: {
          command: '/speckit.analyze',
          title: 'Verify Implementation',
          description: 'Analyze the completed feature against the specification for alignment.',
          isOptional: false,
        },
        optional: null,
      };
    }

    // Feature is complete with analysis
    return {
      primary: null,
      optional: null,
    };
  }

  // Default fallback
  return {
    primary: null,
    optional: null,
  };
}
