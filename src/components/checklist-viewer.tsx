'use client';

import { useState, useMemo, useCallback, useRef, KeyboardEvent } from 'react';
import { CheckCircle2, Circle, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpecKitFile, ChecklistToggleResponse } from '@/types';

// Parsed checklist types
interface ChecklistItem {
  text: string;
  checked: boolean;
  tag?: string; // e.g., "[Gap]", "[Clarity]", "[Assumption]"
  lineIndex: number; // 0-based line number in source file for toggle API
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

interface SummaryTableRow {
  dimension: string;
  items: string;
  status: string;
}

interface ParsedChecklist {
  title: string;
  purpose?: string;
  created?: string;
  feature?: string;
  sections: ChecklistSection[];
  notes: string[];
  summaryTable: SummaryTableRow[];
}

// Parse checklist markdown content
function parseChecklistContent(content: string): ParsedChecklist {
  const lines = content.split('\n');
  const result: ParsedChecklist = {
    title: '',
    sections: [],
    notes: [],
    summaryTable: [],
  };

  let currentSection: ChecklistSection | null = null;
  let inNotesSection = false;
  let inSummarySection = false;
  let summaryTableStarted = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    // Parse title (# heading)
    if (trimmed.startsWith('# ')) {
      result.title = trimmed.slice(2).trim();
      continue;
    }

    // Parse metadata
    if (trimmed.startsWith('**Purpose**:')) {
      result.purpose = trimmed.replace('**Purpose**:', '').trim();
      continue;
    }
    if (trimmed.startsWith('**Created**:')) {
      result.created = trimmed.replace('**Created**:', '').trim();
      continue;
    }
    if (trimmed.startsWith('**Feature**:')) {
      result.feature = trimmed.replace('**Feature**:', '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      continue;
    }

    // Parse section headers (## heading)
    if (trimmed.startsWith('## ')) {
      const sectionTitle = trimmed.slice(3).trim();
      const lowerTitle = sectionTitle.toLowerCase();

      if (lowerTitle === 'notes') {
        inNotesSection = true;
        inSummarySection = false;
        currentSection = null;
      } else if (lowerTitle === 'summary') {
        inSummarySection = true;
        inNotesSection = false;
        currentSection = null;
        summaryTableStarted = false;
      } else {
        inNotesSection = false;
        inSummarySection = false;
        currentSection = { title: sectionTitle, items: [] };
        result.sections.push(currentSection);
      }
      continue;
    }

    // Parse summary table rows
    if (inSummarySection && trimmed.startsWith('|')) {
      // Skip header row and separator row
      if (trimmed.includes('Dimension') || trimmed.match(/^\|[-\s|]+\|$/)) {
        summaryTableStarted = true;
        continue;
      }

      if (summaryTableStarted) {
        // Parse table row: | Dimension | Items | Status |
        const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 3) {
          // Skip total row (bold text)
          if (!cells[0].startsWith('**')) {
            result.summaryTable.push({
              dimension: cells[0],
              items: cells[1],
              status: cells[2],
            });
          }
        }
      }
      continue;
    }

    // Parse checklist items
    const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch && currentSection) {
      const checked = checkboxMatch[1].toLowerCase() === 'x';
      let text = checkboxMatch[2].trim();

      // Extract tag like [Gap], [Clarity], [Assumption]
      let tag: string | undefined;
      const tagMatch = text.match(/\[([^\]]+)\]$/);
      if (tagMatch) {
        tag = tagMatch[1];
        text = text.replace(/\s*\[[^\]]+\]$/, '').trim();
      }

      currentSection.items.push({ text, checked, tag, lineIndex });
      continue;
    }

    // Parse notes section content
    if (inNotesSection && trimmed.startsWith('-')) {
      result.notes.push(trimmed.slice(1).trim());
    } else if (inNotesSection && trimmed && !trimmed.startsWith('#')) {
      result.notes.push(trimmed);
    }
  }

  return result;
}

