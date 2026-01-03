/**
 * Shortcuts Module
 *
 * Provides keyboard shortcut functionality for SpecBoard.
 * - Centralized shortcut registry
 * - Global shortcut hook
 * - Input field detection
 *
 * @see specs/005-quick-shortcut/
 */

// Re-export types from central types file
export type {
  Shortcut,
  ShortcutCategory,
  ShortcutContext,
  FocusState,
  KanbanColumnType,
} from '@/types';

/**
 * Check if an element is editable (input, textarea, contenteditable).
 * Used to disable shortcuts when user is typing.
 *
 * @param element - The element to check
 * @returns true if the element is editable
 */
export function isEditableElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Check contenteditable attribute
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check if inside contenteditable parent
  return element.closest('[contenteditable="true"]') !== null;
}

// Shortcut configuration will be exported from shortcut-config.ts
// useShortcuts hook will be exported from use-shortcuts.ts
