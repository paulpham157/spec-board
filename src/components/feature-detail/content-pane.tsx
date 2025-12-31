'use client';

import { X, ExternalLink } from 'lucide-react';
import type { Feature } from '@/types';
import type { SectionId } from './types';
import { cn, openInEditor } from '@/lib/utils';
import { SpecViewer } from '@/components/spec-viewer';
import { PlanViewer } from '@/components/plan-viewer';
import { ResearchViewer } from '@/components/research-viewer';
import { DataModelViewer } from '@/components/data-model-viewer';
import { QuickstartViewer } from '@/components/quickstart-viewer';
import { ContractsViewer } from '@/components/contracts-viewer';
import { ChecklistViewer } from '@/components/checklist-viewer';
import { AnalysisViewer } from '@/components/analysis-viewer';
import { TaskGroupList } from '@/components/task-group';
import { Tooltip } from '@/components/tooltip';
import { WorkflowDiagram } from './workflow-diagram';
import { FileText, CheckCircle2, Circle, Zap } from 'lucide-react';
import type { Task, TaskPhase } from '@/types';

interface ContentPaneProps {
  sectionId: SectionId;
  feature: Feature;
  hasConstitution: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

// Section label mapping
const SECTION_LABELS: Record<SectionId, string> = {
  overview: 'Overview',
  spec: 'Specification',
  plan: 'Implementation Plan',
  tasks: 'Tasks',
  research: 'Research',
  'data-model': 'Data Model',
  quickstart: 'Quickstart Guide',
  contracts: 'API Contracts',
  checklists: 'Checklists',
  analysis: 'Analysis',
};

// Get file path for a section
function getSectionFilePath(sectionId: SectionId, feature: Feature): string | undefined {
  if (!feature.path) return undefined;

  switch (sectionId) {
    case 'spec':
      return `${feature.path}/spec.md`;
    case 'plan':
      return `${feature.path}/plan.md`;
    case 'tasks':
      return `${feature.path}/tasks.md`;
    case 'research':
      return feature.additionalFiles?.find(f => f.type === 'research')?.path;
    case 'data-model':
      return feature.additionalFiles?.find(f => f.type === 'data-model')?.path;
    case 'quickstart':
      return feature.additionalFiles?.find(f => f.type === 'quickstart')?.path;
    default:
      return undefined;
  }
}

// Task item component (reused from old implementation)
function TaskItem({ task }: { task: Task }) {
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

// Phase progress component
function PhaseProgress({ phase }: { phase: TaskPhase }) {
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

// Overview content with charts
function OverviewContent({ feature, hasConstitution }: { feature: Feature; hasConstitution: boolean }) {
  return (
    <div className="space-y-6">
      {/* Spec-Kit Workflow Diagram */}
      <WorkflowDiagram feature={feature} hasConstitution={hasConstitution} />
    </div>
  );
}

// Tasks content
function TasksContent({ feature }: { feature: Feature }) {
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

  if (hasTaskGroups) {
    return (
      <div>
        <h3 className="font-medium mb-4">Tasks by User Story</h3>
        <TaskGroupList groups={feature.taskGroups!} userStories={feature.userStories} />
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-medium mb-4">Task Phases</h3>
      {feature.phases.map((phase, index) => (
        <PhaseProgress key={index} phase={phase} />
      ))}
    </div>
  );
}

export function ContentPane({
  sectionId,
  feature,
  hasConstitution,
  onClose,
  showCloseButton = false,
  className,
}: ContentPaneProps) {
  const filePath = getSectionFilePath(sectionId, feature);
  const label = SECTION_LABELS[sectionId];

  // Helper to get additional file content
  const getAdditionalFileContent = (type: string) => {
    return feature.additionalFiles?.find(f => f.type === type)?.content ?? null;
  };

  // Get contract and checklist files
  const contractFiles = feature.additionalFiles?.filter(f => f.type === 'contract') ?? [];
  const checklistFiles = feature.additionalFiles?.filter(f => f.type === 'checklist') ?? [];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Pane header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--secondary)]/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {filePath && (
            <span className="text-xs text-[var(--muted-foreground)] font-mono truncate max-w-[200px]">
              {filePath.split('/').pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {filePath && (
            <Tooltip content="Open in editor [Ctrl+E]">
              <button
                onClick={() => openInEditor(filePath)}
                className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors"
                aria-label="Open in editor"
              >
                <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </Tooltip>
          )}
          {showCloseButton && onClose && (
            <Tooltip content="Close pane">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors"
                aria-label="Close pane"
              >
                <X className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Pane content */}
      <div className="flex-1 overflow-auto p-4">
        {sectionId === 'overview' && <OverviewContent feature={feature} hasConstitution={hasConstitution} />}
        {sectionId === 'spec' && (
          <SpecViewer content={feature.specContent} filePath={filePath} />
        )}
        {sectionId === 'plan' && (
          <PlanViewer content={feature.planContent} filePath={filePath} />
        )}
        {sectionId === 'tasks' && <TasksContent feature={feature} />}
        {sectionId === 'research' && (
          <ResearchViewer
            content={getAdditionalFileContent('research')}
            filePath={filePath}
          />
        )}
        {sectionId === 'data-model' && (
          <DataModelViewer
            content={getAdditionalFileContent('data-model')}
            filePath={filePath}
          />
        )}
        {sectionId === 'quickstart' && (
          <QuickstartViewer
            content={getAdditionalFileContent('quickstart')}
            filePath={filePath}
          />
        )}
        {sectionId === 'contracts' && <ContractsViewer contracts={contractFiles} />}
        {sectionId === 'checklists' && <ChecklistViewer checklists={checklistFiles} />}
        {sectionId === 'analysis' && (
          <AnalysisViewer
            analysis={feature.analysis ?? { jsonData: null, markdownContent: null, jsonPath: null, markdownPath: null }}
          />
        )}
      </div>
    </div>
  );
}
