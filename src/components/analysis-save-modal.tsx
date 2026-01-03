'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  initialContent?: string;
}

/**
 * Modal for saving analysis reports (T013-T017)
 * Features: textarea input, save button with loading, focus trap, keyboard handling, ARIA labels
 */
export function AnalysisSaveModal({
  isOpen,
  onClose,
  onSave,
  initialContent = '',
}: AnalysisSaveModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Focus textarea when modal opens (T016)
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close (T016)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    },
    [onClose, isSaving]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Focus trap (T016)
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Guard against empty NodeLists
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle save (T015)
  const handleSave = async () => {
    if (!content.trim()) {
      setError('Analysis content cannot be empty');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSave(content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-analysis-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 id="save-analysis-title" className="text-lg font-semibold">
            Save Analysis Report
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (T014) */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <label htmlFor="analysis-content" className="sr-only">
            Analysis content
          </label>
          <textarea
            ref={textareaRef}
            id="analysis-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your analysis report content here..."
            className={cn(
              'flex-1 w-full p-3 rounded-lg resize-none',
              'bg-[var(--secondary)]/30 border border-[var(--border)]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
              'placeholder:text-[var(--muted-foreground)]',
              'font-mono text-sm'
            )}
            aria-label="Analysis content"
            aria-describedby={error ? 'save-error' : undefined}
            disabled={isSaving}
          />

          {error && (
            <p id="save-error" className="mt-2 text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label={isSaving ? 'Saving...' : 'Save analysis'}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