// Checklist item component
function ChecklistItemRow({
  item,
  onToggle,
  isSaving,
}: {
  item: ChecklistItem;
  onToggle?: (item: ChecklistItem) => void;
  isSaving?: boolean;
}) {
  // Get tag color config
  const getTagStyle = (tag: string): { bg: string; textVar: string } => {
    if (tag === 'Gap') return { bg: 'bg-red-500/20', textVar: '--tag-text-error' };
    if (tag === 'Clarity') return { bg: 'bg-amber-500/20', textVar: '--tag-text-warning' };
    if (tag === 'Assumption') return { bg: 'bg-blue-500/20', textVar: '--tag-text-info' };
    return { bg: 'bg-[var(--secondary)]', textVar: '--muted-foreground' };
  };

  const handleClick = () => {
    if (onToggle && !isSaving) {
      onToggle(item);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && onToggle && !isSaving) {
      e.preventDefault();
      onToggle(item);
    }
  };

  const isInteractive = !!onToggle;

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-2 px-3 rounded-lg transition-colors',
        item.checked ? 'bg-[var(--color-success)]/5' : 'hover:bg-[var(--secondary)]/30',
        isInteractive && 'cursor-pointer',
        isSaving && 'opacity-50 pointer-events-none'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'checkbox' : undefined}
      aria-checked={isInteractive ? item.checked : undefined}
      aria-label={isInteractive ? `${item.text} - ${item.checked ? 'checked' : 'unchecked'}` : undefined}
    >
      {isSaving ? (
        <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin text-[var(--muted-foreground)]" />
      ) : item.checked ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-success)' }} />
      ) : (
        <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
      )}
      <span className={cn(
        'text-sm flex-1',
        item.checked && 'text-[var(--muted-foreground)]'
      )}>
        {item.text}
      </span>
      {item.tag && (
        <span
          className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', getTagStyle(item.tag).bg)}
          style={{ color: `var(${getTagStyle(item.tag).textVar})` }}
        >
          {item.tag}
        </span>
      )}
    </div>
  );
}

// Section component with progress
function ChecklistSectionView({
  section,
  onToggle,
  savingItems,
}: {
  section: ChecklistSection;
  onToggle?: (item: ChecklistItem) => void;
  savingItems?: Set<number>;
}) {
  const completed = section.items.filter(i => i.checked).length;
  const total = section.items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">{section.title}</h3>
        <span
          className="text-xs font-mono"
          style={{ color: isComplete ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        >
          {completed}/{total}
        </span>
      </div>
      <div className="h-1 bg-[var(--secondary)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: isComplete ? 'var(--color-success)' : 'var(--color-info)'
          }}
        />
      </div>
      <div className="space-y-1">
        {section.items.map((item, index) => (
          <ChecklistItemRow
            key={index}
            item={item}
            onToggle={onToggle}
            isSaving={savingItems?.has(item.lineIndex)}
          />
        ))}
      </div>
    </div>
  );
}

// Status badge component for summary table
function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase();

  const getStatusStyle = (): { bg: string; textVar: string } => {
    if (statusLower === 'pending') return { bg: 'bg-amber-500/20', textVar: '--tag-text-warning' };
    if (statusLower === 'complete') return { bg: 'bg-emerald-500/20', textVar: '--tag-text-success' };
    if (statusLower === 'in progress') return { bg: 'bg-blue-500/20', textVar: '--tag-text-info' };
    return { bg: 'bg-[var(--secondary)]', textVar: '--muted-foreground' };
  };

  const style = getStatusStyle();

  return (
    <span
      className={cn('text-xs px-2 py-0.5 rounded', style.bg)}
      style={{ color: `var(${style.textVar})` }}
    >
      {status}
    </span>
  );
}

// Summary table component
function SummaryTableView({ rows }: { rows: SummaryTableRow[] }) {
  if (rows.length === 0) return null;

  // Calculate totals
  const totalItems = rows.reduce((sum, r) => sum + parseInt(r.items) || 0, 0);

  return (
    <div className="mb-6">
      <h3 className="font-medium text-sm mb-3">Summary</h3>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--secondary)]/50">
            <tr>
              <th className="text-left p-2 font-medium">Dimension</th>
              <th className="text-center p-2 font-medium w-20">Items</th>
              <th className="text-center p-2 font-medium w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-[var(--border)]">
                <td className="p-2">{row.dimension}</td>
                <td className="p-2 text-center font-mono text-xs">{row.items}</td>
                <td className="p-2 text-center">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t border-[var(--border)] bg-[var(--secondary)]/30 font-medium">
              <td className="p-2">Total</td>
              <td className="p-2 text-center font-mono text-xs">{totalItems}</td>
              <td className="p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Structured view component
