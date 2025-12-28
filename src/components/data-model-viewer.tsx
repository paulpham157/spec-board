'use client';

import { useState } from 'react';
import { ExternalLink, Database, Check, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn, openInEditor } from '@/lib/utils';

interface DataModelViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

export function DataModelViewer({ content, filePath, className }: DataModelViewerProps) {
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const handleOpenInEditor = () => {
    const result = openInEditor(filePath);
    setFeedback({ message: result.message, success: result.success });
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <Database className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No data model yet</p>
        <p className="text-sm mt-2">Create a data-model.md file to define data structures</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {filePath && (
        <div className="flex items-center justify-end gap-3 mb-4">
          {feedback && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-opacity',
              feedback.success
                ? 'text-green-400 bg-green-500/10'
                : 'text-red-400 bg-red-500/10'
            )}>
              {feedback.success ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {feedback.message}
            </div>
          )}
          <button
            onClick={handleOpenInEditor}
            title={filePath}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Editor
          </button>
        </div>
      )}
      <MarkdownRenderer content={content} />
    </div>
  );
}
