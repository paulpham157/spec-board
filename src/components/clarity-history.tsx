'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ClarificationSession, Feature } from '@/types';
import {
  MessageCircleQuestion,
  ChevronDown,
  ChevronRight,
  Calendar,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface ClarityHistoryPanelProps {
  features: Feature[];
  totalClarifications: number;
}

export function ClarityHistoryPanel({ features, totalClarifications }: ClarityHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Filter features that have clarifications
  const featuresWithClarifications = features.filter(f => f.totalClarifications > 0);

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

  if (totalClarifications === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <MessageCircleQuestion className="w-5 h-5" />
          <span className="text-sm">No clarifications recorded yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <MessageCircleQuestion className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Clarity History</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {totalClarifications} clarification{totalClarifications !== 1 ? 's' : ''} across{' '}
              {featuresWithClarifications.length} feature{featuresWithClarifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
            {totalClarifications} Q&A
          </span>
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
          {featuresWithClarifications.map((feature) => (
            <div key={feature.id} className="border-b border-[var(--border)] last:border-b-0">
              {/* Feature Header */}
              <button
                onClick={() => toggleFeature(feature.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedFeatures.has(feature.id) ? (
                    <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                  )}
                  <span className="font-medium text-sm capitalize">{feature.name}</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {feature.totalClarifications} clarification{feature.totalClarifications !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Feature Sessions */}
              {expandedFeatures.has(feature.id) && (
                <div className="pl-6 pr-3 pb-3">
                  {feature.clarificationSessions.map((session, sessionIndex) => {
                    const sessionKey = `${feature.id}-${session.date}`;
                    return (
                      <div
                        key={sessionKey}
                        className="mt-2 rounded-lg border border-[var(--border)] overflow-hidden"
                      >
                        {/* Session Header */}
                        <button
                          onClick={() => toggleSession(sessionKey)}
                          className="w-full flex items-center justify-between p-2 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)] transition-colors"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[var(--muted-foreground)]">
                              Session {session.date}
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

                        {/* Session Q&A */}
                        {expandedSessions.has(sessionKey) && (
                          <div className="p-2 space-y-2">
                            {session.clarifications.map((qa, qaIndex) => (
                              <div
                                key={qaIndex}
                                className="rounded-lg bg-[var(--secondary)]/20 p-2 text-sm"
                              >
                                <div className="flex items-start gap-2">
                                  <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-[var(--muted-foreground)]">{qa.question}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 mt-2 pl-6">
                                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-[var(--foreground)]">{qa.answer}</p>
                                  </div>
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
      )}
    </div>
  );
}

/**
 * Compact version for feature detail modal
 */
interface FeatureClarityProps {
  sessions: ClarificationSession[];
  totalClarifications: number;
}

export function FeatureClarity({ sessions, totalClarifications }: FeatureClarityProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set([0])); // First session expanded by default

  const toggleSession = (index: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSessions(newExpanded);
  };

  if (totalClarifications === 0) {
    return (
      <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
        <MessageCircleQuestion className="w-4 h-4" />
        <span>No clarifications for this feature</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageCircleQuestion className="w-4 h-4 text-blue-400" />
        <span>Clarifications ({totalClarifications})</span>
      </div>

      {sessions.map((session, index) => (
        <div
          key={session.date}
          className="rounded-lg border border-[var(--border)] overflow-hidden"
        >
          <button
            onClick={() => toggleSession(index)}
            className="w-full flex items-center justify-between p-2 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)] transition-colors"
          >
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{session.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)]">
                {session.clarifications.length} Q&A
              </span>
              {expandedSessions.has(index) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {expandedSessions.has(index) && (
            <div className="p-2 space-y-2">
              {session.clarifications.map((qa, qaIndex) => (
                <div
                  key={qaIndex}
                  className="text-sm border-l-2 border-blue-400/30 pl-3"
                >
                  <p className="text-[var(--muted-foreground)]">
                    <span className="text-blue-400 font-medium">Q:</span> {qa.question}
                  </p>
                  <p className="mt-1">
                    <span className="text-green-400 font-medium">A:</span> {qa.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
