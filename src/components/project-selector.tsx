'use client';

import { useState, useEffect } from 'react';
import { Folder, FolderOpen, ChevronRight, Home, ArrowUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSpecKitProject: boolean;
}

interface BrowseResponse {
  currentPath: string;
  parentPath: string;
  entries: DirectoryEntry[];
  isSpecKitProject: boolean;
}

interface ProjectSelectorProps {
  onSelect: (path: string) => void;
  recentProjects: string[];
}

export function ProjectSelector({ onSelect, recentProjects }: ProjectSelectorProps) {
  const [currentPath, setCurrentPath] = useState<string>('~');
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [parentPath, setParentPath] = useState<string>('');
  const [isSpecKitProject, setIsSpecKitProject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectory = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to browse directory');
      }
      const data: BrowseResponse = await response.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setEntries(data.entries);
      setIsSpecKitProject(data.isSpecKitProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory('~');
  }, []);

  const handleNavigate = (path: string) => {
    fetchDirectory(path);
  };

  const handleSelect = () => {
    if (isSpecKitProject) {
      onSelect(currentPath);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--card)] rounded-lg border border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-2">Select Project</h2>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] bg-[var(--secondary)] rounded px-3 py-2">
          <Folder className="w-4 h-4" />
          <span className="truncate">{currentPath}</span>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2 p-2 border-b border-[var(--border)]">
        <button
          onClick={() => handleNavigate('~')}
          className="p-2 hover:bg-[var(--secondary)] rounded transition-colors"
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleNavigate(parentPath)}
          className="p-2 hover:bg-[var(--secondary)] rounded transition-colors"
          title="Parent directory"
          disabled={currentPath === parentPath}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        {isSpecKitProject && (
          <button
            onClick={handleSelect}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Check className="w-4 h-4" />
            Select This Project
          </button>
        )}
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div className="p-2 border-b border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)] px-2 mb-1">Recent Projects</p>
          <div className="space-y-1">
            {recentProjects.slice(0, 5).map((path) => (
              <button
                key={path}
                onClick={() => onSelect(path)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-[var(--secondary)] rounded transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-green-400" />
                <span className="truncate">{path.split('/').pop()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Directory listing */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]">
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-400">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]">
            No directories found
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => (
              <button
                key={entry.path}
                onClick={() => handleNavigate(entry.path)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors text-left',
                  entry.isSpecKitProject
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                    : 'hover:bg-[var(--secondary)]'
                )}
              >
                {entry.isSpecKitProject ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Folder className="w-4 h-4" />
                )}
                <span className="flex-1 truncate">{entry.name}</span>
                {entry.isSpecKitProject && (
                  <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded">
                    spec-kit
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
