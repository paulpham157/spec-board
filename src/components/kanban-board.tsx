'use client';

import { forwardRef, useEffect, useCallback, useRef } from 'react';
import { cn, getFeatureKanbanColumn, getKanbanColumnLabel, type KanbanColumn } from '@/lib/utils';
import type { Feature, KanbanColumnType } from '@/types';
import { GitBranch, ListTodo, Circle } from 'lucide-react';
import { announce } from '@/lib/accessibility';
import { useProjectStore } from '@/lib/store';

const COLUMNS: KanbanColumn[] = ['backlog', 'planning', 'in_progress', 'done'];

// Get color style based on progress percentage
// gray (0%) -> yellow (1-79%) -> neon (80-99%) -> green (100%)
function getProgressColorStyle(percentage: number, hasItems: boolean): React.CSSProperties {
  if (!hasItems || percentage === 0) return { color: 'var(--muted-foreground)' };
  if (percentage < 80) return { color: 'var(--color-warning)' };
  if (percentage < 100) return { color: 'var(--color-neon)' };
  return { color: 'var(--color-success)' };
}

function getProgressBarColorStyle(percentage: number, hasItems: boolean): React.CSSProperties {
  if (!hasItems || percentage === 0) return { backgroundColor: 'var(--progress-empty)' };
  if (percentage < 80) return { backgroundColor: 'var(--color-warning)' };
  if (percentage < 100) return { backgroundColor: 'var(--color-neon)' };
  return { backgroundColor: 'var(--color-success)' };
}

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
  isFocused?: boolean;
}

const FeatureCard = forwardRef<HTMLButtonElement, FeatureCardProps>(function FeatureCard(
  { feature, onClick, isFocused },
  ref
) {
  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  // Checklist progress
  const checklistPercentage = feature.totalChecklistItems > 0
    ? Math.round((feature.completedChecklistItems / feature.totalChecklistItems) * 100)
    : 0;

  // Build accessible label
  const ariaLabel = [
    feature.name,
    feature.totalTasks > 0 ? `${feature.completedTasks} of ${feature.totalTasks} tasks complete` : null,
  ].filter(Boolean).join(', ');

  return (
      <button
        ref={ref}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          'w-full text-left p-4 rounded-lg transition-colors duration-150',
          'bg-[var(--card)] border border-[var(--border)]',
          'hover:bg-[var(--secondary)]',
          'focus-ring',
          // Visual focus indicator for keyboard navigation (FR-005)
          isFocused && 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--background)]'
        )}
      >
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
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

      {/* Task count - always show */}
      <div
        className="flex items-center gap-1.5 text-xs tabular-nums"
        style={getProgressColorStyle(progressPercentage, feature.totalTasks > 0)}
      >
        <ListTodo className="w-3 h-3" />
        <span>Tasks</span>
        <span>{feature.completedTasks}/{feature.totalTasks} ({progressPercentage}%)</span>
      </div>

      {/* Thin progress bar - always show */}
      <div className="mt-3 h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: progressPercentage === 0 ? '100%' : `${progressPercentage}%`,
            ...getProgressBarColorStyle(progressPercentage, feature.totalTasks > 0)
          }}
        />
      </div>

      {/* Checklist progress */}
      {feature.hasChecklists && feature.totalChecklistItems > 0 && (
        <div className="mt-3">
          <div
            className="flex items-center gap-1.5 text-xs tabular-nums"
            style={getProgressColorStyle(checklistPercentage, feature.totalChecklistItems > 0)}
          >
            <Circle className="w-3 h-3" />
            <span>Checklists</span>
            <span>{feature.completedChecklistItems}/{feature.totalChecklistItems} ({checklistPercentage}%)</span>
          </div>
          {/* Checklist progress bar */}
          <div className="mt-1.5 h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${checklistPercentage}%`, ...getProgressBarColorStyle(checklistPercentage, feature.totalChecklistItems > 0) }}
            />
          </div>
        </div>
      )}
      </button>
  );
});

