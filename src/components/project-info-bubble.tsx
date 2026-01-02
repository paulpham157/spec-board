'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Constitution, Feature } from '@/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import {
  ScrollText,
  MessageCircleQuestion,
  ChevronDown,
  ChevronRight,
  Shield,
  Calendar,
  Tag,
  FileText,
  X,
  GitBranch,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface ProjectInfoBubbleProps {
  constitution: Constitution | null;
  hasConstitution: boolean;
  features: Feature[];
  totalClarifications: number;
  onFeatureClick?: (feature: Feature) => void;
}

export function ProjectInfoBubble({
  constitution,
  hasConstitution,
  features,
  totalClarifications,
  onFeatureClick,
}: ProjectInfoBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'constitution' | 'clarity'>('constitution');
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const principleCount = constitution?.principles.length ?? 0;
  const featuresWithClarifications = features.filter(f => f.totalClarifications > 0);

  // Build summary text
  const summaryParts: string[] = [];
  if (hasConstitution && principleCount > 0) {
    summaryParts.push(`${principleCount} principles`);
  }
  if (totalClarifications > 0) {
    summaryParts.push(`${totalClarifications} Q&A`);
  }

  const hasSomething = hasConstitution || totalClarifications > 0;

  if (!hasSomething) {
    return null;
  }

  return (
    <div className="relative" ref={popupRef}>
      {/* Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-[var(--secondary)] border border-[var(--border)]',
          'hover:bg-[var(--secondary)]/80 transition-colors',
          'text-sm text-[var(--foreground)]',
          isOpen && 'ring-2 ring-[var(--foreground)]/20'
        )}
      >
        <div className="flex items-center gap-1.5">
          {hasConstitution && <ScrollText className="w-4 h-4" />}
          {totalClarifications > 0 && <MessageCircleQuestion className="w-4 h-4" />}
        </div>
        <span className="text-[var(--muted-foreground)]">
          {summaryParts.join(' • ')}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-[var(--muted-foreground)] transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Popup */}
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-2 z-50',
          'w-[500px] max-h-[70vh] overflow-hidden',
          'rounded-lg border border-[var(--border)] bg-[var(--card)]',
          'shadow-lg'
        )}>
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {hasConstitution && (
              <button
                onClick={() => setActiveTab('constitution')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === 'constitution'
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                )}
              >
                <ScrollText className="w-4 h-4" />
                Constitution
                {constitution?.version && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--secondary)]">
                    v{constitution.version}
                  </span>
                )}
              </button>
            )}
            {totalClarifications > 0 && (
              <button
                onClick={() => setActiveTab('clarity')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === 'clarity'
                    ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                )}
              >
                <MessageCircleQuestion className="w-4 h-4" />
                Clarity History
                <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--secondary)]">
                  {totalClarifications}
                </span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(70vh-50px)]">
            {activeTab === 'constitution' && hasConstitution && constitution && (
              <ConstitutionContent constitution={constitution} />
            )}
            {activeTab === 'clarity' && totalClarifications > 0 && (
              <ClarityContent
                features={featuresWithClarifications}
                onFeatureClick={onFeatureClick}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Constitution content component
function ConstitutionContent({ constitution }: { constitution: Constitution }) {
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

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
    <div className="p-4 space-y-4">
      {/* Metadata */}
      {(constitution.ratifiedDate || constitution.lastAmendedDate) && (
        <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
          {constitution.ratifiedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ratified: {constitution.ratifiedDate}</span>
            </div>
          )}
          {constitution.lastAmendedDate && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Last Amended: {constitution.lastAmendedDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Principles */}
      {constitution.principles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
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
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
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
  );
}

// Clarity content component
function ClarityContent({
  features,
  onFeatureClick,
}: {
  features: Feature[];
  onFeatureClick?: (feature: Feature) => void;
}) {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleFeature = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  const toggleSession = (sessionKey: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionKey)) {
      newExpanded.delete(sessionKey);
    } else {
      newExpanded.add(sessionKey);
    }
    setExpandedSessions(newExpanded);
  };

  return (
    <div className="divide-y divide-[var(--border)]">
      {features.map((feature) => (
        <div key={feature.id}>
          {/* Feature Header */}
          <div className="flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors">
            <button
              onClick={() => toggleFeature(feature.id)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              {expandedFeatures.has(feature.id) ? (
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
              )}
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-sm capitalize truncate">
                  {feature.name}
                </span>
                {feature.branch && (
                  <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <GitBranch className="w-3 h-3" />
                    <span className="truncate">{feature.branch}</span>
                  </span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--muted-foreground)]">
                {feature.totalClarifications} Q&A
              </span>
              <button
                onClick={() => onFeatureClick?.(feature)}
                className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors"
                title="Open feature details"
              >
                <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>

          {/* Feature Sessions */}
          {expandedFeatures.has(feature.id) && (
            <div className="pl-6 pr-3 pb-3">
              {feature.clarificationSessions.map((session) => {
                const sessionKey = `${feature.id}-${session.date}`;
                return (
                  <div
                    key={sessionKey}
                    className="mt-2 rounded-lg border border-[var(--border)] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSession(sessionKey)}
                      className="w-full flex items-center justify-between p-2 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)] transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        <span className="text-[var(--muted-foreground)]">
                          {session.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {session.clarifications.length} Q&A
                        </span>
                        {expandedSessions.has(sessionKey) ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                    </button>

                    {expandedSessions.has(sessionKey) && (
                      <div className="p-2 space-y-2">
                        {session.clarifications.map((qa, qaIndex) => (
                          <div
                            key={qaIndex}
                            className="rounded-lg bg-[var(--secondary)]/20 p-2 text-sm"
                          >
                            <div className="flex items-start gap-2">
                              <HelpCircle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                              <p className="text-[var(--muted-foreground)]">{qa.question}</p>
                            </div>
                            <div className="flex items-start gap-2 mt-2 pl-6">
                              <CheckCircle2 className="w-4 h-4 text-[var(--foreground)] mt-0.5 flex-shrink-0" />
                              <p className="text-[var(--foreground)]">{qa.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
