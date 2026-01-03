'use client';

/**
 * Global Keyboard Shortcuts Hook
 *
 * Handles keyboard events at the application level.
 * Context-aware: disables in input fields, respects current view.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isEditableElement } from './index';
import { SHORTCUTS } from './shortcut-config';
import { announce } from '@/lib/accessibility';
import type { ShortcutContext, FocusState, KanbanColumnType } from '@/types';

// Sequence tracking for multi-key shortcuts (e.g., "g then h")
const SEQUENCE_TIMEOUT = 1000; // ms

interface UseShortcutsOptions {
  /** Current focus state for kanban navigation */
  focusState: FocusState;
  /** Update focus state */
  setFocusState: (state: Partial<FocusState>) => void;
  /** Clear focus state */
  clearFocusState: () => void;
  /** Callback when a card should be opened */
  onOpenCard?: (featureId: string) => void;
  /** Callback when card should move left */
  onMoveCardLeft?: (featureId: string) => void;
  /** Callback when card should move right */
  onMoveCardRight?: (featureId: string) => void;
  /** Whether help overlay is open */
  isHelpOpen?: boolean;
  /** Toggle help overlay */
  onToggleHelp?: () => void;
  /** Features organized by column for navigation */
  featuresByColumn?: Record<KanbanColumnType, { id: string }[]>;
}

const COLUMNS: KanbanColumnType[] = ['backlog', 'planning', 'in_progress', 'done'];

/**
 * Determine current shortcut context based on pathname and state
 */
function getCurrentContext(pathname: string, isHelpOpen: boolean): ShortcutContext {
  if (isHelpOpen) return 'modal';
  if (pathname.includes('/projects/') && pathname.includes('/features/')) {
    return 'feature-detail';
  }
  if (pathname.includes('/projects/')) {
    return 'kanban';
  }
  return 'global';
}

/**
 * Check if a shortcut matches the current key event
 */
function matchesShortcut(
  event: KeyboardEvent,
  keys: string[],
  pendingKey: string | null
): boolean {
  // Handle sequence shortcuts (e.g., "g then h")
  if (keys.length === 2 && !keys.includes('Shift') && !keys.includes('Control') && !keys.includes('Alt')) {
    // This is a sequence shortcut
    if (pendingKey === keys[0] && event.key.toLowerCase() === keys[1].toLowerCase()) {
      return true;
    }
    return false;
  }

  // Handle modifier + key shortcuts
  if (keys.includes('Shift')) {
    if (!event.shiftKey) return false;
    const nonModifierKeys = keys.filter((k) => k !== 'Shift');
    return nonModifierKeys.some((k) => event.key === k);
  }

  // Handle single key shortcuts
  if (keys.length === 1) {
    return event.key === keys[0] || event.key.toLowerCase() === keys[0].toLowerCase();
  }

  return false;
}

