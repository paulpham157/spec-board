'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { TrendingUp, Save, CheckCircle2, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { AnalysisSaveModal } from './analysis-save-modal';
import { cn } from '@/lib/utils';
import type { FeatureAnalysis } from '@/types';

interface AnalysisViewerProps {
  analysis: FeatureAnalysis;
  featurePath: string;
  className?: string;
}

// Types for parsed analysis
interface AnalysisSection {
  title: string;
  type: 'summary' | 'coverage' | 'gaps' | 'recommendations' | 'metrics' | 'other';
  content: string;
  items?: string[];
}

interface ParsedAnalysis {
  title?: string;
  sections: AnalysisSection[];
  rawContent: string;
}

// Parse analysis content into structured sections
function parseAnalysisContent(content: string): ParsedAnalysis {
  const result: ParsedAnalysis = {
    sections: [],
    rawContent: content
  };

  const lines = content.split('\n');
  let currentSection: AnalysisSection | null = null;
  let currentItems: string[] = [];

  for (const line of lines) {
    // Parse title from "# Analysis" or similar
    const titleMatch = line.match(/^#\s+(.+)/);
    if (titleMatch && !result.title) {
      result.title = titleMatch[1].trim();
      continue;
    }

    // Parse section headers (## headers)
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        if (currentItems.length > 0) {
          currentSection.items = currentItems;
        }
        result.sections.push(currentSection);
      }

      const sectionTitle = sectionMatch[1].trim();
      const sectionLower = sectionTitle.toLowerCase();

      // Determine section type
      let type: AnalysisSection['type'] = 'other';
      if (sectionLower.includes('summary') || sectionLower.includes('overview')) {
        type = 'summary';
      } else if (sectionLower.includes('coverage') || sectionLower.includes('alignment')) {
        type = 'coverage';
      } else if (sectionLower.includes('gap') || sectionLower.includes('missing') || sectionLower.includes('issue')) {
        type = 'gaps';
      } else if (sectionLower.includes('recommend') || sectionLower.includes('suggestion') || sectionLower.includes('action')) {
        type = 'recommendations';
      } else if (sectionLower.includes('metric') || sectionLower.includes('score') || sectionLower.includes('stat')) {
        type = 'metrics';
      }

      currentSection = {
        title: sectionTitle,
        type,
        content: ''
      };
      currentItems = [];
      continue;
    }

    // Collect content for current section
    if (currentSection) {
      // Check for list items
      const listMatch = line.match(/^[-*]\s+(.+)$/);
      if (listMatch) {
        currentItems.push(listMatch[1].trim());
      } else if (line.trim()) {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
  }

  // Save last section
  if (currentSection) {
    if (currentItems.length > 0) {
      currentSection.items = currentItems;
    }
    result.sections.push(currentSection);
  }

  return result;
}

// Section style configuration
interface SectionStyle {
  icon: React.ReactNode;
  borderColor: string;
  bgGradient: string;
  iconBg: string;
  badgeColor: string;
}

function getSectionStyle(type: AnalysisSection['type']): SectionStyle {
  switch (type) {
    case 'summary':
      return {
        icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
        borderColor: 'border-l-blue-500',
        bgGradient: 'from-blue-500/5 to-transparent',
        iconBg: 'bg-blue-500/10',
        badgeColor: 'bg-blue-500/20 text-blue-400',
      };
    case 'coverage':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        borderColor: 'border-l-emerald-500',
        bgGradient: 'from-emerald-500/5 to-transparent',
        iconBg: 'bg-emerald-500/10',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
      };
    case 'gaps':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        borderColor: 'border-l-amber-500',
        bgGradient: 'from-amber-500/5 to-transparent',
        iconBg: 'bg-amber-500/10',
        badgeColor: 'bg-amber-500/20 text-amber-400',
      };
    case 'recommendations':
      return {
        icon: <Target className="w-4 h-4 text-violet-400" />,
        borderColor: 'border-l-violet-500',
        bgGradient: 'from-violet-500/5 to-transparent',
        iconBg: 'bg-violet-500/10',
        badgeColor: 'bg-violet-500/20 text-violet-400',
      };
    case 'metrics':
      return {
        icon: <BarChart3 className="w-4 h-4 text-pink-400" />,
        borderColor: 'border-l-pink-500',
        bgGradient: 'from-pink-500/5 to-transparent',
        iconBg: 'bg-pink-500/10',
        badgeColor: 'bg-pink-500/20 text-pink-400',
      };
    default:
      return {
        icon: <TrendingUp className="w-4 h-4 text-zinc-400" />,
        borderColor: 'border-l-zinc-500',
        bgGradient: 'from-zinc-500/5 to-transparent',
        iconBg: 'bg-zinc-500/10',
        badgeColor: 'bg-zinc-500/20 text-zinc-400',
      };
  }
}

