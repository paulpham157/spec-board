'use client';

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  /** The content to display in the tooltip */
  content: string;
  /** The element that triggers the tooltip */
  children: ReactNode;
  /** Position of the tooltip relative to the trigger */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional classes for the wrapper element */
  className?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const TOOLTIP_OFFSET = 8;

/**
 * Accessible tooltip component with keyboard shortcut hints.
 * Uses React Portal to render at body level, avoiding overflow clipping.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 300,
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width || 0;
    const tooltipHeight = tooltipRect?.height || 0;

    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipHeight - TOOLTIP_OFFSET;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + TOOLTIP_OFFSET;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.left - tooltipWidth - TOOLTIP_OFFSET;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.right + TOOLTIP_OFFSET;
        break;
    }

    // Clamp to viewport bounds
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setPosition({ top, left });
  }, [side]);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Recalculate position when visible
  useEffect(() => {
    if (isVisible) {
      // Initial calculation
      calculatePosition();
      // Recalculate after a frame to get accurate tooltip dimensions
      requestAnimationFrame(calculatePosition);
    }
  }, [isVisible, calculatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
  };

  const tooltipContent = isVisible && content && mounted ? (
    createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
        }}
        className={cn(
          'z-[9999] px-2 py-1 text-xs font-medium',
          'bg-gray-900 text-white rounded shadow-lg',
          'whitespace-nowrap pointer-events-none',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        {content}
        {/* Arrow */}
        <span
          className={cn(
            'absolute w-0 h-0 border-4',
            arrowClasses[side]
          )}
        />
      </div>,
      document.body
    )
  ) : null;

  return (
    <div
      ref={triggerRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {tooltipContent}
    </div>
  );
}

/**
 * Format a keyboard shortcut for display.
 * Converts key names to symbols on Mac.
 */
export function formatShortcut(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  if (isMac) {
    return shortcut
      .replace(/Cmd/gi, '⌘')
      .replace(/Ctrl/gi, '⌃')
      .replace(/Alt/gi, '⌥')
      .replace(/Shift/gi, '⇧')
      .replace(/Enter/gi, '↵')
      .replace(/Escape/gi, 'Esc');
  }

  return shortcut;
}
