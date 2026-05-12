'use client';

import { cn } from '@/lib/utils';
import type { FeaturePriority } from '@/types';
import { PRIORITY_CONFIG } from '@/types';
import { Star, Sparkles, XCircle, HelpCircle } from 'lucide-react';

interface PriorityLabelProps {
  priority: FeaturePriority | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const PRIORITY_ICONS = {
  must_have: Star,
  nice_to_have: Sparkles,
  no_need: XCircle,
} as const;

/**
 * Displays a priority label badge for a feature
 * 
 * Usage:
 * <PriorityLabel priority="must_have" />
 * <PriorityLabel priority="nice_to_have" size="xs" showIcon />
 */
export function PriorityLabel({
  priority,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className,
}: PriorityLabelProps) {
  if (!priority) {
    return null;
  }

  const config = PRIORITY_CONFIG[priority];
  if (!config) {
    return null;
  }

  const Icon = PRIORITY_ICONS[priority];

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      {showIcon && Icon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface PriorityDotProps {
  priority: FeaturePriority | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * Displays a simple colored dot for priority
 * Useful for compact views like Kanban cards
 */
export function PriorityDot({ priority, size = 'sm', className }: PriorityDotProps) {
  if (!priority) {
    return null;
  }

  const config = PRIORITY_CONFIG[priority];
  if (!config) {
    return null;
  }

  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  // Map text colors to bg colors
  const bgColors = {
    must_have: 'bg-red-500',
    nice_to_have: 'bg-yellow-500',
    no_need: 'bg-gray-500',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        bgColors[priority],
        sizeClasses[size],
        className
      )}
      title={config.label}
    />
  );
}

interface PriorityWithReasonProps {
  priority: FeaturePriority | null | undefined;
  reason: string | null | undefined;
  className?: string;
}

/**
 * Displays priority with expandable reason
 * Used in feature detail views
 */
export function PriorityWithReason({ priority, reason, className }: PriorityWithReasonProps) {
  if (!priority) {
    return (
      <div className={cn('flex items-center gap-2 text-[var(--muted-foreground)]', className)}>
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm">No priority set</span>
      </div>
    );
  }

  const config = PRIORITY_CONFIG[priority];

  return (
    <div className={cn('space-y-1', className)}>
      <PriorityLabel priority={priority} size="md" />
      {reason && (
        <p className="text-xs text-[var(--muted-foreground)] pl-1">
          {reason}
        </p>
      )}
    </div>
  );
}
