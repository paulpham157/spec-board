'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, Keyboard, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_VERSION = '1.0.2';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Feature Detail',
    shortcuts: [
      { keys: ['Esc'], description: 'Close split view' },
      { keys: ['Ctrl', '\\'], description: 'Toggle split view' },
      { keys: ['Tab'], description: 'Switch panes (split mode)' },
      { keys: ['1-9'], description: 'Jump to section' },
      { keys: ['Shift', '1-9'], description: 'Open in right pane' },
      { keys: ['↑', '↓'], description: 'Navigate sections' },
      { keys: ['Enter'], description: 'Open section' },
      { keys: ['Shift', 'Enter'], description: 'Open in split view' },
    ],
  },
  {
    title: 'Split View',
    shortcuts: [
      { keys: ['←', '→'], description: 'Adjust split ratio' },
    ],
  },
  {
    title: 'Kanban Board',
    shortcuts: [
      { keys: ['Enter'], description: 'Open feature' },
      { keys: ['Space'], description: 'Open feature' },
    ],
  },
  {
    title: 'Project Selector',
    shortcuts: [
      { keys: ['H'], description: 'Home directory' },
      { keys: ['Backspace'], description: 'Parent directory' },
      { keys: ['↑', '↓'], description: 'Navigate list' },
      { keys: ['Enter'], description: 'Open/select' },
      { keys: ['Tab'], description: 'Accept suggestion' },
      { keys: ['Esc'], description: 'Close modal' },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center min-w-[22px] h-5 px-1',
      'bg-[var(--secondary)] border border-[var(--border)] rounded',
      'text-[10px] font-mono font-medium text-[var(--foreground)]'
    )}>
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{description}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-0.5">
            <KeyBadge>{key}</KeyBadge>
            {index < keys.length - 1 && (
              <span className="text-[10px] text-[var(--muted-foreground)]">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <h1 className="text-xl font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-6">
        <div className="space-y-6">
          {/* Version Info */}
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Info className="w-5 h-5 text-[var(--muted-foreground)]" />
              <h2 className="text-base font-semibold">About</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Application</span>
                <span className="font-medium">SpecBoard</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Version</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-[var(--secondary)] rounded">
                  v{APP_VERSION}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Description</span>
                <span className="text-[var(--foreground)]">Visual dashboard for spec-kit</span>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Keyboard className="w-5 h-5 text-[var(--muted-foreground)]" />
              <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHORTCUT_GROUPS.map((group, index) => (
                <div key={index} className="space-y-1">
                  <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    {group.title}
                  </h3>
                  <div className="bg-[var(--secondary)]/30 rounded-lg p-2">
                    {group.shortcuts.map((shortcut, sIndex) => (
                      <ShortcutRow key={sIndex} keys={shortcut.keys} description={shortcut.description} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
