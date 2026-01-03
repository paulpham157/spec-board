'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ContentPane } from './content-pane';
import { useSettingsStore } from '@/lib/settings-store';
import type { Feature, Constitution } from '@/types';
import type { SectionId } from './types';

// Split ratio bounds - minimum and maximum pane sizes
const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;
const SPLIT_RATIO_STEP = 0.05;

interface SplitViewProps {
  leftSection: SectionId;
  rightSection: SectionId | null;
  feature: Feature;
  hasConstitution: boolean;
  constitution: Constitution | null;
  splitRatio: number;
  onRatioChange: (ratio: number) => void;
  onCloseRight: () => void;
  focusedPane: 'left' | 'right';
  onFocusChange: (pane: 'left' | 'right') => void;
  leftChecklistIndex?: number;
  rightChecklistIndex?: number;
}

export function SplitView({
  leftSection,
  rightSection,
  feature,
  hasConstitution,
  constitution,
  splitRatio,
  onRatioChange,
  onCloseRight,
  focusedPane,
  onFocusChange,
  leftChecklistIndex,
  rightChecklistIndex,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { shortcutsEnabled } = useSettingsStore();

  // Handle mouse down on divider
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;

      // Clamp ratio between MIN and MAX to prevent panes from being too small
      const clampedRatio = Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, newRatio));
      onRatioChange(clampedRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onRatioChange]);

  // Single pane mode
  if (!rightSection) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <ContentPane
          sectionId={leftSection}
          feature={feature}
          hasConstitution={hasConstitution}
          constitution={constitution}
          showCloseButton={false}
          selectedChecklistIndex={leftChecklistIndex}
        />
      </div>
    );
  }

  // Split pane mode
  const leftWidth = `${splitRatio * 100}%`;
  const rightWidth = `${(1 - splitRatio) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 flex overflow-hidden',
        isDragging && 'cursor-col-resize select-none'
      )}
    >
      {/* Left pane */}
      <div
        className={cn(
          'flex flex-col overflow-hidden border-r border-[var(--border)]',
          focusedPane === 'left' && 'ring-2 ring-blue-500/30 ring-inset'
        )}
        style={{ width: leftWidth }}
        onClick={() => onFocusChange('left')}
      >
        <ContentPane
          sectionId={leftSection}
          feature={feature}
          hasConstitution={hasConstitution}
          constitution={constitution}
          showCloseButton={false}
          selectedChecklistIndex={leftChecklistIndex}
        />
      </div>

      {/* Resizable divider */}
      <div
        className={cn(
          'w-1 bg-[var(--border)] hover:bg-blue-500/50 cursor-col-resize transition-colors flex-shrink-0',
          isDragging && 'bg-blue-500'
        )}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitRatio * 100)}
        aria-valuemin={20}
        aria-valuemax={80}
        tabIndex={0}
        onKeyDown={(e) => {
          // Skip keyboard shortcuts if disabled
          if (!shortcutsEnabled) return;

          // Allow keyboard adjustment of split ratio
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onRatioChange(Math.max(MIN_SPLIT_RATIO, splitRatio - SPLIT_RATIO_STEP));
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onRatioChange(Math.min(MAX_SPLIT_RATIO, splitRatio + SPLIT_RATIO_STEP));
          }
        }}
      />

      {/* Right pane */}
      <div
        className={cn(
          'flex flex-col overflow-hidden',
          focusedPane === 'right' && 'ring-2 ring-blue-500/30 ring-inset'
        )}
        style={{ width: rightWidth }}
        onClick={() => onFocusChange('right')}
      >
        <ContentPane
          sectionId={rightSection}
          feature={feature}
          hasConstitution={hasConstitution}
          constitution={constitution}
          showCloseButton={true}
          onClose={onCloseRight}
          selectedChecklistIndex={rightChecklistIndex}
        />
      </div>
    </div>
  );
}
