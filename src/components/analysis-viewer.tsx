'use client';

import { useState } from 'react';
import { ExternalLink, Check, AlertCircle, CircleDashed, TrendingUp, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn, openInEditor } from '@/lib/utils';
import type { FeatureAnalysis, AnalysisItem } from '@/types';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function ScoreGauge({ score, size = 'md' }: ScoreGaugeProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-400';
    if (score >= 60) return 'text-yellow-400 border-yellow-400';
    if (score >= 40) return 'text-orange-400 border-orange-400';
    return 'text-red-400 border-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-400/10';
    if (score >= 60) return 'bg-yellow-400/10';
    if (score >= 40) return 'bg-orange-400/10';
    return 'bg-red-400/10';
  };

  return (
    <div
      className={cn(
        'rounded-full border-4 flex items-center justify-center font-bold',
        sizeClasses[size],
        getScoreColor(score),
        getScoreBg(score)
      )}
    >
      {score}%
    </div>
  );
}

interface RequirementItemProps {
  item: AnalysisItem;
}

function RequirementItem({ item }: RequirementItemProps) {
  const statusConfig = {
    implemented: {
      icon: Check,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      label: 'Implemented',
    },
    partial: {
      icon: CircleDashed,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      label: 'Partial',
    },
    missing: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      label: 'Missing',
    },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg', config.bg)}>
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{item.requirement}</p>
        {item.evidence && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono truncate">
            {item.evidence}
          </p>
        )}
      </div>
      <span className={cn('text-xs px-2 py-0.5 rounded', config.bg, config.color)}>
        {config.label}
      </span>
    </div>
  );
}

interface AnalysisViewerProps {
  analysis: FeatureAnalysis;
  className?: string;
}

export function AnalysisViewer({ analysis, className }: AnalysisViewerProps) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);

  const handleOpenInEditor = (path: string | null) => {
    if (!path) return;
    const result = openInEditor(path);
    setFeedback({ message: result.message, success: result.success });
    setTimeout(() => setFeedback(null), 3000);
  };

  // No analysis data available - show documentation
  if (!analysis.jsonData && !analysis.markdownContent) {
    return (
      <div className={cn('flex flex-col py-6', className)}>
        <div className="flex flex-col items-center mb-6 text-zinc-500">
          <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No analysis yet</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-[var(--secondary)]/30 rounded-lg">
            <h4 className="font-medium mb-2">Expected Files</h4>
            <p className="text-[var(--muted-foreground)] mb-2">SpecBoard expects analysis files at:</p>
            <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 font-mono text-xs">
              <li>specs/&lt;feature&gt;/analysis/analysis.json</li>
              <li>specs/&lt;feature&gt;/analysis/analysis.md</li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--secondary)]/30 rounded-lg">
            <h4 className="font-medium mb-2">JSON Schema</h4>
            <pre className="text-xs font-mono bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300">
{`{
  "version": "1.0",
  "timestamp": "2025-01-01T00:00:00Z",
  "specAlignment": {
    "score": 85,
    "totalRequirements": 10,
    "implemented": 7,
    "partial": 2,
    "missing": 1,
    "items": [
      {
        "requirement": "User can login",
        "status": "implemented",
        "evidence": "src/auth/login.ts"
      }
    ]
  }
}`}
            </pre>
          </div>

          <div className="p-4 bg-[var(--secondary)]/30 rounded-lg">
            <h4 className="font-medium mb-2">How It Works</h4>
            <p className="text-[var(--muted-foreground)]">
              SpecBoard is a viewer only. The <code className="bg-zinc-800 px-1.5 py-0.5 rounded">/speckit.analyze</code> command
              (from SoupSpec or another spec-kit tool) must output files matching this format.
            </p>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-400">Note</h4>
            <p className="text-[var(--muted-foreground)]">
              The current spec-kit version does not generate analysis files yet. This feature is ready for when spec-kit adds <code className="bg-zinc-800 px-1.5 py-0.5 rounded">/speckit.analyze</code> support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { jsonData, markdownContent, jsonPath, markdownPath } = analysis;
  const specAlignment = jsonData?.specAlignment;

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Feedback toast */}
      {feedback && (
        <div className={cn(
          'fixed top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg z-50',
          feedback.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        )}>
          {feedback.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Score Overview */}
      {specAlignment && (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[var(--secondary)]/30 rounded-lg">
          <ScoreGauge score={specAlignment.score} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold mb-2">Spec Alignment Score</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span>{specAlignment.implemented} Implemented</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span>{specAlignment.partial} Partial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span>{specAlignment.missing} Missing</span>
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              {specAlignment.totalRequirements} total requirements analyzed
              {jsonData?.timestamp && (
                <> &bull; Last updated: {new Date(jsonData.timestamp).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Requirements Breakdown */}
      {specAlignment && specAlignment.items.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Requirements Breakdown</h4>
          <div className="space-y-2">
            {specAlignment.items.map((item, index) => (
              <RequirementItem key={index} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Markdown Summary (collapsible) */}
      {markdownContent && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowMarkdown(!showMarkdown)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowMarkdown(!showMarkdown);
              }
            }}
            className="w-full flex items-center gap-3 p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors cursor-pointer"
          >
            {showMarkdown ? (
              <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-sm flex-1 text-left">Analysis Summary</span>
            {markdownPath && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenInEditor(markdownPath);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </button>
            )}
          </div>
          {showMarkdown && (
            <div className="p-4 border-t border-[var(--border)]">
              <MarkdownRenderer content={markdownContent} />
            </div>
          )}
        </div>
      )}

      {/* Open JSON in editor */}
      {jsonPath && (
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenInEditor(jsonPath)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open analysis.json
          </button>
        </div>
      )}
    </div>
  );
}
