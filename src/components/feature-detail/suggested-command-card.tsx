'use client';

import { useState } from 'react';
import { Lightbulb, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestedCommand, CommandSuggestion } from '@/lib/utils';

interface SuggestedCommandCardProps {
  suggestion: CommandSuggestion;
}

function CommandCard({
  command,
  isOptional = false,
  isCollapsed = false,
}: {
  command: SuggestedCommand;
  isOptional?: boolean;
  isCollapsed?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span className="font-mono">{command.command}</span>
        <span className="text-[10px] uppercase tracking-wide opacity-60">Optional</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg p-3',
      isOptional
        ? 'bg-[var(--secondary)]/50 border border-dashed border-[var(--border)]'
        : 'bg-amber-500/10 border border-amber-500/20'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isOptional && (
            <Lightbulb className="w-4 h-4 text-amber-400" />
          )}
          <span className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            isOptional ? 'text-[var(--muted-foreground)]' : 'text-amber-400'
          )}>
            {isOptional ? 'Optional' : 'Suggested Command'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--muted-foreground)]'
          )}
          aria-label={copied ? 'Copied!' : 'Copy command'}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Command */}
      <div className={cn(
        'font-mono text-sm font-medium mb-2',
        isOptional ? 'text-[var(--foreground)]' : 'text-amber-300'
      )}>
        {command.command}
      </div>

      {/* Title */}
      <div className="text-sm font-medium mb-1">
        {command.title}
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
        {command.description}
      </p>
    </div>
  );
}

export function SuggestedCommandCard({ suggestion }: SuggestedCommandCardProps) {
  const [showOptional, setShowOptional] = useState(false);

  // No suggestions - feature is complete
  if (!suggestion.primary && !suggestion.optional) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">
            Feature Complete!
          </span>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          All workflow steps have been completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Primary command */}
      {suggestion.primary && (
        <CommandCard command={suggestion.primary} />
      )}

      {/* Optional command toggle */}
      {suggestion.optional && (
        <div>
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-full"
          >
            {showOptional ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>{showOptional ? 'Hide' : 'Show'} optional step</span>
          </button>

          {showOptional && (
            <div className="mt-2">
              <CommandCard command={suggestion.optional} isOptional />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
