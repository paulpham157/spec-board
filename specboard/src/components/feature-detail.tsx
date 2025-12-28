'use client';

import { useState } from 'react';
import { X, CheckCircle2, Circle, FileText, ExternalLink, Zap } from 'lucide-react';
import type { Feature, Task, TaskPhase } from '@/types';
import { cn, getStageColor, getStageLabel } from '@/lib/utils';
import { FeatureClarity } from '@/components/clarity-history';
import { SpecViewer } from '@/components/spec-viewer';
import { PlanViewer } from '@/components/plan-viewer';
import { PriorityBadge } from '@/components/priority-badge';
import { TaskGroupList } from '@/components/task-group';
import { ResearchViewer } from '@/components/research-viewer';
import { DataModelViewer } from '@/components/data-model-viewer';
import { QuickstartViewer } from '@/components/quickstart-viewer';
import { ContractsViewer } from '@/components/contracts-viewer';

type TabId = 'overview' | 'spec' | 'plan' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contracts';

type TabStatus = 'complete' | 'in-progress' | 'pending' | 'none';

// Stage order for determining progress
const STAGE_ORDER = ['specify', 'plan', 'tasks', 'implement', 'complete'];

function getStageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage);
}

// Determine tab status based on feature stage and file existence
function getTabStatus(tabId: TabId, feature: Feature): TabStatus {
  const currentStageIndex = getStageIndex(feature.stage);

  if (tabId === 'spec') {
    if (feature.hasSpec && currentStageIndex > 0) return 'complete';
    if (feature.stage === 'specify') return 'in-progress';
    if (!feature.hasSpec) return 'pending';
    return 'none';
  }

  if (tabId === 'plan') {
    if (feature.hasPlan && currentStageIndex > 1) return 'complete';
    if (feature.stage === 'plan') return 'in-progress';
    if (!feature.hasPlan) return 'pending';
    return 'none';
  }

  if (tabId === 'tasks') {
    if (feature.hasTasks && currentStageIndex > 2) return 'complete';
    if (feature.stage === 'tasks') return 'in-progress';
    if (!feature.hasTasks) return 'pending';
    return 'none';
  }

  return 'none';
}

// Status indicator component
function TabStatusIcon({ status }: { status: TabStatus }) {
  if (status === 'complete') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
  }
  if (status === 'in-progress') {
    return (
      <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
    );
  }
  if (status === 'pending') {
    return <Circle className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />;
  }
  return null;
}

interface TaskItemProps {
  task: Task;
}

function TaskItem({ task }: TaskItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg transition-colors',
        task.completed ? 'bg-green-500/10' : 'hover:bg-[var(--secondary)]'
      )}
    >
      {task.completed ? (
        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            {task.id}
          </span>
          {task.parallel && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Parallel
            </span>
          )}
          {task.userStory && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
              {task.userStory}
            </span>
          )}
        </div>
        <p className={cn(
          'text-sm mt-1',
          task.completed && 'text-[var(--muted-foreground)] line-through'
        )}>
          {task.description}
        </p>
        {task.filePath && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
            {task.filePath}
          </p>
        )}
      </div>
    </div>
  );
}

interface PhaseProgressProps {
  phase: TaskPhase;
}

