'use client';

import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'P1' | 'P2' | 'P3';
  className?: string;
}

const priorityConfig = {
  P1: {
    label: 'P1',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  P2: {
    label: 'P2',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  P3: {
    label: 'P3',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
