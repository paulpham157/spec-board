'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Constitution } from '@/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import {
  ScrollText,
  ChevronDown,
  ChevronRight,
  Shield,
  Calendar,
  Tag,
  FileText
} from 'lucide-react';

interface ConstitutionPanelProps {
  constitution: Constitution | null;
  hasConstitution: boolean;
}

export function ConstitutionPanel({ constitution, hasConstitution }: ConstitutionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  if (!hasConstitution || !constitution) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <ScrollText className="w-5 h-5" />
          <span className="text-sm">No constitution defined</span>
        </div>
      </div>
    );
  }

  const togglePrinciple = (index: number) => {
    const newExpanded = new Set(expandedPrinciples);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPrinciples(newExpanded);
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--secondary)]">
            <ScrollText className="w-5 h-5 text-[var(--foreground)]" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Project Constitution</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {constitution.principles.length} principles defined
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {constitution.version && (
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--secondary)] text-[var(--foreground)]">
              v{constitution.version}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border)]">
          {/* Metadata */}
          {(constitution.ratifiedDate || constitution.lastAmendedDate) && (
            <div className="px-4 py-3 bg-[var(--secondary)]/30 flex flex-wrap gap-4 text-xs">
              {constitution.ratifiedDate && (
                <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ratified: {constitution.ratifiedDate}</span>
                </div>
              )}
              {constitution.lastAmendedDate && (
                <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Last Amended: {constitution.lastAmendedDate}</span>
                </div>
              )}
            </div>
          )}

          {/* Principles */}
          {constitution.principles.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--muted-foreground)]" />
                Core Principles
              </h4>
              <div className="space-y-2">
                {constitution.principles.map((principle, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    <button
                      onClick={() => togglePrinciple(index)}
                      className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors text-left"
                    >
                      <span className="font-medium text-sm">{principle.name}</span>
                      {expandedPrinciples.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                      )}
                    </button>
                    {expandedPrinciples.has(index) && principle.description && (
                      <div className="px-3 pb-3 text-sm">
                        <MarkdownRenderer content={principle.description} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Sections */}
          {constitution.sections.length > 0 && (
            <div className="p-4 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--muted-foreground)]" />
                Additional Sections
              </h4>
              <div className="space-y-2">
                {constitution.sections.map((section, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors text-left"
                    >
                      <span className="font-medium text-sm">{section.name}</span>
                      {expandedSections.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                      )}
                    </button>
                    {expandedSections.has(index) && section.content && (
                      <div className="px-3 pb-3 text-sm">
                        <MarkdownRenderer content={section.content} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
