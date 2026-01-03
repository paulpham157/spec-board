/**
 * Shortcut Configuration
 *
 * Centralized registry of all keyboard shortcuts.
 * This is the single source of truth for shortcuts.
 */

import type { Shortcut, ShortcutCategory } from '@/types';

/**
 * All keyboard shortcuts organized by category.
 * Used by useShortcuts hook and help overlay.
 */
export const SHORTCUTS: Shortcut[] = [
  // Navigation shortcuts (FR-001)
  {
    id: 'nav-home',
    keys: ['g', 'h'],
    description: 'Go to home/dashboard',
    category: 'navigation',
    context: 'global',
    action: 'navigate-home',
  },
  {
    id: 'nav-escape',
    keys: ['Escape'],
    description: 'Go back / close modal',
    category: 'navigation',
    context: 'global',
    action: 'escape',
  },
  {
    id: 'nav-up',
    keys: ['ArrowUp'],
    description: 'Navigate to card above',
    category: 'navigation',
    context: 'kanban',
    action: 'navigate-up',
  },
  {
    id: 'nav-down',
    keys: ['ArrowDown'],
    description: 'Navigate to card below',
    category: 'navigation',
    context: 'kanban',
    action: 'navigate-down',
  },
  {
    id: 'nav-left',
    keys: ['ArrowLeft'],
    description: 'Navigate to previous column',
    category: 'navigation',
    context: 'kanban',
    action: 'navigate-left',
  },
  {
    id: 'nav-right',
    keys: ['ArrowRight'],
    description: 'Navigate to next column',
    category: 'navigation',
    context: 'kanban',
    action: 'navigate-right',
  },
  {
    id: 'nav-enter',
    keys: ['Enter'],
    description: 'Open focused card',
    category: 'navigation',
    context: 'kanban',
    action: 'open-card',
  },

  // Action shortcuts (FR-002)
  {
    id: 'action-move-left',
    keys: ['Shift', 'ArrowLeft'],
    description: 'Move card to previous column',
    category: 'actions',
    context: 'kanban',
    action: 'move-card-left',
  },
  {
    id: 'action-move-right',
    keys: ['Shift', 'ArrowRight'],
    description: 'Move card to next column',
    category: 'actions',
    context: 'kanban',
    action: 'move-card-right',
  },

  // Help shortcuts (FR-003)
  {
    id: 'help-overlay',
    keys: ['?'],
    description: 'Show keyboard shortcuts help',
    category: 'help',
    context: 'global',
    action: 'toggle-help',
  },
];

/**
 * Get shortcuts filtered by category
 */
export function getShortcutsByCategory(category: ShortcutCategory): Shortcut[] {
  return SHORTCUTS.filter((s) => s.category === category);
}

/**
 * Get shortcuts grouped by category for help overlay
 */
export function getShortcutsGroupedByCategory(): Record<ShortcutCategory, Shortcut[]> {
  return {
    navigation: getShortcutsByCategory('navigation'),
    actions: getShortcutsByCategory('actions'),
    help: getShortcutsByCategory('help'),
  };
}

/**
 * Format keys for display (e.g., ['Shift', 'ArrowRight'] -> 'Shift + →')
 */
export function formatShortcutKeys(keys: string[]): string {
  return keys
    .map((key) => {
      switch (key) {
        case 'ArrowUp':
          return '↑';
        case 'ArrowDown':
          return '↓';
        case 'ArrowLeft':
          return '←';
        case 'ArrowRight':
          return '→';
        case 'Escape':
          return 'Esc';
        default:
          return key;
      }
    })
    .join(' + ');
}

/**
 * Category labels for help overlay
 */
export const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  help: 'Help',
};
