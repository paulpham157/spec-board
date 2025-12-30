'use client';

import { KeyboardEvent } from 'react';
import { cn, getFeatureKanbanColumn, getKanbanColumnLabel, type KanbanColumn } from '@/lib/utils';
import type { Feature } from '@/types';
import { Plus, GitBranch } from 'lucide-react';
import { PriorityBadge } from '@/components/priority-badge';
import { Tooltip } from '@/components/tooltip';
import { announce } from '@/lib/accessibility';

const COLUMNS: KanbanColumn[] = ['backlog', 'in_progress', 'review', 'done'];

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

function FeatureCard({ feature, onClick, onKeyDown }: FeatureCardProps) {
  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  // Get highest priority from user stories
  const highestPriority = feature.userStories.length > 0
    ? feature.userStories.reduce((highest, story) => {
        const priorityOrder = { P1: 1, P2: 2, P3: 3 };
        return priorityOrder[story.priority] < priorityOrder[highest] ? story.priority : highest;
      }, feature.userStories[0].priority)
    : null;

  // Build accessible label
  const ariaLabel = [
    feature.name,
    highestPriority ? `Priority ${highestPriority.replace('P', '')}` : null,
    feature.totalTasks > 0 ? `${feature.completedTasks} of ${feature.totalTasks} tasks complete` : null,
  ].filter(Boolean).join(', ');

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Pass to parent handler for navigation
    onKeyDown?.(e);

    // Handle Enter key for activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Tooltip content="View details [Enter]" className="w-full">
      <button
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        className={cn(
          'w-full text-left p-4 rounded-lg transition-colors duration-150',
          'bg-[var(--card)] border border-[var(--border)]',
          'hover:bg-[var(--secondary)]',
          'focus-ring'
        )}
      >
      {/* Title with priority badge */}
      <div className="flex items-center gap-2 mb-2">
        {highestPriority && <PriorityBadge priority={highestPriority} />}
        <h4 className="font-medium text-sm text-[var(--foreground)] capitalize truncate">
          {feature.name}
        </h4>
      </div>

      {/* Branch name */}
      {feature.branch && (
        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] mb-2">
          <GitBranch className="w-3 h-3" />
          <code className="bg-[var(--secondary)] px-1.5 py-0.5 rounded text-[10px]">
            {feature.branch}
          </code>
        </div>
      )}

      {/* Task count */}
      {feature.totalTasks > 0 && (
        <div className="text-xs text-[var(--muted-foreground)] tabular-nums">
          {feature.completedTasks}/{feature.totalTasks}
        </div>
      )}

      {/* Thin progress bar */}
      {feature.totalTasks > 0 && (
        <div className="mt-3 h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--foreground)] opacity-40 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
      </button>
    </Tooltip>
  );
}

interface EmptyColumnProps {
  column: KanbanColumn;
}

function EmptyColumn({ column }: EmptyColumnProps) {
  const hints: Record<KanbanColumn, string> = {
    backlog: 'Features being specified',
    in_progress: 'Features being worked on',
    review: 'Awaiting checklist completion',
    done: 'Fully completed features',
  };

  return (
    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--muted-foreground)]">
      <span className="text-xs mb-2">{hints[column]}</span>
      <span className="flex items-center gap-1 text-xs opacity-60">
        <Plus className="w-3 h-3" />
        Add new
      </span>
    </div>
  );
}

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
}

function KanbanColumnComponent({ column, features, onFeatureClick }: KanbanColumnComponentProps) {
  const columnLabel = getKanbanColumnLabel(column);

  return (
    <div
      className="flex flex-col flex-1 min-w-[250px] max-w-[350px]"
      role="region"
      aria-label={`${columnLabel} column`}
    >
      {/* Column header - Linear style: minimal, no colored background */}
      <div className="flex items-center justify-between px-1 py-3 border-b border-[var(--border)]">
        <h3 className="font-medium text-sm text-[var(--foreground)]" id={`column-${column}-heading`}>
          {columnLabel}
        </h3>
        <span
          className="text-xs text-[var(--muted-foreground)] tabular-nums"
          aria-label={`${features.length} features`}
        >
          {features.length}
        </span>
      </div>

      {/* Column content */}
      <div
        className="flex-1 pt-3 space-y-2 min-h-[200px]"
        role="list"
        aria-labelledby={`column-${column}-heading`}
        aria-label={`${columnLabel} features, ${features.length} items`}
      >
        {features.length === 0 ? (
          <EmptyColumn column={column} />
        ) : (
          features.map((feature, index) => (
            <div key={feature.id} role="listitem" className="w-full">
              <FeatureCard
                feature={feature}
                onClick={() => {
                  announce(`Opening ${feature.name} details`);
                  onFeatureClick(feature);
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
}

export function KanbanBoard({ features, onFeatureClick }: KanbanBoardProps) {
  // Group features by kanban column (using new function that considers checklists)
  const featuresByColumn = COLUMNS.reduce((acc, column) => {
    acc[column] = features.filter((f) => getFeatureKanbanColumn(f) === column);
    return acc;
  }, {} as Record<KanbanColumn, Feature[]>);

  // Calculate totals for screen reader summary
  const totalFeatures = features.length;
  const inProgressCount = featuresByColumn['in_progress'].length;
  const reviewCount = featuresByColumn['review'].length;
  const doneCount = featuresByColumn['done'].length;

  return (
    <section
      aria-label="Feature board"
      className="flex gap-6 overflow-x-auto pb-4"
    >
      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        {totalFeatures} total features: {featuresByColumn['backlog'].length} in backlog,
        {inProgressCount} in progress, {reviewCount} in review, {doneCount} done
      </div>

      {COLUMNS.map((column) => (
        <KanbanColumnComponent
          key={column}
          column={column}
          features={featuresByColumn[column]}
          onFeatureClick={onFeatureClick}
        />
      ))}
    </section>
  );
}
