'use client';

import { Target } from 'lucide-react';
import { cn, getStageColor, getStageLabel } from '@/lib/utils';
import { PriorityBadge } from '@/components/priority-badge';
import type { StatusHeaderProps } from './types';

type Priority = 'P1' | 'P2' | 'P3';

export function StatusHeader({ feature, progressPercentage, nextTask }: StatusHeaderProps) {
  // Get highest priority from user stories
  const highestPriority: Priority | null = feature.userStories.length > 0
    ? feature.userStories.reduce<Priority>((highest, story) => {
        const priorityOrder: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 };
        return priorityOrder[story.priority] < priorityOrder[highest] ? story.priority : highest;
      }, feature.userStories[0].priority)
    : null;

  return (
    <div className="p-4 border-b border-[var(--border)]">
      {/* Stage and Priority badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded border',
          getStageColor(feature.stage)
        )}>
          {getStageLabel(feature.stage)}
        </span>
        {highestPriority && (
          <PriorityBadge priority={highestPriority} />
        )}
      </div>

      {/* Progress bar */}
      {feature.totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--muted-foreground)]">Progress</span>
            <span className="text-xs font-medium">{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {feature.completedTasks} of {feature.totalTasks} tasks
          </div>
        </div>
      )}

      {/* Next Action box */}
      {nextTask && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
              Next Action
            </span>
          </div>
          <div className="text-sm">
            <span className="font-mono text-xs text-[var(--muted-foreground)] mr-2">
              {nextTask.id}
            </span>
            <span className="text-[var(--foreground)]">
              {nextTask.description}
            </span>
          </div>
          {nextTask.filePath && (
            <div className="text-xs text-[var(--muted-foreground)] mt-1 font-mono truncate">
              {nextTask.filePath}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
