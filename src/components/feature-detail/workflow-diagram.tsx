'use client';

import { useState } from 'react';
import { Check, Sparkles, FileText, MessageSquare, Map as MapIcon, ClipboardList, ListTodo, Search, Rocket, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/tooltip';
import type { Feature, ClarificationSession } from '@/types';

// Phase definitions
type WorkflowPhase = 'overview' | 'planning' | 'qc' | 'wbs' | 'qa' | 'coding';

interface PhaseConfig {
  label: string;
  color: string;
}

const PHASE_CONFIG: Record<WorkflowPhase, PhaseConfig> = {
  overview: { label: 'OVERVIEW', color: 'text-blue-400' },
  planning: { label: 'PLANNING', color: 'text-purple-400' },
  qc: { label: 'QUALITY CONTROL', color: 'text-orange-400' },
  wbs: { label: 'WORK BREAKDOWN', color: 'text-cyan-400' },
  qa: { label: 'QUALITY ASSURANCE', color: 'text-yellow-400' },
  coding: { label: 'CODING', color: 'text-green-400' },
};

interface WorkflowStep {
  id: string;
  command: string;
  label: string;
  description: string;
  outputs: string[];
  icon: React.ReactNode;
  isOptional: boolean;
  isComplete: boolean;
  isCurrent: boolean;
  phase: WorkflowPhase;
  // Special data for specific steps
  clarificationSessions?: ClarificationSession[];
  taskProgress?: { completed: number; total: number };
  nextTask?: string;
}

interface WorkflowDiagramProps {
  feature: Feature;
  hasConstitution: boolean;
}

function getWorkflowSteps(feature: Feature, hasConstitution: boolean): WorkflowStep[] {
  const allTasksComplete = feature.totalTasks > 0 && feature.completedTasks === feature.totalTasks;

  let currentStep = '';
  if (!hasConstitution) currentStep = 'constitution';
  else if (!feature.hasSpec) currentStep = 'specify';
  else if (!feature.hasPlan) currentStep = 'plan';
  else if (!feature.hasTasks) currentStep = 'tasks';
  else if (!allTasksComplete) currentStep = 'implement';
  else if (!feature.analysis) currentStep = 'analyze';

  // Find next incomplete task
  const nextTask = feature.tasks.find(t => !t.completed);

  const createStep = (
    id: string,
    command: string,
    label: string,
    description: string,
    outputs: string[],
    icon: React.ReactNode,
    isOptional: boolean,
    isComplete: boolean,
    phase: WorkflowPhase,
    extra?: Partial<WorkflowStep>
  ): WorkflowStep => ({
    id,
    command,
    label,
    description,
    outputs,
    icon,
    isOptional,
    isComplete,
    isCurrent: currentStep === id,
    phase,
    ...extra,
  });

  return [
    // OVERVIEW phase
    createStep('constitution', '/speckit.constitution', 'Constitution', 'Establish project principles', ['constitution.md'], <Sparkles className="w-4 h-4" />, false, hasConstitution, 'overview'),
    createStep('specify', '/speckit.specify', 'Specify', 'Create baseline specification', ['spec.md'], <FileText className="w-4 h-4" />, false, feature.hasSpec, 'overview'),
    createStep('clarify', '/speckit.clarify', 'Clarify', 'De-risk ambiguous areas', [], <MessageSquare className="w-4 h-4" />, true, feature.totalClarifications > 0, 'overview', {
      clarificationSessions: feature.clarificationSessions,
    }),
    // PLANNING phase
    createStep('plan', '/speckit.plan', 'Plan', 'Create implementation plan', ['plan.md', 'research.md', 'data-model.md', 'quickstart.md'], <MapIcon className="w-4 h-4" />, false, feature.hasPlan, 'planning'),
    // QUALITY CONTROL phase
    createStep('checklist', '/speckit.checklist', 'Checklist', 'Validate requirements', ['checklist-*.md'], <ClipboardList className="w-4 h-4" />, true, feature.hasChecklists, 'qc'),
    // WORK BREAKDOWN STRUCTURE phase
    createStep('tasks', '/speckit.tasks', 'Tasks', 'Generate actionable tasks', ['tasks.md'], <ListTodo className="w-4 h-4" />, false, feature.hasTasks, 'wbs'),
    // QUALITY ASSURANCE phase
    createStep('analyze', '/speckit.analyze', 'Analyze', 'Cross-artifact consistency', ['analysis.json', 'analysis.md'], <Search className="w-4 h-4" />, true, !!feature.analysis, 'qa'),
    // CODING phase
    createStep('implement', '/speckit.implement', 'Implement', 'Execute implementation', [], <Rocket className="w-4 h-4" />, false, allTasksComplete, 'coding', {
      taskProgress: { completed: feature.completedTasks, total: feature.totalTasks },
      nextTask: nextTask?.description,
    }),
  ];
}

// File item in hierarchical tree
function FileItem({ file, isComplete }: { file: string; isComplete: boolean }) {
  return (
    <div className="flex items-center gap-2 pl-8 py-0.5">
      <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
      <span className={cn(
        'text-xs font-mono',
        isComplete ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'
      )}>
        {file}
      </span>
    </div>
  );
}

// Clarification session with Q&A history
function ClarificationHistory({ sessions }: { sessions: ClarificationSession[] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="pl-8 py-1 text-xs text-[var(--muted-foreground)] italic">
        No clarifications yet
      </div>
    );
  }

  return (
    <div className="pl-6 space-y-2 mt-1">
      {sessions.map((session, sIdx) => (
        <div key={sIdx} className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-purple-400">
            <Calendar className="w-3 h-3" />
            <span>Session {session.date}</span>
          </div>
          {session.clarifications.map((c, cIdx) => (
            <div key={cIdx} className="pl-5 space-y-0.5">
              <div className="flex items-start gap-2 text-xs">
                <span className="text-blue-400 font-medium flex-shrink-0">Q{cIdx + 1}:</span>
                <span className="text-[var(--muted-foreground)] line-clamp-2">{c.question}</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <span className="text-emerald-400 font-medium flex-shrink-0">A{cIdx + 1}:</span>
                <span className="text-[var(--muted-foreground)] line-clamp-2">{c.answer}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Task progress display for implement step
function TaskProgress({ progress, nextTask }: { progress: { completed: number; total: number }; nextTask?: string }) {
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="pl-6 space-y-2 mt-1">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-mono text-emerald-400">
          {progress.completed}/{progress.total}
        </span>
      </div>
      {nextTask && (
        <div className="flex items-start gap-2 text-xs">
          <span className="text-amber-400 font-medium flex-shrink-0">Next:</span>
          <span className="text-[var(--muted-foreground)] line-clamp-2">{nextTask}</span>
        </div>
      )}
    </div>
  );
}

// Single workflow step item
function WorkflowItem({ step }: { step: WorkflowStep }) {
  const [expanded, setExpanded] = useState(step.isCurrent || step.isComplete);

  const hasExpandableContent = step.outputs.length > 0 ||
    (step.clarificationSessions && step.clarificationSessions.length > 0) ||
    step.taskProgress;

  return (
    <div className="space-y-0.5">
      <Tooltip content={step.description} side="right" delay={200}>
        <button
          onClick={() => hasExpandableContent && setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-all',
            'hover:bg-[var(--secondary)]',
            step.isComplete && 'text-emerald-400',
            step.isCurrent && 'bg-amber-500/15 ring-1 ring-amber-500/40'
          )}
        >
        {/* Expand/collapse indicator */}
        {hasExpandableContent ? (
          <ChevronRight className={cn(
            'w-3 h-3 transition-transform flex-shrink-0',
            expanded && 'rotate-90'
          )} />
        ) : (
          <div className="w-3" />
        )}

        {/* Status indicator */}
        <div className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
          step.isComplete
            ? 'bg-emerald-500 text-white'
            : step.isCurrent
              ? 'bg-amber-500 text-white'
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
        )}>
          {step.isComplete ? <Check className="w-3 h-3" /> : step.icon}
        </div>

        {/* Label */}
        <span className={cn(
          'font-medium flex-1 text-left',
          step.isComplete && 'text-emerald-400',
          step.isCurrent && 'text-amber-400'
        )}>
          {step.label}
        </span>

        {/* Badges */}
        {step.isOptional && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">
            opt
          </span>
        )}
        {step.isCurrent && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500 text-white font-bold">
            NEXT
          </span>
        )}
        </button>
      </Tooltip>

      {/* Expanded content */}
      {expanded && hasExpandableContent && (
        <div className="pb-1">
          {/* File outputs */}
          {step.outputs.length > 0 && step.outputs.map((file, i) => (
            <FileItem key={i} file={file} isComplete={step.isComplete} />
          ))}

          {/* Clarification history */}
          {step.clarificationSessions && (
            <ClarificationHistory sessions={step.clarificationSessions} />
          )}

          {/* Task progress */}
          {step.taskProgress && (
            <TaskProgress progress={step.taskProgress} nextTask={step.nextTask} />
          )}
        </div>
      )}
    </div>
  );
}

// Group steps by phase
function groupStepsByPhase(steps: WorkflowStep[]): Map<WorkflowPhase, WorkflowStep[]> {
  const grouped = new Map<WorkflowPhase, WorkflowStep[]>();

  for (const phase of Object.keys(PHASE_CONFIG) as WorkflowPhase[]) {
    grouped.set(phase, []);
  }

  for (const step of steps) {
    const group = grouped.get(step.phase);
    if (group) {
      group.push(step);
    }
  }

  return grouped;
}

export function WorkflowDiagram({ feature, hasConstitution }: WorkflowDiagramProps) {
  const steps = getWorkflowSteps(feature, hasConstitution);
  const groupedSteps = groupStepsByPhase(steps);

  const requiredSteps = steps.filter(s => !s.isOptional);
  const completedRequired = requiredSteps.filter(s => s.isComplete).length;
  const progressPercent = Math.round((completedRequired / requiredSteps.length) * 100);
  const allComplete = requiredSteps.every(s => s.isComplete);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Spec-Kit Workflow</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Click step to expand details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={cn('text-lg font-bold tabular-nums', allComplete ? 'text-emerald-400' : '')}>
              {progressPercent}%
            </span>
            <p className="text-xs text-[var(--muted-foreground)]">
              {completedRequired}/{requiredSteps.length} steps
            </p>
          </div>
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--secondary)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={allComplete ? '#22c55e' : '#f59e0b'}
                strokeWidth="3"
                strokeDasharray={`${progressPercent} 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Workflow phases */}
      <div className="p-3">
        {allComplete ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Check className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-emerald-400">Workflow Complete!</span>
          </div>
        ) : (
          <div className="space-y-4">
            {(Object.keys(PHASE_CONFIG) as WorkflowPhase[]).map((phase) => {
              const phaseSteps = groupedSteps.get(phase) || [];
              if (phaseSteps.length === 0) return null;

              const config = PHASE_CONFIG[phase];

              return (
                <div key={phase}>
                  {/* Phase header */}
                  <div className={cn('text-[10px] font-bold tracking-wider mb-1 px-2', config.color)}>
                    {config.label}
                  </div>

                  {/* Phase steps */}
                  <div className="space-y-0.5">
                    {phaseSteps.map((step) => (
                      <WorkflowItem
                        key={step.id}
                        step={step}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
