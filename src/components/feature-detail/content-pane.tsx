'use client';

import { useState, useMemo } from 'react';
import { X, FileInput, CheckSquare, FolderTree, Info } from 'lucide-react';
import type { Feature, Constitution } from '@/types';
import type { SectionId } from './types';
import { cn } from '@/lib/utils';
import { SpecViewer } from '@/components/spec-viewer';
import { PlanViewer } from '@/components/plan-viewer';
import { ResearchViewer } from '@/components/research-viewer';
import { DataModelViewer } from '@/components/data-model-viewer';
import { QuickstartViewer } from '@/components/quickstart-viewer';
import { ContractsViewer } from '@/components/contracts-viewer';
import { ChecklistViewer } from '@/components/checklist-viewer';
import { AnalysisViewer } from '@/components/analysis-viewer';
import { ConstitutionViewer } from '@/components/constitution-viewer';
import { FeatureClarity } from '@/components/clarity-history';
import { TaskGroupList } from '@/components/task-group';
import { Tooltip } from '@/components/tooltip';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { FileText, CheckCircle2, Circle, Zap } from 'lucide-react';
import type { Task, TaskPhase } from '@/types';

// Parse tasks.md header metadata
interface TasksMetadata {
  title: string | null;
  input: string | null;
  prerequisites: string[];
  tests: string | null;
  organization: string | null;
  formatLegend: { marker: string; description: string }[];
  pathConventions: string | null;
}

