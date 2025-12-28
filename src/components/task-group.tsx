'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/priority-badge';
import type { Task, TaskGroup as TaskGroupType, UserStory } from '@/types';

// Number of task groups to expand by default in the list view
const DEFAULT_EXPANDED_GROUPS = 3;

interface TaskItemProps {
  task: Task;
}

function TaskItem({ task }: TaskItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg transition-colors',
        task.completed ? 'bg-green-500/10' : 'hover:bg-[var(--secondary)]'
      )}
    >
      {task.completed ? (
        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            {task.id}
          </span>
          {task.parallel && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Parallel
            </span>
          )}
        </div>
        <p className={cn(
          'text-sm mt-1',
          task.completed && 'text-[var(--muted-foreground)] line-through'
        )}>
          {task.description}
        </p>
        {task.filePath && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
            {task.filePath}
          </p>
        )}
      </div>
    </div>
  );
}

interface TaskGroupHeaderProps {
  storyId: string | null;
  storyTitle: string;
  completedCount: number;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  priority?: 'P1' | 'P2' | 'P3';
}

function TaskGroupHeader({
  storyId,
  storyTitle,
  completedCount,
  totalCount,
  isExpanded,
  onToggle,
  priority,
}: TaskGroupHeaderProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] transition-colors"
    >
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {priority && <PriorityBadge priority={priority} />}
        {storyId && (
          <span className="text-xs font-mono text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
            {storyId}
          </span>
        )}
        <span className="font-medium text-sm truncate">{storyTitle}</span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-24 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-[var(--muted-foreground)] tabular-nums w-16 text-right">
          {completedCount}/{totalCount} ({percentage}%)
        </span>
      </div>
    </button>
  );
}

interface TaskGroupProps {
  group: TaskGroupType;
  userStory?: UserStory;
  defaultExpanded?: boolean;
}

export function TaskGroup({ group, userStory, defaultExpanded = true }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-4">
      <TaskGroupHeader
        storyId={group.storyId}
        storyTitle={group.storyTitle}
        completedCount={group.completedCount}
        totalCount={group.totalCount}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        priority={userStory?.priority}
      />

      {isExpanded && (
        <div className="mt-2 ml-4 pl-4 border-l-2 border-[var(--border)] space-y-1">
          {group.tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskGroupListProps {
  groups: TaskGroupType[];
  userStories: UserStory[];
}

export function TaskGroupList({ groups, userStories }: TaskGroupListProps) {
  // Create a map of user stories by ID for quick lookup
  const storyMap = new Map(userStories.map((s) => [s.id, s]));

  // Sort groups: user story groups first (by priority), then "Other Tasks" last
  const sortedGroups = [...groups].sort((a, b) => {
    if (!a.storyId && b.storyId) return 1;
    if (a.storyId && !b.storyId) return -1;
    if (!a.storyId && !b.storyId) return 0;

    const storyA = storyMap.get(a.storyId!);
    const storyB = storyMap.get(b.storyId!);
    if (!storyA || !storyB) return 0;

    const priorityOrder = { P1: 1, P2: 2, P3: 3 };
    return priorityOrder[storyA.priority] - priorityOrder[storyB.priority];
  });

  if (sortedGroups.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>No tasks defined yet</p>
      </div>
    );
  }

  return (
    <div>
      {sortedGroups.map((group, index) => (
        <TaskGroup
          key={group.storyId || `other-${index}`}
          group={group}
          userStory={group.storyId ? storyMap.get(group.storyId) : undefined}
          defaultExpanded={index < DEFAULT_EXPANDED_GROUPS}
        />
      ))}
    </div>
  );
}
