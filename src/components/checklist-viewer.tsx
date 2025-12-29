'use client';

import { useState } from 'react';
import { ExternalLink, ClipboardCheck, ChevronDown, ChevronRight, FolderOpen, Check, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn, openInEditor } from '@/lib/utils';
import type { SpecKitFile } from '@/types';

interface ChecklistFileProps {
  file: SpecKitFile;
  defaultExpanded?: boolean;
}

function ChecklistFile({ file, defaultExpanded = false }: ChecklistFileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const fileName = file.path.split('/').pop() || file.path;

  // Extract checklist name from filename (e.g., "ux-checklist.md" -> "UX Checklist")
  const displayName = fileName
    .replace('.md', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const handleOpenInEditor = () => {
    const result = openInEditor(file.path);
    setFeedback({ message: result.message, success: result.success });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full flex items-center gap-3 p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <ClipboardCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="font-medium text-sm flex-1 text-left truncate">{displayName}</span>
        {feedback && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs rounded transition-opacity',
            feedback.success
              ? 'text-green-400 bg-green-500/10'
              : 'text-red-400 bg-red-500/10'
          )}>
            {feedback.success ? (
              <Check className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{feedback.message}</span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenInEditor();
          }}
          title={file.path}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-[var(--border)]">
          <MarkdownRenderer content={file.content} />
        </div>
      )}
    </div>
  );
}

interface ChecklistViewerProps {
  checklists: SpecKitFile[];
  className?: string;
}

export function ChecklistViewer({ checklists, className }: ChecklistViewerProps) {
  if (!checklists || checklists.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No checklists yet</p>
        <p className="text-sm mt-2 text-center">
          Run <code className="bg-[var(--secondary)] px-1.5 py-0.5 rounded">/speckit.checklist</code> to generate domain-specific checklists
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {checklists.length} checklist{checklists.length !== 1 ? 's' : ''} available
        </p>
      </div>
      <div>
        {checklists.map((checklist, index) => (
          <ChecklistFile
            key={checklist.path}
            file={checklist}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
