import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Feature, FeatureStage } from "@/types";

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