/**
 * AnalysisViewer component with structured/markdown view toggle
 */
export function AnalysisViewer({ analysis, featurePath, className }: AnalysisViewerProps) {
  const { reports } = analysis;

  // State for view mode toggle
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  // State for save modal (T019)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // State for notifications (T020, T034)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const selectedReport = reports[0] || null;

  // Parse analysis content
  const parsedAnalysis = useMemo(() => {
    if (!selectedReport?.content) return null;
    try {
      return parseAnalysisContent(selectedReport.content);
    } catch (e) {
      console.error('Parser error:', e);
      return null;
    }
  }, [selectedReport?.content]);

  // Check if we have structured content to display
  const hasStructuredContent = parsedAnalysis && parsedAnalysis.sections.length > 0;

  // Handle save (T015, T020)
  const handleSave = useCallback(async (content: string) => {
    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featurePath, content }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save analysis');
    }

    setNotification({ type: 'success', message: 'Analysis saved successfully' });
  }, [featurePath]);

  // No analysis data available - show instructions (T025)
  if (reports.length === 0) {
    return (
      <div className={cn('flex flex-col py-6', className)}>
        <div className="flex flex-col items-center mb-6 text-[var(--muted-foreground)]">
          <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No analysis yet</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-[var(--secondary)]/30 rounded-lg">
            <h4 className="font-medium mb-2">How to Generate Analysis</h4>
            <ol className="text-[var(--muted-foreground)] space-y-2 list-decimal list-inside">
              <li>Run <code className="bg-zinc-800 px-1.5 py-0.5 rounded">/speckit.analyze</code> in Claude Code</li>
              <li>Copy the analysis output</li>
              <li>Click the <strong>Save Analysis</strong> button below to save it</li>
            </ol>
          </div>

          {/* Save button for empty state (T018) */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className={cn(
              'flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg',
              'bg-blue-600 hover:bg-blue-700 text-white transition-colors'
            )}
          >
            <Save className="w-4 h-4" />
            Save Analysis
          </button>
        </div>

        {/* Save Modal */}
        <AnalysisSaveModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Notification toast (T020, T034) */}
      {notification && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg',
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          )}
          role="alert"
        >
          {notification.message}
        </div>
      )}

      {/* View mode toggle */}
      {hasStructuredContent && (
        <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1 mb-4" role="tablist" aria-label="View mode">
          <button
            onClick={() => setShowRawMarkdown(false)}
            role="tab"
            aria-selected={!showRawMarkdown}
            aria-controls="analysis-content"
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
            aria-controls="analysis-content"
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
      )}

      {/* Content */}
      <div id="analysis-content">
        {showRawMarkdown || !hasStructuredContent ? (
          /* Markdown view - show raw content */
          selectedReport && (
            <pre className="text-sm font-mono whitespace-pre-wrap bg-[var(--secondary)]/30 p-4 rounded-lg overflow-auto">
              {selectedReport.content}
            </pre>
          )
        ) : (
          /* Structured view */
          <div className="space-y-5">
            {/* Title Header */}
            {parsedAnalysis?.title && (
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-[var(--border)] rounded-2xl p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-blue-400">Analysis Report</span>
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">{parsedAnalysis.title}</h1>
                </div>
              </div>
            )}

            {/* Sections */}
            {parsedAnalysis?.sections.map((section, index) => {
              const style = getSectionStyle(section.type);
              const itemCount = section.items?.length || 0;

              return (
                <div
                  key={index}
                  className={cn(
                    'relative overflow-hidden',
                    'bg-[var(--card)] border border-[var(--border)] rounded-xl',
                    'border-l-4',
                    style.borderColor
                  )}
                >
                  {/* Subtle gradient background */}
                  <div className={cn('absolute inset-0 bg-gradient-to-r opacity-50', style.bgGradient)} />

                  {/* Section header */}
                  <div className="relative flex items-center justify-between px-5 py-4 border-b border-[var(--border)]/50">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', style.iconBg)}>
                        {style.icon}
                      </div>
                      <h2 className="text-base font-semibold text-[var(--foreground)]">{section.title}</h2>
                    </div>
                    {itemCount > 0 && (
                      <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', style.badgeColor)}>
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Section content */}
                  <div className="relative p-5 space-y-4">
                    {/* Paragraph content - render with markdown support */}
                    {section.content && (
                      <div className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                        <MarkdownRenderer content={section.content} />
                      </div>
                    )}

                    {/* List items */}
                    {section.items && section.items.length > 0 && (
                      <ul className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-start gap-3 text-sm group"
                          >
                            <span className={cn(
                              'flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full',
                              style.borderColor.replace('border-l-', 'bg-')
                            )} />
                            <span className="text-[var(--foreground)] leading-relaxed flex-1">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Modal (T019) */}
      <AnalysisSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