interface EmptyColumnProps {
  column: KanbanColumn;
}

function EmptyColumn({ column }: EmptyColumnProps) {
  const hints: Record<KanbanColumn, string> = {
    backlog: 'Features being specified',
    planning: 'Features with plan, awaiting tasks',
    in_progress: 'Features being worked on',
    done: 'Fully completed features',
  };

  return (
    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--muted-foreground)]">
      <span className="text-xs">{hints[column]}</span>
    </div>
  );
}

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
  focusedFeatureId: string | null;
  setCardRef: (featureId: string, element: HTMLButtonElement | null) => void;
}

function KanbanColumnComponent({
  column,
  features,
  onFeatureClick,
  focusedFeatureId,
  setCardRef,
}: KanbanColumnComponentProps) {
  const columnLabel = getKanbanColumnLabel(column);

  return (
    <div
      className="flex flex-col flex-1 min-w-[250px] max-w-[350px]"
      role="region"
      aria-label={`${columnLabel} column`}
    >
      {/* Column header */}
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
          features.map((feature) => {
            const isFocused = feature.id === focusedFeatureId;
            return (
              <div key={feature.id} role="listitem" className="w-full">
                <FeatureCard
                  ref={(el) => setCardRef(feature.id, el)}
                  feature={feature}
                  onClick={() => {
                    announce(`Opening ${feature.name} details`);
                    onFeatureClick(feature);
                  }}
                  isFocused={isFocused}
                />
              </div>
            );
          })
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
  const { focusState, setFocusState, clearFocusState } = useProjectStore();
  const cardRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const boardRef = useRef<HTMLElement>(null);

  // Group features by kanban column (using new function that considers checklists)
  const featuresByColumn = COLUMNS.reduce((acc, column) => {
    acc[column] = features.filter((f) => getFeatureKanbanColumn(f) === column);
    return acc;
  }, {} as Record<KanbanColumn, Feature[]>);

  // Calculate totals for screen reader summary
  const totalFeatures = features.length;
  const planningCount = featuresByColumn['planning'].length;
  const inProgressCount = featuresByColumn['in_progress'].length;
  const doneCount = featuresByColumn['done'].length;

  // Initialize focus to first card if no focus and user starts navigating
  const initializeFocus = useCallback(() => {
    if (focusState.featureId) return; // Already focused

    // Find first non-empty column
    for (const column of COLUMNS) {
      const columnFeatures = featuresByColumn[column];
      if (columnFeatures.length > 0) {
        setFocusState({
          column: column as KanbanColumnType,
          cardIndex: 0,
          featureId: columnFeatures[0].id,
        });
        announce(`Focused on ${columnFeatures[0].name} in ${column.replace('_', ' ')} column`, 'polite');
        return;
      }
    }
  }, [focusState.featureId, featuresByColumn, setFocusState]);

  // Navigate within column (up/down)
  const navigateVertical = useCallback((direction: 'up' | 'down') => {
    if (!focusState.column) {
      initializeFocus();
      return;
    }

    const columnFeatures = featuresByColumn[focusState.column];
    if (columnFeatures.length === 0) return;

    const currentIndex = focusState.cardIndex ?? 0;
    const newIndex = direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(columnFeatures.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      const newFeature = columnFeatures[newIndex];
      setFocusState({
        cardIndex: newIndex,
        featureId: newFeature.id,
      });
      announce(`${newFeature.name}`, 'polite');
    }
  }, [focusState, featuresByColumn, setFocusState, initializeFocus]);

  // Navigate between columns (left/right)
  const navigateHorizontal = useCallback((direction: 'left' | 'right') => {
    if (!focusState.column) {
      initializeFocus();
      return;
    }

    const currentColIndex = COLUMNS.indexOf(focusState.column);
    const newColIndex = direction === 'left'
      ? Math.max(0, currentColIndex - 1)
      : Math.min(COLUMNS.length - 1, currentColIndex + 1);

    if (newColIndex !== currentColIndex) {
      const newColumn = COLUMNS[newColIndex] as KanbanColumnType;
      const columnFeatures = featuresByColumn[newColumn];

      // Try to maintain similar position, or go to first/last card
      const newIndex = columnFeatures.length > 0
        ? Math.min(focusState.cardIndex ?? 0, columnFeatures.length - 1)
        : null;

      setFocusState({
        column: newColumn,
        cardIndex: newIndex,
        featureId: newIndex !== null ? columnFeatures[newIndex]?.id ?? null : null,
      });

      const columnLabel = getKanbanColumnLabel(newColumn);
      if (columnFeatures.length > 0 && newIndex !== null) {
        announce(`${columnLabel} column, ${columnFeatures[newIndex].name}`, 'polite');
      } else {
        announce(`${columnLabel} column, empty`, 'polite');
      }
    }
  }, [focusState, featuresByColumn, setFocusState, initializeFocus]);

  // Open focused card
  const openFocusedCard = useCallback(() => {
    if (!focusState.featureId) return;

    const feature = features.find(f => f.id === focusState.featureId);
    if (feature) {
      announce(`Opening ${feature.name}`, 'polite');
      onFeatureClick(feature);
    }
  }, [focusState.featureId, features, onFeatureClick]);

  // Keyboard event handler - scoped to board element
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    // Check if we're in an editable element
    const activeElement = document.activeElement;
    if (activeElement) {
      const tagName = activeElement.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }
      if (activeElement.getAttribute('contenteditable') === 'true') {
        return;
      }
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateVertical('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateVertical('down');
        break;
      case 'ArrowLeft':
        if (e.shiftKey) {
          // Shift+Left: Move card (not supported in read-only mode)
          if (focusState.featureId) {
            e.preventDefault();
            announce('Card movement is not available. Feature status is determined by spec-kit files.', 'polite');
          }
        } else {
          e.preventDefault();
          navigateHorizontal('left');
        }
        break;
      case 'ArrowRight':
        if (e.shiftKey) {
          // Shift+Right: Move card (not supported in read-only mode)
          if (focusState.featureId) {
            e.preventDefault();
            announce('Card movement is not available. Feature status is determined by spec-kit files.', 'polite');
          }
        } else {
          e.preventDefault();
          navigateHorizontal('right');
        }
        break;
      case 'Enter':
        if (focusState.featureId) {
          e.preventDefault();
          openFocusedCard();
        }
        break;
      case 'Escape':
        if (focusState.featureId) {
          e.preventDefault();
          clearFocusState();
          announce('Focus cleared', 'polite');
        }
        break;
    }
  }, [navigateVertical, navigateHorizontal, openFocusedCard, focusState.featureId, clearFocusState]);

  // Focus the card element when focusState changes (FR-008)
  useEffect(() => {
    if (focusState.featureId) {
      const cardElement = cardRefs.current.get(focusState.featureId);
      if (cardElement) {
        cardElement.focus({ preventScroll: false });
      }
    }
  }, [focusState.featureId]);

  // Store card refs using callback ref pattern
  const setCardRef = useCallback((featureId: string, element: HTMLButtonElement | null) => {
    if (element) {
      cardRefs.current.set(featureId, element);
    } else {
      cardRefs.current.delete(featureId);
    }
  }, []);

  return (
    <section
      ref={boardRef}
      aria-label="Feature board"
      className="flex gap-6 overflow-x-auto pb-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        {totalFeatures} total features: {featuresByColumn['backlog'].length} in backlog,
        {planningCount} in planning, {inProgressCount} in progress, {doneCount} done
      </div>

      {/* Keyboard navigation hint */}
      <div className="sr-only">
        Use arrow keys to navigate between cards. Press Enter to open a card. Press Escape to clear focus.
      </div>

      {COLUMNS.map((column) => (
        <KanbanColumnComponent
          key={column}
          column={column}
          features={featuresByColumn[column]}
          onFeatureClick={onFeatureClick}
          focusedFeatureId={focusState.featureId}
          setCardRef={setCardRef}
        />
      ))}
    </section>
  );
}
