'use client';

import { cn, getKanbanColumn, getKanbanColumnLabel, type KanbanColumn } from '@/lib/utils';
import type { Feature } from '@/types';
import { FileText, ListTodo, Plus } from 'lucide-react';
import { PriorityBadge } from '@/components/priority-badge';

const COLUMNS: KanbanColumn[] = ['backlog', 'in_progress', 'done'];

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
}

function FeatureCard({ feature, onClick }: FeatureCardProps) {
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

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg transition-colors duration-150',
        'bg-[var(--card)] border border-[var(--border)]',
        'hover:bg-[var(--secondary)]'
      )}
    >
      {/* Title with priority badge */}
      <div className="flex items-center gap-2 mb-2">
        {highestPriority && <PriorityBadge priority={highestPriority} />}
        <h4 className="font-medium text-sm text-[var(--foreground)] capitalize truncate">
          {feature.name}
        </h4>
      </div>

      {/* Badges and task count */}
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          {feature.hasSpec && (
            <span className="flex items-center gap-1 opacity-60">
              <FileText className="w-3 h-3" />
              spec
            </span>
          )}
          {feature.hasPlan && (
            <span className="flex items-center gap-1 opacity-60">
              <FileText className="w-3 h-3" />
              plan
            </span>
          )}
          {feature.hasTasks && (
            <span className="flex items-center gap-1 opacity-60">
              <ListTodo className="w-3 h-3" />
              tasks
            </span>
          )}
        </div>
        {feature.totalTasks > 0 && (
          <span className="tabular-nums">
            {feature.completedTasks}/{feature.totalTasks}
          </span>
        )}
      </div>

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
  );
}

interface EmptyColumnProps {
  column: KanbanColumn;
}

function EmptyColumn({ column }: EmptyColumnProps) {
  const hints: Record<KanbanColumn, string> = {
    backlog: 'Drag features here',
    in_progress: 'Features being worked on',
    done: 'Completed features',
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
  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-[400px]">
      {/* Column header - Linear style: minimal, no colored background */}
      <div className="flex items-center justify-between px-1 py-3 border-b border-[var(--border)]">
        <h3 className="font-medium text-sm text-[var(--foreground)]">
          {getKanbanColumnLabel(column)}
        </h3>
        <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
          {features.length}
        </span>
      </div>

      {/* Column content */}
      <div className="flex-1 pt-3 space-y-2 min-h-[200px]">
        {features.length === 0 ? (
          <EmptyColumn column={column} />
        ) : (
          features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onClick={() => onFeatureClick(feature)}
            />
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
  // Group features by kanban column
  const featuresByColumn = COLUMNS.reduce((acc, column) => {
    acc[column] = features.filter((f) => getKanbanColumn(f.stage) === column);
    return acc;
  }, {} as Record<KanbanColumn, Feature[]>);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {COLUMNS.map((column) => (
        <KanbanColumnComponent
          key={column}
          column={column}
          features={featuresByColumn[column]}
          onFeatureClick={onFeatureClick}
        />
      ))}
    </div>
  );
}
