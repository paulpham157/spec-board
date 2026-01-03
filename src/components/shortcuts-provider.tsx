'use client';

/**
 * Shortcuts Provider
 *
 * Provides global keyboard shortcuts and help overlay state.
 * Mounted at the application layout level.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useShortcuts } from '@/lib/shortcuts/use-shortcuts';
import { useProjectStore } from '@/lib/store';
import { ShortcutHelpOverlay } from './shortcut-help-overlay';

interface ShortcutsContextValue {
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function useShortcutsContext() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcutsContext must be used within ShortcutsProvider');
  }
  return context;
}

interface ShortcutsProviderProps {
  children: ReactNode;
}

export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { focusState, setFocusState, clearFocusState } = useProjectStore();

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  // Mount global shortcuts hook
  useShortcuts({
    focusState,
    setFocusState,
    clearFocusState,
    isHelpOpen,
    onToggleHelp: toggleHelp,
    // Kanban-specific callbacks will be provided by KanbanBoard component
  });

  const contextValue: ShortcutsContextValue = {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
  };

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
      <ShortcutHelpOverlay isOpen={isHelpOpen} onClose={closeHelp} />
    </ShortcutsContext.Provider>
  );
}