function StructuredChecklistView({
  parsed,
  totalItems,
  completedItems,
  onToggle,
  savingItems,
}: {
  parsed: ParsedChecklist;
  totalItems: number;
  completedItems: number;
  onToggle?: (item: ChecklistItem) => void;
  savingItems?: Set<number>;
}) {
  return (
    <div>
      {/* Header with metadata */}
      {(parsed.purpose || parsed.created || parsed.feature) && (
        <div className="mb-6 p-4 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)]">
          {parsed.purpose && (
            <p className="text-sm text-[var(--muted-foreground)] mb-1">
              <span className="font-medium text-[var(--foreground)]">Purpose:</span> {parsed.purpose}
            </p>
          )}
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            {parsed.created && <span>Created: {parsed.created}</span>}
            {parsed.feature && <span>Feature: {parsed.feature}</span>}
          </div>
        </div>
      )}

      {/* Summary table */}
      <SummaryTableView rows={parsed.summaryTable} />

      {/* Overall progress */}
      {totalItems > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                completedItems === totalItems ? 'bg-emerald-500' : 'bg-blue-500'
              )}
              style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
          <span
            className={cn(
              'text-sm font-mono',
              completedItems === totalItems ? '' : 'text-[var(--muted-foreground)]'
            )}
            style={completedItems === totalItems ? { color: 'var(--tag-text-success)' } : undefined}
          >
            {completedItems}/{totalItems}
          </span>
        </div>
      )}

      {/* Sections */}
      {parsed.sections.map((section, index) => (
        <ChecklistSectionView
          key={index}
          section={section}
          onToggle={onToggle}
          savingItems={savingItems}
        />
      ))}

      {/* Notes */}
      {parsed.notes.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" style={{ color: 'var(--tag-text-info)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--tag-text-info)' }}>Notes</span>
          </div>
          <ul className="space-y-1">
            {parsed.notes.map((note, index) => (
              <li key={index} className="text-sm text-[var(--muted-foreground)]">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Single checklist file component
function ChecklistContent({ file, filePath }: { file: SpecKitFile; filePath: string }) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [localContent, setLocalContent] = useState(file.content);
  const [savingItems, setSavingItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Re-parse when local content changes
  const parsed = useMemo(() => parseChecklistContent(localContent), [localContent]);

  // Calculate overall progress
  const totalItems = parsed.sections.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = parsed.sections.reduce((sum, s) => sum + s.items.filter(i => i.checked).length, 0);

  // Handle toggle with optimistic update and debouncing
  const handleToggle = useCallback(async (item: ChecklistItem) => {
    const { lineIndex, checked } = item;

    // Clear any existing debounce timer for this item
    const existingTimer = debounceTimers.current.get(lineIndex);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Optimistic update - immediately update local state
    setLocalContent(prevContent => {
      const lines = prevContent.split('\n');
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        // Toggle the checkbox
        lines[lineIndex] = line.replace(/\[([ xX])\]/, checked ? '[ ]' : '[x]');
      }
      return lines.join('\n');
    });

    // Clear any previous error
    setError(null);

    // Debounce the API call (300ms)
    const timer = setTimeout(async () => {
      setSavingItems(prev => new Set(prev).add(lineIndex));

      try {
        const response = await fetch('/api/checklist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath,
            lineIndex,
            expectedState: checked, // The state BEFORE toggle
          }),
        });

        const data: ChecklistToggleResponse = await response.json();

        if (!data.success) {
          // Rollback only the specific failed item, not the entire document
          setLocalContent(prevContent => {
            const lines = prevContent.split('\n');
            if (lineIndex >= 0 && lineIndex < lines.length) {
              const line = lines[lineIndex];
              // Revert the checkbox back to its original state
              lines[lineIndex] = line.replace(/\[([ xX])\]/, checked ? '[x]' : '[ ]');
            }
            return lines.join('\n');
          });
          setError(data.message || 'Failed to save changes');

          // If conflict, suggest refresh
          if (data.error === 'conflict') {
            setError('File was modified externally. Please refresh the page.');
          }
        }
      } catch (err) {
        // Rollback only the specific failed item on network error
        setLocalContent(prevContent => {
          const lines = prevContent.split('\n');
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];
            // Revert the checkbox back to its original state
            lines[lineIndex] = line.replace(/\[([ xX])\]/, checked ? '[x]' : '[ ]');
          }
          return lines.join('\n');
        });
        setError('Network error. Please try again.');
      } finally {
        setSavingItems(prev => {
          const next = new Set(prev);
          next.delete(lineIndex);
          return next;
        });
        debounceTimers.current.delete(lineIndex);
      }
    }, 300);

    debounceTimers.current.set(lineIndex, timer);
  }, [filePath, file.content]);

  return (
    <div>
      {/* Error toast */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1 mb-4" role="tablist" aria-label="View mode">
        <button
          onClick={() => setShowRawMarkdown(false)}
          role="tab"
          aria-selected={!showRawMarkdown}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            !showRawMarkdown
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Structured
        </button>
        <button
          onClick={() => setShowRawMarkdown(true)}
          role="tab"
          aria-selected={showRawMarkdown}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            showRawMarkdown
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Markdown
        </button>
      </div>

      {/* Content */}
      {showRawMarkdown ? (
        <pre className="text-sm font-mono whitespace-pre-wrap bg-[var(--secondary)]/30 p-4 rounded-lg overflow-auto">
          {localContent}
        </pre>
      ) : (
        <StructuredChecklistView
          parsed={parsed}
          totalItems={totalItems}
          completedItems={completedItems}
          onToggle={handleToggle}
          savingItems={savingItems}
        />
      )}

      {/* Screen reader announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {error && `Error: ${error}`}
      </div>
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
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
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
      {checklists.map((checklist) => (
        <ChecklistContent key={checklist.path} file={checklist} filePath={checklist.path} />
      ))}
    </div>
  );
}