function parseTasksMetadata(content: string | null): TasksMetadata {
  const metadata: TasksMetadata = {
    title: null,
    input: null,
    prerequisites: [],
    tests: null,
    organization: null,
    formatLegend: [],
    pathConventions: null,
  };

  if (!content) return metadata;

  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+Tasks:\s*(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract **Input**: value
  const inputMatch = content.match(/\*\*Input\*\*:\s*(.+)/i);
  if (inputMatch) {
    metadata.input = inputMatch[1].trim();
  }

  // Extract **Prerequisites**: value
  const prereqMatch = content.match(/\*\*Prerequisites\*\*:\s*(.+)/i);
  if (prereqMatch) {
    metadata.prerequisites = prereqMatch[1].split(',').map(p => p.trim()).filter(Boolean);
  }

  // Extract **Tests**: value
  const testsMatch = content.match(/\*\*Tests\*\*:\s*(.+)/i);
  if (testsMatch) {
    metadata.tests = testsMatch[1].trim();
  }

  // Extract **Organization**: value
  const orgMatch = content.match(/\*\*Organization\*\*:\s*(.+)/i);
  if (orgMatch) {
    metadata.organization = orgMatch[1].trim();
  }

  // Extract format legend items (- **[X]**: description)
  const formatRegex = /^-\s+\*\*\[([^\]]+)\]\*\*:\s*(.+)$/gm;
  let formatMatch;
  while ((formatMatch = formatRegex.exec(content)) !== null) {
    metadata.formatLegend.push({
      marker: formatMatch[1],
      description: formatMatch[2].trim(),
    });
  }

  // Extract path conventions
  const pathMatch = content.match(/-\s+\*\*Single project\*\*:\s*(.+?)(?:\s*\(|$)/i);
  if (pathMatch) {
    metadata.pathConventions = pathMatch[1].trim();
  }

  return metadata;
}

// Tasks metadata display component
function TasksMetadataSection({ metadata }: { metadata: TasksMetadata }) {
  const hasMetadata = metadata.input || metadata.prerequisites.length > 0 ||
                      metadata.tests || metadata.organization || metadata.formatLegend.length > 0;

  if (!hasMetadata) return null;

  return (
    <div className="space-y-3 mb-6">
      {/* Title */}
      {metadata.title && (
        <h3 className="text-lg font-semibold">{metadata.title}</h3>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Input */}
        {metadata.input && (
          <div className="flex items-start gap-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
            <FileInput className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-info)' }} />
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Input</span>
              <p className="text-sm font-mono">{metadata.input}</p>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {metadata.prerequisites.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
            <CheckSquare className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-success)' }} />
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Prerequisites</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {metadata.prerequisites.map((prereq, idx) => (
                  <span key={idx} className="text-xs bg-[var(--secondary)] px-2 py-0.5 rounded font-mono">
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tests */}
        {metadata.tests && (
          <div className="flex items-start gap-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-success)' }} />
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Tests</span>
              <p className="text-sm">{metadata.tests}</p>
            </div>
          </div>
        )}

        {/* Path Conventions */}
        {metadata.pathConventions && (
          <div className="flex items-start gap-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
            <FolderTree className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-warning)' }} />
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Path</span>
              <p className="text-sm font-mono">{metadata.pathConventions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Organization note */}
      {metadata.organization && (
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-info)' }} />
          <p className="text-sm" style={{ color: 'var(--tag-text-info)' }}>{metadata.organization}</p>
        </div>
      )}

      {/* Format legend */}
      {metadata.formatLegend.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {metadata.formatLegend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {item.marker === 'P' ? (
                <Zap className="w-3 h-3" style={{ color: 'var(--tag-text-info)' }} />
              ) : (
                <span className="font-mono" style={{ color: 'var(--tag-text-purple)' }}>[{item.marker}]</span>
              )}
              <span className="text-[var(--muted-foreground)]">{item.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ContentPaneProps {
  sectionId: SectionId;
  feature: Feature;
  hasConstitution: boolean;
  constitution: Constitution | null;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  selectedChecklistIndex?: number;
}

const SECTION_LABELS: Record<SectionId, string> = {
  constitution: 'Project Constitution',
  spec: 'Specification',
  plan: 'Implementation Plan',
  tasks: 'Tasks',
  research: 'Research',
  'data-model': 'Data Model',
  quickstart: 'Quickstart Guide',
  contracts: 'API Contracts',
  checklists: 'Checklists',
  analysis: 'Analysis',
  clarifications: 'Clarification History',
};

// Task item component
function TaskItem({ task, hideUserStory = false }: { task: Task; hideUserStory?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg transition-colors',
        task.completed ? 'bg-[var(--color-success)]/10' : 'hover:bg-[var(--secondary)]'
      )}
    >
      {task.completed ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-success)' }} />
      ) : (
        <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            {task.id}
          </span>
          {task.parallel && (
            <span
              className="text-xs bg-[var(--color-info)]/20 px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ color: 'var(--tag-text-info)' }}
            >
              <Zap className="w-3 h-3" />
              Parallel
            </span>
          )}
          {!hideUserStory && task.userStory && (
            <span
              className="text-xs bg-purple-500/20 px-1.5 py-0.5 rounded"
              style={{ color: 'var(--tag-text-purple)' }}
            >
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

// Phase progress component - renders content blocks in interleaved order
function PhaseProgress({ phase }: { phase: TaskPhase }) {
  const completed = phase.tasks.filter((t) => t.completed).length;
  const total = phase.tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mb-6">
      {/* Phase header with progress */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{phase.name}</h4>
        {total > 0 && (
          <span className="text-xs text-[var(--muted-foreground)]">
            {completed}/{total} ({percentage}%)
          </span>
        )}
      </div>
      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {/* Content blocks in order - preserves interleaved structure */}
      {phase.contentBlocks && phase.contentBlocks.length > 0 ? (
        <div className="space-y-2">
          {phase.contentBlocks.map((block, index) => {
            if (block.type === 'markdown') {
              return (
                <div key={`md-${index}`} className="pl-3 border-l-2 border-[var(--border)]">
                  <MarkdownRenderer
                    content={block.content}
                    className="text-sm"
                  />
                </div>
              );
            } else {
              return (
                <TaskItem key={block.task.id} task={block.task} hideUserStory={true} />
              );
            }
          })}
        </div>
      ) : (
        /* Fallback to old structure for backwards compatibility */
        <>
          {phase.description && (
            <div className="mb-3 pl-3 border-l-2 border-[var(--border)]">
              <MarkdownRenderer
                content={phase.description}
                className="text-sm"
              />
            </div>
          )}
          {total > 0 && (
            <div className="space-y-1">
              {phase.tasks.map((task) => (
                <TaskItem key={task.id} task={task} hideUserStory={true} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Tasks content with Structured/Markdown toggle
function TasksContent({ feature }: { feature: Feature }) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const hasTaskGroups = feature.taskGroups && feature.taskGroups.length > 0;
  const hasPhases = feature.phases.length > 0;

  // Parse metadata from tasks.md content
  const metadata = useMemo(() => parseTasksMetadata(feature.tasksContent), [feature.tasksContent]);

  if (!hasTaskGroups && !hasPhases && !feature.tasksContent) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
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

      {/* Content */}
      {showRawMarkdown ? (
        <pre className="text-sm font-mono whitespace-pre-wrap bg-[var(--secondary)]/30 p-4 rounded-lg overflow-auto flex-1">
          {feature.tasksContent}
        </pre>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Metadata section */}
          <TasksMetadataSection metadata={metadata} />

          {/* Phases (preferred) or Task groups as fallback */}
          {hasPhases ? (
            <div>
              {feature.phases.map((phase, index) => (
                <PhaseProgress key={index} phase={phase} />
              ))}
            </div>
          ) : hasTaskGroups ? (
            <TaskGroupList groups={feature.taskGroups!} userStories={feature.userStories} />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ContentPane({
  sectionId,
  feature,
  hasConstitution,
  constitution,
  onClose,
  showCloseButton = false,
  className,
  selectedChecklistIndex,
}: ContentPaneProps) {
  const label = SECTION_LABELS[sectionId];

  // Helper to get additional file content
  const getAdditionalFileContent = (type: string) => {
    return feature.additionalFiles?.find(f => f.type === type)?.content ?? null;
  };

  // Get contract and checklist files
  const contractFiles = feature.additionalFiles?.filter(f => f.type === 'contract') ?? [];
  const allChecklistFiles = feature.additionalFiles?.filter(f => f.type === 'checklist') ?? [];

  // Filter checklists based on selectedChecklistIndex
  const checklistFiles = selectedChecklistIndex !== undefined
    ? allChecklistFiles.filter((_, index) => index === selectedChecklistIndex)
    : allChecklistFiles;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Pane header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--secondary)]/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
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
        {sectionId === 'constitution' && (
          <ConstitutionViewer constitution={constitution} />
        )}
        {sectionId === 'spec' && (
          <SpecViewer content={feature.specContent} />
        )}
        {sectionId === 'plan' && (
          <PlanViewer content={feature.planContent} />
        )}
        {sectionId === 'tasks' && <TasksContent feature={feature} />}
        {sectionId === 'research' && (
          <ResearchViewer
            content={getAdditionalFileContent('research')}
          />
        )}
        {sectionId === 'data-model' && (
          <DataModelViewer
            content={getAdditionalFileContent('data-model')}
          />
        )}
        {sectionId === 'quickstart' && (
          <QuickstartViewer
            content={getAdditionalFileContent('quickstart')}
          />
        )}
        {sectionId === 'contracts' && <ContractsViewer contracts={contractFiles} />}
        {sectionId === 'checklists' && <ChecklistViewer checklists={checklistFiles} />}
        {sectionId === 'analysis' && (
          <AnalysisViewer
            analysis={feature.analysis ?? { reports: [], markdownContent: null, markdownPath: null }}
            featurePath={feature.path}
          />
        )}
        {sectionId === 'clarifications' && (
          <FeatureClarity
            sessions={feature.clarificationSessions ?? []}
            totalClarifications={feature.totalClarifications}
          />
        )}
      </div>
    </div>
  );
}