function PhaseProgress({ phase }: PhaseProgressProps) {
  const completed = phase.tasks.filter((t) => t.completed).length;
  const total = phase.tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{phase.name}</h4>
        <span className="text-xs text-[var(--muted-foreground)]">
          {completed}/{total} ({percentage}%)
        </span>
      </div>
      <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="space-y-1">
        {phase.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

interface FeatureDetailProps {
  feature: Feature;
  onClose: () => void;
}

// Overview Tab Component
function OverviewTab({
  feature,
  progressPercentage,
}: {
  feature: Feature;
  progressPercentage: number;
}) {
  return (
    <>
      {/* User Stories Summary */}
      {feature.userStories.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">User Stories</h3>
          <div className="space-y-2">
            {feature.userStories.map((story) => (
              <div key={story.id} className="flex items-center gap-2 p-2 bg-[var(--secondary)]/50 rounded">
                <PriorityBadge priority={story.priority} />
                <span className="text-xs text-[var(--muted-foreground)]">{story.id}</span>
                <span className="text-sm">{story.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall progress */}
      {feature.totalTasks > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Overall Progress</h3>
            <span className="text-sm">
              {feature.completedTasks}/{feature.totalTasks} tasks ({progressPercentage}%)
            </span>
          </div>
          <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Clarifications */}
      {feature.totalClarifications > 0 && (
        <div className="mb-6 p-3 bg-[var(--secondary)]/30 rounded-lg">
          <FeatureClarity
            sessions={feature.clarificationSessions}
            totalClarifications={feature.totalClarifications}
          />
        </div>
      )}
    </>
  );
}

// Plan Tab Component
function PlanTab({ feature }: { feature: Feature }) {
  const planFilePath = feature.path ? `${feature.path}/plan.md` : undefined;

  return (
    <PlanViewer content={feature.planContent} filePath={planFilePath} />
  );
}

// Tasks Tab Component
function TasksTab({ feature }: { feature: Feature }) {
  // Check if we have task groups (new format) or phases (old format)
  const hasTaskGroups = feature.taskGroups && feature.taskGroups.length > 0;
  const hasPhases = feature.phases.length > 0;

  if (!hasTaskGroups && !hasPhases) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No tasks defined yet</p>
        <p className="text-sm mt-1">
          Run <code className="bg-[var(--secondary)] px-1 rounded">/speckit.tasks</code> to generate tasks
        </p>
      </div>
    );
  }

  // Prefer task groups (grouped by user story) if available
  if (hasTaskGroups) {
    return (
      <div>
        <h3 className="font-medium mb-4">Tasks by User Story</h3>
        <TaskGroupList groups={feature.taskGroups!} userStories={feature.userStories} />
      </div>
    );
  }

  // Fallback to phases (old format)
  return (
    <div>
      <h3 className="font-medium mb-4">Task Phases</h3>
      {feature.phases.map((phase, index) => (
        <PhaseProgress key={index} phase={phase} />
      ))}
    </div>
  );
}

export function FeatureDetail({ feature, onClose }: FeatureDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  // Get highest priority from user stories
  const highestPriority = feature.userStories.length > 0
    ? feature.userStories.reduce((highest, story) => {
        const priorityOrder = { P1: 1, P2: 2, P3: 3 };
        return priorityOrder[story.priority] < priorityOrder[highest] ? story.priority : highest;
      }, feature.userStories[0].priority)
    : null;

  // Build spec file path
  const specFilePath = feature.path ? `${feature.path}/spec.md` : undefined;

  // Helper to check if additional file exists
  const hasAdditionalFile = (type: string) => {
    return feature.additionalFiles?.some(f => f.type === type && f.exists) ?? false;
  };

  // Helper to get additional file content
  const getAdditionalFileContent = (type: string) => {
    return feature.additionalFiles?.find(f => f.type === type)?.content ?? null;
  };

  // Helper to get additional file path
  const getAdditionalFilePath = (type: string) => {
    return feature.additionalFiles?.find(f => f.type === type)?.path;
  };

  // Get contract files
  const contractFiles = feature.additionalFiles?.filter(f => f.type === 'contract') ?? [];

  const tabs: { id: TabId; label: string; show: boolean; status: TabStatus }[] = [
    { id: 'overview', label: 'Overview', show: true, status: 'none' },
    { id: 'spec', label: 'Spec', show: true, status: getTabStatus('spec', feature) },
    { id: 'plan', label: 'Plan', show: true, status: getTabStatus('plan', feature) },
    { id: 'tasks', label: 'Tasks', show: true, status: getTabStatus('tasks', feature) },
    { id: 'research', label: 'Research', show: hasAdditionalFile('research'), status: 'none' },
    { id: 'data-model', label: 'Data Model', show: hasAdditionalFile('data-model'), status: 'none' },
    { id: 'quickstart', label: 'Quickstart', show: hasAdditionalFile('quickstart'), status: 'none' },
    { id: 'contracts', label: 'Contracts', show: contractFiles.length > 0, status: 'none' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded border',
                getStageColor(feature.stage)
              )}>
                {getStageLabel(feature.stage)}
              </span>
              {highestPriority && (
                <PriorityBadge priority={highestPriority} />
              )}
              <span className="text-xs text-[var(--muted-foreground)]">
                {feature.id}
              </span>
            </div>
            <h2 className="text-lg font-semibold capitalize">{feature.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)]">
          {tabs.filter(t => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              <TabStatusIcon status={tab.status} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && (
            <OverviewTab
              feature={feature}
              progressPercentage={progressPercentage}
            />
          )}
          {activeTab === 'spec' && (
            <SpecViewer content={feature.specContent} filePath={specFilePath} />
          )}
          {activeTab === 'plan' && (
            <PlanTab feature={feature} />
          )}
          {activeTab === 'tasks' && (
            <TasksTab feature={feature} />
          )}
          {activeTab === 'research' && (
            <ResearchViewer
              content={getAdditionalFileContent('research')}
              filePath={getAdditionalFilePath('research')}
            />
          )}
          {activeTab === 'data-model' && (
            <DataModelViewer
              content={getAdditionalFileContent('data-model')}
              filePath={getAdditionalFilePath('data-model')}
            />
          )}
          {activeTab === 'quickstart' && (
            <QuickstartViewer
              content={getAdditionalFileContent('quickstart')}
              filePath={getAdditionalFilePath('quickstart')}
            />
          )}
          {activeTab === 'contracts' && (
            <ContractsViewer contracts={contractFiles} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <a
            href={`file://${feature.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in file explorer
          </a>
        </div>
      </div>
    </div>
  );
}
