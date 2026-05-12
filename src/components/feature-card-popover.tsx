'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { Feature } from '@/types';
import { GitBranch, Calendar, CheckCircle2, Target } from 'lucide-react';
import { PriorityLabel } from './priority-label';

interface FeatureCardPopoverProps {
  feature: Feature;
  children: ReactNode;
  /** Delay before showing popover (ms) */
  delay?: number;
  /** Whether the popover is disabled */
  disabled?: boolean;
}

interface PopoverPosition {
  top: number;
  left: number;
  placement: 'right' | 'left' | 'bottom';
}

const POPOVER_OFFSET = 12;

/**
 * Feature card popover with rich content for progressive disclosure.
 * Shows detailed progress, branch info, and metadata on hover.
 */
export function FeatureCardPopover({
  feature,
  children,
  delay = 400,
  disabled = false,
}: FeatureCardPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0, placement: 'right' });
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Generate unique ID for ARIA association
  const popoverId = `popover-${feature.id}`;

  // Calculate progress percentages
  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  const checklistPercentage = feature.totalChecklistItems > 0
    ? Math.round((feature.completedChecklistItems / feature.totalChecklistItems) * 100)
    : 0;

  const isComplete = progressPercentage === 100;

  // Only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 200;
    const padding = 16;

    let placement: 'right' | 'left' | 'bottom' = 'right';
    let top = triggerRect.top;
    let left = triggerRect.right + POPOVER_OFFSET;

    // Check if popover fits on the right
    if (left + popoverWidth > window.innerWidth - padding) {
      // Try left side
      left = triggerRect.left - popoverWidth - POPOVER_OFFSET;
      placement = 'left';

      // If left doesn't fit either, place below
      if (left < padding) {
        left = triggerRect.left;
        top = triggerRect.bottom + POPOVER_OFFSET;
        placement = 'bottom';
      }
    }

    // Clamp vertical position
    top = Math.max(padding, Math.min(top, window.innerHeight - popoverHeight - padding));

    setPosition({ top, left, placement });
  }, []);

  const showPopover = useCallback(() => {
    if (disabled) return;

    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, delay]);

  const hidePopover = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Add a small delay before hiding to allow mouse to move to popover
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Recalculate position when visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      requestAnimationFrame(calculatePosition);
    }
  }, [isVisible, calculatePosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Get progress bar style using CSS variables (Jira-style 3-state)
  const getProgressStyle = (percentage: number): React.CSSProperties => {
    if (percentage === 0) return { backgroundColor: 'var(--status-not-started)' };
    if (percentage < 80) return { backgroundColor: 'var(--status-in-progress)' };
    return { backgroundColor: 'var(--status-complete)' };
  };

  const popoverContent = isVisible && mounted ? (
    createPortal(
      <div
        ref={popoverRef}
        id={popoverId}
        role="tooltip"
        aria-hidden={!isVisible}
        onMouseEnter={cancelHide}
        onMouseLeave={hidePopover}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: 280,
        }}
        className={cn(
          'z-[9999] p-4 rounded-lg',
          'bg-[var(--card)] border border-[var(--border)]',
          'shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-[var(--foreground)] capitalize truncate">
            {feature.name}
          </h4>
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">
              {progressPercentage}%
            </span>
          )}
        </div>

        {/* Task Progress */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">Tasks</span>
            <span className="text-[var(--foreground)] font-medium tabular-nums">
              {feature.completedTasks}/{feature.totalTasks}
            </span>
          </div>
          <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 ease-out rounded-full"
              style={{
                width: `${Math.max(progressPercentage, 2)}%`,
                ...getProgressStyle(progressPercentage)
              }}
            />
          </div>
        </div>

        {/* Checklist Progress (if exists) */}
        {feature.hasChecklists && feature.totalChecklistItems > 0 && (
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Checklists</span>
              <span className="text-[var(--foreground)] font-medium tabular-nums">
                {feature.completedChecklistItems}/{feature.totalChecklistItems}
              </span>
            </div>
            <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out rounded-full"
                style={{
                  width: `${Math.max(checklistPercentage, 2)}%`,
                  ...getProgressStyle(checklistPercentage)
                }}
              />
            </div>
          </div>
        )}

        {/* Priority */}
        {feature.priority && (
          <div className="pt-3 border-t border-[var(--border)] space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <PriorityLabel priority={feature.priority} size="xs" />
            </div>
            {feature.priorityReason && (
              <p className="text-[10px] text-[var(--muted-foreground)] pl-5 line-clamp-2">
                {feature.priorityReason}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="pt-3 border-t border-[var(--border)] space-y-2">
          {/* Branch */}
          {feature.branch && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <GitBranch className="w-3.5 h-3.5" />
              <code className="bg-[var(--secondary)] px-1.5 py-0.5 rounded text-[10px] truncate max-w-[200px]">
                {feature.branch}
              </code>
            </div>
          )}

          {/* Stage */}
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{feature.stage}</span>
          </div>
        </div>

        {/* Click hint */}
        <div className="mt-3 pt-2 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--muted-foreground)] text-center">
            Click to open details
          </p>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={showPopover}
      onMouseLeave={hidePopover}
      onFocus={showPopover}
      onBlur={hidePopover}
      aria-describedby={isVisible ? popoverId : undefined}
    >
      {children}
      {popoverContent}
    </div>
  );
}
