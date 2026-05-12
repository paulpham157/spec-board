'use client';

import type { Feature, FeatureStage } from '@/types';
import { cn } from '@/lib/utils';
import { FileText, ClipboardList, ListTodo, CheckCircle2, Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateFeatureModal } from './create-feature-modal';
import { PriorityDot } from './priority-label';

const STAGE_CONFIG: Record<FeatureStage, { label: string; icon: typeof FileText; color: string }> = {
  backlog: { label: 'Backlog', icon: FileText, color: 'var(--status-not-started)' },
  specs: { label: 'Specs', icon: ClipboardList, color: 'var(--status-in-progress)' },
  plan: { label: 'Plan', icon: ListTodo, color: 'var(--status-in-progress)' },
  tasks: { label: 'Tasks', icon: CheckCircle2, color: 'var(--status-complete)' },
};

interface FeatureListProps {
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
  projectId?: string;
  onRefresh: () => void;
}

export function FeatureList({ features, onFeatureClick, projectId, onRefresh }: FeatureListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const taskProgress = (f: Feature) => {
    if (f.totalTasks === 0) return null;
    return Math.round((f.completedTasks / f.totalTasks) * 100);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--muted-foreground)]">
          {features.length} feature{features.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add feature
        </button>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)] text-sm">
          No features yet. Click "Add feature" to get started.
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
          {features.map((feature) => {
            const stage = STAGE_CONFIG[feature.stage] || STAGE_CONFIG.backlog;
            const progress = taskProgress(feature);

            return (
              <button
                key={feature.id}
                onClick={() => onFeatureClick(feature)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--secondary)] transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                  title={stage.label}
                />

                <span className="flex-1 text-sm text-[var(--foreground)] truncate flex items-center gap-2">
                  {feature.name}
                  <PriorityDot priority={feature.priority} size="xs" />
                </span>

                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full shrink-0",
                  "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                )}>
                  {stage.label}
                </span>

                {progress !== null && (
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-10 text-right">
                    {progress}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {projectId && (
        <CreateFeatureModal
          isOpen={showCreateModal}
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onFeatureCreated={() => { setShowCreateModal(false); onRefresh(); }}
        />
      )}
    </div>
  );
}
