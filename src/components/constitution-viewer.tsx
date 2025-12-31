'use client';

import { useState } from 'react';
import {
  FileText,
  Scale,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  BookOpen,
  Shield,
  Workflow,
  Gavel,
  ListChecks,
  GitCompare,
  Plus,
  Minus,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';
import type { Constitution, ConstitutionPrinciple, ConstitutionSection, ConstitutionSubsection, SyncImpactReport } from '@/types';

interface ConstitutionViewerProps {
  constitution: Constitution | null;
  className?: string;
}

// Get icon for section based on name
function getSectionIcon(name: string) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('quality')) return ListChecks;
  if (nameLower.includes('workflow') || nameLower.includes('development')) return Workflow;
  if (nameLower.includes('governance')) return Gavel;
  if (nameLower.includes('security')) return Shield;
  return BookOpen;
}

// Sync Impact Report Card component
function SyncImpactReportCard({ report }: { report: SyncImpactReport }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = report.versionChange ||
    report.addedSections.length > 0 ||
    report.removedSections.length > 0 ||
    report.templatesStatus.length > 0;

  if (!hasContent) return null;

  return (
    <div className="bg-[var(--card)] border border-amber-500/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-amber-500/10 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-amber-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
        )}
        <GitCompare className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="font-medium flex-1 text-amber-400">Sync Impact Report</span>
        {report.versionChange && (
          <code className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
            {report.versionChange.split(' ')[0]} → {report.versionChange.split('→')[1]?.trim().split(' ')[0] || ''}
          </code>
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-11 space-y-4">
          {/* Version Change */}
          {report.versionChange && (
            <div>
              <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                Version Change
              </div>
              <p className="text-sm text-[var(--foreground)]">{report.versionChange}</p>
            </div>
          )}

          {/* Modified Principles */}
          {report.modifiedPrinciples && report.modifiedPrinciples !== 'N/A' && (
            <div>
              <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                Modified Principles
              </div>
              <p className="text-sm text-[var(--foreground)]">{report.modifiedPrinciples}</p>
            </div>
          )}

          {/* Added Sections */}
          {report.addedSections.length > 0 && (
            <div>
              <div className="text-xs font-medium text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Added Sections ({report.addedSections.length})
              </div>
              <ul className="space-y-1">
                {report.addedSections.map((section, idx) => (
                  <li key={idx} className="text-sm text-[var(--foreground)] flex items-center gap-2">
                    <span className="text-green-400">+</span>
                    {section}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Removed Sections */}
          {report.removedSections.length > 0 && (
            <div>
              <div className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Minus className="w-3 h-3" />
                Removed Sections ({report.removedSections.length})
              </div>
              <ul className="space-y-1">
                {report.removedSections.map((section, idx) => (
                  <li key={idx} className="text-sm text-[var(--foreground)] flex items-center gap-2">
                    <span className="text-red-400">-</span>
                    {section}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Templates Status */}
          {report.templatesStatus.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                Templates Status ({report.templatesStatus.length})
              </div>
              <ul className="space-y-1">
                {report.templatesStatus.map((item, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <code className="text-xs bg-[var(--secondary)] px-1.5 py-0.5 rounded font-mono">
                      {item.template.split('/').pop()}
                    </code>
                    <span className="text-[var(--muted-foreground)]">{item.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up TODOs */}
          {report.followUpTodos && report.followUpTodos !== 'None' && (
            <div>
              <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Follow-up TODOs
              </div>
              <p className="text-sm text-[var(--foreground)]">{report.followUpTodos}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Principle Card component
function PrincipleCard({ principle, index }: { principle: ConstitutionPrinciple; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First one expanded by default

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <Scale className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="font-medium flex-1">{principle.name}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-11">
          <MarkdownRenderer content={principle.description} />
        </div>
      )}
    </div>
  );
}

// Subsection Card component (for items under Quality Standards, Development Workflow, etc.)
function SubsectionCard({ subsection, index }: { subsection: ConstitutionSubsection; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <span className="font-medium flex-1">{subsection.name}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-11">
          <MarkdownRenderer content={subsection.content} />
        </div>
      )}
    </div>
  );
}

// Section Card component
function SectionCard({ section }: { section: ConstitutionSection }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getSectionIcon(section.name);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className="font-medium flex-1">{section.name}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-11">
          <MarkdownRenderer content={section.content} />
        </div>
      )}
    </div>
  );
}

export function ConstitutionViewer({ constitution, className }: ConstitutionViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  if (!constitution) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No constitution defined</p>
        <p className="text-sm mt-2">Run <code className="bg-[var(--secondary)] px-1 rounded">/speckit.constitution</code> to create one</p>
      </div>
    );
  }

  // Check if we have structured content
  const hasStructuredContent = constitution.principles.length > 0 || constitution.sections.length > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      {hasStructuredContent && (
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
      )}

      {/* Content */}
      {showRawMarkdown || !hasStructuredContent ? (
        <MarkdownRenderer content={constitution.rawContent} />
      ) : (
        <div className="space-y-6">
          {/* Header with version info */}
          <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold">{constitution.title || 'Project Constitution'}</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {constitution.version && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Version</span>
                  <code className="bg-[var(--secondary)] px-2 py-0.5 rounded text-xs">
                    {constitution.version}
                  </code>
                </div>
              )}
              {constitution.ratifiedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Ratified</span>
                  <span className="text-[var(--foreground)]">{constitution.ratifiedDate}</span>
                </div>
              )}
              {constitution.lastAmendedDate && constitution.lastAmendedDate !== constitution.ratifiedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Amended</span>
                  <span className="text-[var(--foreground)]">{constitution.lastAmendedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Impact Report */}
          {constitution.syncImpactReport && (
            <SyncImpactReportCard report={constitution.syncImpactReport} />
          )}

          {/* Core Principles */}
          {constitution.principles.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Core Principles ({constitution.principles.length})
              </h2>
              <div className="space-y-3">
                {constitution.principles.map((principle, index) => (
                  <PrincipleCard key={index} principle={principle} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Other Sections (Quality Standards, Development Workflow, Governance, etc.) */}
          {constitution.sections.map((section, sectionIndex) => {
            const Icon = getSectionIcon(section.name);
            const hasSubsections = section.subsections && section.subsections.length > 0;

            return (
              <div key={sectionIndex}>
                <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {section.name} {hasSubsections && `(${section.subsections.length})`}
                </h2>
                {hasSubsections ? (
                  <div className="space-y-3">
                    {section.subsections.map((subsection, subIndex) => (
                      <SubsectionCard key={subIndex} subsection={subsection} index={subIndex} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                    <MarkdownRenderer content={section.content} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