export function useShortcuts(options: UseShortcutsOptions) {
  const {
    focusState,
    setFocusState,
    clearFocusState,
    onOpenCard,
    onMoveCardLeft,
    onMoveCardRight,
    isHelpOpen = false,
    onToggleHelp,
    featuresByColumn = { backlog: [], planning: [], in_progress: [], done: [] },
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const pendingKeyRef = useRef<string | null>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation helpers
  const navigateUp = useCallback(() => {
    if (!focusState.column) return;
    const features = featuresByColumn[focusState.column];
    if (!features.length) return;

    const currentIndex = focusState.cardIndex ?? 0;
    const newIndex = Math.max(0, currentIndex - 1);

    if (newIndex !== currentIndex) {
      setFocusState({
        cardIndex: newIndex,
        featureId: features[newIndex]?.id ?? null,
      });
      announce('Moved to card above', 'polite');
    }
  }, [focusState, featuresByColumn, setFocusState]);

  const navigateDown = useCallback(() => {
    if (!focusState.column) return;
    const features = featuresByColumn[focusState.column];
    if (!features.length) return;

    const currentIndex = focusState.cardIndex ?? 0;
    const newIndex = Math.min(features.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      setFocusState({
        cardIndex: newIndex,
        featureId: features[newIndex]?.id ?? null,
      });
      announce('Moved to card below', 'polite');
    }
  }, [focusState, featuresByColumn, setFocusState]);

  const navigateLeft = useCallback(() => {
    const currentColIndex = focusState.column ? COLUMNS.indexOf(focusState.column) : 0;
    const newColIndex = Math.max(0, currentColIndex - 1);
    const newColumn = COLUMNS[newColIndex];
    const features = featuresByColumn[newColumn];

    if (newColumn !== focusState.column) {
      setFocusState({
        column: newColumn,
        cardIndex: features.length > 0 ? 0 : null,
        featureId: features[0]?.id ?? null,
      });
      announce(`Moved to ${newColumn.replace('_', ' ')} column`, 'polite');
    }
  }, [focusState, featuresByColumn, setFocusState]);

  const navigateRight = useCallback(() => {
    const currentColIndex = focusState.column ? COLUMNS.indexOf(focusState.column) : -1;
    const newColIndex = Math.min(COLUMNS.length - 1, currentColIndex + 1);
    const newColumn = COLUMNS[newColIndex];
    const features = featuresByColumn[newColumn];

    if (newColumn !== focusState.column) {
      setFocusState({
        column: newColumn,
        cardIndex: features.length > 0 ? 0 : null,
        featureId: features[0]?.id ?? null,
      });
      announce(`Moved to ${newColumn.replace('_', ' ')} column`, 'polite');
    }
  }, [focusState, featuresByColumn, setFocusState]);

  // Action handlers
  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'navigate-home':
          router.push('/');
          announce('Navigating to home', 'polite');
          break;

        case 'escape':
          if (isHelpOpen && onToggleHelp) {
            onToggleHelp();
            announce('Help overlay closed', 'polite');
          } else {
            clearFocusState();
            router.back();
            announce('Going back', 'polite');
          }
          break;

        case 'navigate-up':
          navigateUp();
          break;

        case 'navigate-down':
          navigateDown();
          break;

        case 'navigate-left':
          navigateLeft();
          break;

        case 'navigate-right':
          navigateRight();
          break;

        case 'open-card':
          if (focusState.featureId && onOpenCard) {
            onOpenCard(focusState.featureId);
            announce('Opening feature', 'polite');
          }
          break;

        case 'move-card-left':
          if (focusState.featureId && onMoveCardLeft) {
            onMoveCardLeft(focusState.featureId);
          }
          break;

        case 'move-card-right':
          if (focusState.featureId && onMoveCardRight) {
            onMoveCardRight(focusState.featureId);
          }
          break;

        case 'toggle-help':
          if (onToggleHelp) {
            onToggleHelp();
            announce(isHelpOpen ? 'Help overlay closed' : 'Help overlay opened', 'polite');
          }
          break;
      }
    },
    [
      router,
      isHelpOpen,
      onToggleHelp,
      clearFocusState,
      navigateUp,
      navigateDown,
      navigateLeft,
      navigateRight,
      focusState.featureId,
      onOpenCard,
      onMoveCardLeft,
      onMoveCardRight,
    ]
  );

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // FR-004: Ignore shortcuts in editable elements
      if (isEditableElement(document.activeElement)) {
        return;
      }

      const currentContext = getCurrentContext(pathname, isHelpOpen);

      // Check for sequence start (single letter that could start a sequence)
      if (event.key.length === 1 && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const potentialSequence = SHORTCUTS.find(
          (s) =>
            s.keys.length === 2 &&
            s.keys[0].toLowerCase() === event.key.toLowerCase() &&
            !s.keys.includes('Shift')
        );

        if (potentialSequence && !pendingKeyRef.current) {
          pendingKeyRef.current = event.key.toLowerCase();

          // Clear pending key after timeout
          if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
          }
          sequenceTimeoutRef.current = setTimeout(() => {
            pendingKeyRef.current = null;
          }, SEQUENCE_TIMEOUT);

          return;
        }
      }

      // Find matching shortcut
      for (const shortcut of SHORTCUTS) {
        // Check context compatibility
        if (shortcut.context !== 'global' && shortcut.context !== currentContext) {
          continue;
        }

        if (matchesShortcut(event, shortcut.keys, pendingKeyRef.current)) {
          event.preventDefault();
          pendingKeyRef.current = null;

          if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
          }

          handleAction(shortcut.action);
          return;
        }
      }

      // Clear pending key if no match
      pendingKeyRef.current = null;
    },
    [pathname, isHelpOpen, handleAction]
  );

  // Attach global listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);
}
