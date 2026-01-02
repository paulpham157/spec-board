'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Keyboard, Info, Github, ExternalLink, FileText, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/settings-store';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ReadmeViewer } from '@/components/readme-viewer';
import { ChangelogViewer } from '@/components/changelog-viewer';

interface AppInfo {
  name: string;
  version: string;
  description: string;
  license: string;
  licenseUrl: string;
  repository: string;
  readme: string;
  changelog: string;
}

type MenuSection = 'shortcuts' | 'about';

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

function ShortcutsContent() {
  const { shortcutsEnabled, setShortcutsEnabled, loadSettings } = useSettingsStore();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Keyboard Shortcuts</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Navigate SpecBoard faster with keyboard shortcuts
        </p>
      </div>

      {/* Toggle Switch */}
      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Enable Keyboard Shortcuts</span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Turn off to disable all keyboard shortcuts
            </p>
          </div>
          <button
            onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              shortcutsEnabled ? 'bg-green-500' : 'bg-[var(--secondary)]'
            )}
            role="switch"
            aria-checked={shortcutsEnabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                shortcutsEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Shortcuts List */}
      <div className={cn(
        'grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity',
        !shortcutsEnabled && 'opacity-50 pointer-events-none'
      )}>
        {SHORTCUT_GROUPS.map((group, index) => (
          <div key={index} className="space-y-1">
            <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
              {group.title}
            </h3>
            <div className="bg-[var(--secondary)]/30 rounded-lg p-3 border border-[var(--border)]">
              {group.shortcuts.map((shortcut, sIndex) => (
                <ShortcutRow key={sIndex} keys={shortcut.keys} description={shortcut.description} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutContent() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'changelog'>('readme');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAppInfo() {
      try {
        const response = await fetch('/api/app-info');
        if (response.ok) {
          const data = await response.json();
          setAppInfo(data);
        }
      } catch (error) {
        console.error('Failed to load app info:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAppInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--muted-foreground)]">Loading...</div>
      </div>
    );
  }

  if (!appInfo) {
    return (
      <div className="text-red-400">Failed to load app information</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">About</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Application information and documentation
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('readme')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'readme'
              ? 'border-blue-500 text-[var(--foreground)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          README
        </button>
        <button
          onClick={() => setActiveTab('changelog')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'changelog'
              ? 'border-blue-500 text-[var(--foreground)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <History className="w-4 h-4 inline-block mr-2" />
          Changelog
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'readme' && (
        <div className="space-y-4">
          {/* Overview Info */}
          <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">Version</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-[var(--secondary)] rounded border border-[var(--border)]">
                  v{appInfo.version}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">License</span>
                <a
                  href={appInfo.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {appInfo.license}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={appInfo.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* README Content */}
          <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
            <ReadmeViewer content={appInfo.readme} />
          </div>
        </div>
      )}

      {activeTab === 'changelog' && (
        <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
          <ChangelogViewer content={appInfo.changelog} />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<MenuSection>('shortcuts');
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  // Fetch app info for footer
  useEffect(() => {
    async function loadAppInfo() {
      try {
        const response = await fetch('/api/app-info');
        if (response.ok) {
          const data = await response.json();
          setAppInfo(data);
        }
      } catch (error) {
        console.error('Failed to load app info:', error);
      }
    }
    loadAppInfo();
  }, []);

  const menuItems: { id: MenuSection; label: string; icon: React.ReactNode }[] = [
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main content - 2 column layout */}
      <div className="flex-1 flex">
        {/* Left sidebar menu - 1/4 width */}
        <aside className="w-1/4 min-w-[200px] max-w-[280px] border-r border-[var(--border)] bg-[var(--card)] p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeSection === item.id
                    ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50 hover:text-[var(--foreground)]'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content area - 3/4 width */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeSection === 'shortcuts' && <ShortcutsContent />}
          {activeSection === 'about' && <AboutContent />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-3">
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="font-medium">{appInfo?.name || 'SpecBoard'}</span>
          <span>v{appInfo?.version || '...'}</span>
          <span>—</span>
          <span>{appInfo?.description || 'Visual dashboard for spec-kit'}</span>
          <span>—</span>
          <a
            href={appInfo?.licenseUrl || 'https://github.com/paulpham157/spec-board/blob/main/LICENSE'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {appInfo?.license || 'AGPL-3.0'} Copyleft
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
