'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { X, Search, FolderOpen, Folder, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project, FeatureStage } from '@/types';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSpecKitProject: boolean;
}

interface ProjectPreview {
  project: Project;
  featureCount: number;
  completionPercentage: number;
  stageBreakdown: Record<FeatureStage, number>;
}

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (project: Project) => void;
}

export function OpenProjectModal({ isOpen, onClose, onOpen }: OpenProjectModalProps) {
  const [pathInput, setPathInput] = useState('~/');
  const [suggestions, setSuggestions] = useState<DirectoryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load home directory contents when modal opens
  const loadHomeDirectory = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/browse?path=' + encodeURIComponent('~'));
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.entries.slice(0, 8));
        setShowSuggestions(true);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Focus input and load home directory when modal opens
  useEffect(() => {
    if (isOpen) {
      setPathInput('~/');
      loadHomeDirectory();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setPathInput('~/');
      setSuggestions([]);
      setShowSuggestions(false);
      setPreview(null);
      setError(null);
    }
  }, [isOpen, loadHomeDirectory]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lastSlashIndex = input.lastIndexOf('/');
    const parentDir = lastSlashIndex > 0
      ? input.substring(0, lastSlashIndex)
      : (input.startsWith('/') ? '/' : '~');
    const partialName = lastSlashIndex >= 0
      ? input.substring(lastSlashIndex + 1).toLowerCase()
      : input.toLowerCase();

    setIsLoadingSuggestions(true);
    try {
      const url = '/api/browse?path=' + encodeURIComponent(parentDir);
      const response = await fetch(url);
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const data = await response.json();
      const filtered = data.entries
        .filter((entry: DirectoryEntry) => entry.name.toLowerCase().startsWith(partialName))
        .slice(0, 8);

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced fetch
  const debouncedFetch = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(input), 150);
  }, [fetchSuggestions]);

  // Load project preview
  const loadPreview = useCallback(async (path: string) => {
    setIsLoadingPreview(true);
    setError(null);
    setPreview(null);

    try {
      const url = '/api/project?path=' + encodeURIComponent(path);
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Not a valid spec-kit project');
      }

      const project: Project = await response.json();

      const stageBreakdown: Record<FeatureStage, number> = {
        specify: 0, plan: 0, tasks: 0, implement: 0, complete: 0
      };
      let totalTasks = 0, completedTasks = 0;

      for (const feature of project.features) {
        stageBreakdown[feature.stage]++;
        totalTasks += feature.totalTasks;
        completedTasks += feature.completedTasks;
      }

      setPreview({
        project,
        featureCount: project.features.length,
        completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        stageBreakdown,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Accept suggestion
  const acceptSuggestion = (suggestion: DirectoryEntry) => {
    setPathInput(suggestion.path);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (suggestion.isSpecKitProject) {
      loadPreview(suggestion.path);
    } else {
      setPreview(null);
      setError(null);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPathInput(value);
    setPreview(null);
    setError(null);
    debouncedFetch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
          return;
        case 'Tab':
          e.preventDefault();
          if (selectedIndex >= 0) {
            acceptSuggestion(suggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            acceptSuggestion(suggestions[0]);
          }
          return;
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            acceptSuggestion(suggestions[selectedIndex]);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          return;
      }
    }

    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle open button click
  const handleOpen = () => {
    if (preview) {
      onOpen(preview.project);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Open Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Search input */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--secondary)] rounded-lg border border-[var(--border)] focus-within:border-[var(--ring)]">
              <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                ref={inputRef}
                type="text"
                value={pathInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => pathInput && debouncedFetch(pathInput)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search or paste project path..."
                className="flex-1 bg-transparent outline-none text-sm"
                spellCheck={false}
                autoComplete="off"
              />
              {isLoadingSuggestions && (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10 max-h-64 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.path}
                    onClick={() => acceptSuggestion(suggestion)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                      selectedIndex === index
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'hover:bg-[var(--secondary)]',
                      suggestion.isSpecKitProject && selectedIndex !== index && 'text-green-400'
                    )}
                  >
                    {suggestion.isSpecKitProject ? (
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="flex-1 truncate">{suggestion.name}</span>
                    {suggestion.isSpecKitProject && (
                      <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded">
                        spec-kit
                      </span>
                    )}
                  </button>
                ))}
                <div className="px-3 py-1.5 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
                  ↑↓ navigate • Tab accept • Esc close
                </div>
              </div>
            )}
          </div>

          {/* Preview card */}
          {isLoadingPreview && (
            <div className="mt-4 p-4 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
              <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading project...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {preview && (
            <div className="mt-4 p-4 bg-[var(--secondary)] rounded-lg border border-green-500/30">
              <div className="flex items-start gap-3">
                <FolderOpen className="w-6 h-6 text-green-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{preview.project.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                    {preview.project.path}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-[var(--muted-foreground)]">
                    <span>{preview.featureCount} features</span>
                    <span>•</span>
                    <span>{preview.completionPercentage}% complete</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOpen}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Check className="w-4 h-4" />
                Open Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
