'use client';

/**
 * Shortcut Help Overlay
 *
 * Modal showing all available keyboard shortcuts.
 * Triggered by pressing "?" key.
 */

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/lib/accessibility';
import {
  getShortcutsGroupedByCategory,
  formatShortcutKeys,
  CATEGORY_LABELS,
} from '@/lib/shortcuts/shortcut-config';
import type { ShortcutCategory } from '@/types';

interface ShortcutHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutHelpOverlay({ isOpen, onClose }: ShortcutHelpOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap for accessibility
  useFocusTrap(overlayRef, isOpen, {
    initialFocusRef: closeButtonRef,
  });

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutsByCategory = getShortcutsGroupedByCategory();
  const categories: ShortcutCategory[] = ['navigation', 'actions', 'help'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        ref={overlayRef}
        className="bg-background border border-border rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 id="shortcuts-title" className="text-lg font-semibold">
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Close shortcuts help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {categories.map((category) => {
            const shortcuts = shortcutsByCategory[category];
            if (shortcuts.length === 0) return null;

            return (
              <section key={category} aria-labelledby={`category-${category}`}>
                <h3
                  id={`category-${category}`}
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3"
                >
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                        {formatShortcutKeys(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
