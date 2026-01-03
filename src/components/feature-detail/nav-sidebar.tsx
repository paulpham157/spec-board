'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  MessageSquare,
  Map as MapIcon,
  ClipboardList,
  ListTodo,
  Search,
  Rocket,
  Copy,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/tooltip';
import type { Feature } from '@/types';
import type {
  SectionId,
  NavWorkflowPhase,
  WorkflowNavStep,
  WorkflowSubItem,
} from './types';
import { NAV_PHASE_CONFIG, getNextTask } from './types';

interface NavSidebarProps {
  feature: Feature;
  hasConstitution: boolean;
  activeSection: SectionId;
  activeChecklistIndex?: number;  // Track which specific checklist is selected
  onSectionClick: (sectionId: SectionId, options?: { checklistIndex?: number; userStoryId?: string; showRawMarkdown?: boolean }) => void;
  onDragStart: (sectionId: SectionId) => void;
  onDragEnd: () => void;
}

// Build workflow steps from feature data
function buildWorkflowSteps(feature: Feature, hasConstitution: boolean): WorkflowNavStep[] {
  const allTasksComplete = feature.totalTasks > 0 && feature.completedTasks === feature.totalTasks;

  // Determine current step
  let currentStep = '';
  if (!hasConstitution) currentStep = 'constitution';
  else if (!feature.hasSpec) currentStep = 'specify';
  else if (!feature.hasPlan) currentStep = 'plan';
  else if (!feature.hasTasks) currentStep = 'tasks';
  else if (!allTasksComplete) currentStep = 'implement';
  else if (!feature.analysis) currentStep = 'analyze';

  // Build clarification count
  const clarificationCount = feature.clarificationSessions?.reduce(
    (sum, s) => sum + s.clarifications.length, 0
  ) ?? 0;

  // Get checklist files
  const checklistFiles = feature.additionalFiles?.filter(f => f.type === 'checklist') ?? [];

  // Get additional files
  const hasResearch = feature.additionalFiles?.some(f => f.type === 'research' && f.exists) ?? false;
  const hasDataModel = feature.additionalFiles?.some(f => f.type === 'data-model' && f.exists) ?? false;
  const hasQuickstart = feature.additionalFiles?.some(f => f.type === 'quickstart' && f.exists) ?? false;

  // Get next task for suggested action
  const nextTask = getNextTask(feature);

  // Derive project path from feature path (feature.path is like /path/to/project/specs/feature-name)
  // Go up two directories to get project path
  const projectPath = feature.path.split('/').slice(0, -2).join('/');
  const constitutionPath = `${projectPath}/.specify/memory/constitution.md`;

  return [
    // OVERVIEW phase
    {
      id: 'constitution',
      command: '/speckit.constitution',
      label: 'Constitution',
      description: 'Establish project principles',
      isOptional: false,
      isComplete: hasConstitution,
      isCurrent: currentStep === 'constitution',
      phase: 'overview' as NavWorkflowPhase,
      subItems: hasConstitution ? [
        { id: 'constitution-file', label: 'constitution.md', type: 'file' as const, sectionId: 'constitution' as SectionId, filePath: constitutionPath },
      ] : [],
    },
    {
      id: 'specify',
      command: '/speckit.specify',
      label: 'Specify',
      description: 'Create baseline specification',
      isOptional: false,
      isComplete: feature.hasSpec,
      isCurrent: currentStep === 'specify',
      phase: 'overview' as NavWorkflowPhase,
      subItems: feature.hasSpec ? [
        { id: 'spec-file', label: 'spec.md', type: 'file' as const, sectionId: 'spec' as SectionId, filePath: `${feature.path}/spec.md` },
      ] : [],
    },
    {
      id: 'clarify',
      command: '/speckit.clarify',
      label: 'Clarify',
      description: 'Ask structured questions to de-risk ambiguous areas before planning',
      isOptional: true,
      isComplete: clarificationCount > 0,
      isCurrent: currentStep === 'clarify',
      phase: 'overview' as NavWorkflowPhase,
      subItems: clarificationCount > 0 ? [
        { id: 'clarify-history', label: `${clarificationCount} Q&A`, type: 'clarification' as const, sectionId: 'clarifications' as SectionId },
      ] : [],
    },
    // PLANNING phase
    {
      id: 'plan',
      command: '/speckit.plan',
      label: 'Plan',
      description: 'Create implementation plan',
      isOptional: false,
      isComplete: feature.hasPlan,
      isCurrent: currentStep === 'plan',
      phase: 'planning' as NavWorkflowPhase,
      subItems: [
        ...(feature.hasPlan ? [{ id: 'plan-file', label: 'plan.md', type: 'file' as const, sectionId: 'plan' as SectionId, filePath: `${feature.path}/plan.md` }] : []),
        ...(hasResearch ? [{ id: 'research-file', label: 'research.md', type: 'file' as const, sectionId: 'research' as SectionId }] : []),
        ...(hasDataModel ? [{ id: 'data-model-file', label: 'data-model.md', type: 'file' as const, sectionId: 'data-model' as SectionId }] : []),
        ...(hasQuickstart ? [{ id: 'quickstart-file', label: 'quickstart.md', type: 'file' as const, sectionId: 'quickstart' as SectionId }] : []),
      ],
    },
    // QUALITY CONTROL phase
    {
      id: 'checklist',
      command: '/speckit.checklist',
      label: 'Checklist',
      description: 'Generate quality checklists to validate requirements completeness',
      isOptional: true,
      isComplete: feature.hasChecklists,
      isCurrent: currentStep === 'checklist',
      phase: 'qc' as NavWorkflowPhase,
      subItems: checklistFiles.map((file, index) => {
        // Use actual filename (e.g., "requirements.md")
        const fileName = file.path.split('/').pop() || `checklist-${index + 1}.md`;

        return {
          id: `checklist-${index}`,
          label: fileName,
          type: 'checklist' as const,
          sectionId: 'checklists' as SectionId,
          checklistIndex: index, // Track which checklist this is
          // Use per-file progress instead of aggregate
          progress: file.checklistProgress ? {
            completed: file.checklistProgress.completed,
            total: file.checklistProgress.total,
          } : undefined,
        };
      }),
    },
    // WORK BREAKDOWN phase
    {
      id: 'tasks',
      command: '/speckit.tasks',
      label: 'Tasks',
      description: 'Generate actionable tasks',
      isOptional: false,
      isComplete: feature.hasTasks && allTasksComplete,
      isCurrent: currentStep === 'tasks',
      phase: 'wbs' as NavWorkflowPhase,
      subItems: [
        // Only show tasks.md file item if tasks exist
        ...(feature.hasTasks ? [{
          id: 'tasks-file',
          label: 'tasks.md',
          type: 'file' as const,
          sectionId: 'tasks' as SectionId,
          filePath: `${feature.path}/tasks.md`,
          progress: { completed: feature.completedTasks, total: feature.totalTasks },
        }] : []),
      ],
    },
    // QUALITY ASSURANCE phase
    {
      id: 'analyze',
      command: '/speckit.analyze',
      label: 'Analyze',
      description: 'Cross-artifact consistency & alignment report',
      isOptional: true,
      isComplete: !!feature.analysis,
      isCurrent: currentStep === 'analyze',
      phase: 'qa' as NavWorkflowPhase,
      subItems: [
        // Always show save analysis action before analysis results
        {
          id: 'save-analysis',
          label: 'Save Analysis Report',
          type: 'action' as const,
          command: `Save the analysis report above to SpecBoard format:\n\n  1. Create directory: specs/${feature.id}/analysis/\n  2. Save the markdown report to: specs/${feature.id}/analysis/YYYY-MM-DD-HH-ii-analysis.md\n\nExtract data from the Coverage Summary Table and Metrics section above.`,
          tooltipContent: 'Currently, Spec-kit does not save analysis results to any files. I recommend using this prompt after /speckit.analyze to save your results for analysis purposes. Click to copy!',
        },
        ...(feature.analysis?.reports?.[0] ? [
          { id: 'analysis-results', label: feature.analysis.reports[0].filename, type: 'file' as const, sectionId: 'analysis' as SectionId, filePath: feature.analysis.reports[0].path },
        ] : []),
      ],
    },
    // CODING phase
    {
      id: 'implement',
      command: '/speckit.implement',
      label: 'Implement',
      description: 'Execute implementation',
      isOptional: false,
      isComplete: allTasksComplete,
      isCurrent: currentStep === 'implement',
      phase: 'coding' as NavWorkflowPhase,
      progress: feature.totalTasks > 0 ? { completed: feature.completedTasks, total: feature.totalTasks } : undefined,
      subItems: [
        ...(nextTask && !allTasksComplete ? [{
          id: 'next-action',
          label: `Suggest Next Action\n${nextTask.id} ${nextTask.description}`,
          type: 'action' as const,
          command: `/speckit.implement ${feature.id} ${nextTask.id}`,
        }] : []),
      ],
    },
  ];
}

// Get icon for workflow step
function getStepIcon(stepId: string): React.ReactNode {
  const iconClass = 'w-4 h-4';
  switch (stepId) {
    case 'constitution': return <Sparkles className={iconClass} />;
    case 'specify': return <FileCode className={iconClass} />;
    case 'clarify': return <MessageSquare className={iconClass} />;
    case 'plan': return <MapIcon className={iconClass} />;
    case 'checklist': return <ClipboardList className={iconClass} />;
    case 'tasks': return <ListTodo className={iconClass} />;
    case 'analyze': return <Search className={iconClass} />;
    case 'implement': return <Rocket className={iconClass} />;
    default: return <FileText className={iconClass} />;
  }
}

// Sub-item component
interface SubItemProps {
  item: WorkflowSubItem;
  isActive: boolean;  // Currently selected file
  onSectionClick: (sectionId: SectionId, options?: { checklistIndex?: number; userStoryId?: string; showRawMarkdown?: boolean }) => void;
  onDragStart?: (sectionId: SectionId) => void;
  onDragEnd?: () => void;
}

function WorkflowSubItemComponent({ item, isActive, onSectionClick, onDragStart, onDragEnd }: SubItemProps) {
  const [copied, setCopied] = useState(false);

  // Determine if this item is draggable (file or checklist items with sectionId)
  const isDraggable = (item.type === 'file' || item.type === 'checklist') && !!item.sectionId;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!item.sectionId) return;
    // Include checklistIndex in drag data for checklist items
    const dragData = item.checklistIndex !== undefined
      ? `${item.sectionId}:${item.checklistIndex}`
      : item.sectionId;
    e.dataTransfer.setData('text/plain', dragData);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(item.sectionId);
  }, [item.sectionId, item.checklistIndex, onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  const handleClick = useCallback(async () => {
    if (item.type === 'action' && item.command) {
      // Copy command to clipboard
      try {
        await navigator.clipboard.writeText(item.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = item.command;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Failed to copy:', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    } else if (item.sectionId) {
      // Pass checklistIndex for checklist items, userStoryId for user story items
      // Pass showRawMarkdown for file items (like tasks.md)
      onSectionClick(item.sectionId, {
        checklistIndex: item.checklistIndex,
        userStoryId: item.userStoryId,
        showRawMarkdown: item.type === 'file',
      });
    }
  }, [item, onSectionClick]);

  // For action items with multi-line labels (e.g., "Next Action\nT001 Description")
  const isMultiLineAction = item.type === 'action' && item.label.includes('\n');
  const [actionTitle, actionDetail] = isMultiLineAction
    ? item.label.split('\n')
    : [item.label, null];

  // Check if this is a special "save analysis" action
  const isSaveAnalysis = item.id === 'save-analysis';

  const content = (
    <button
      onClick={handleClick}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      className={cn(
        'w-full flex items-start gap-2 pl-8 pr-3 py-1.5 text-xs rounded transition-colors',
        isActive
          ? 'bg-[var(--color-active-bg)]'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50',
        item.type === 'action' && !isActive && !isSaveAnalysis && 'hover:opacity-80',
        // Special shiny styling for save analysis button
        isSaveAnalysis && !isActive && 'bg-[var(--color-current-bg)] border border-[var(--color-current)]/40',
        // Draggable cursor for file items
        isDraggable && 'cursor-grab active:cursor-grabbing'
      )}
      style={{
        color: isActive
          ? 'var(--color-active)'
          : item.type === 'action' && !isSaveAnalysis
            ? 'var(--color-current)'
            : isSaveAnalysis
              ? 'var(--color-current)'
              : undefined
      }}
    >
      {isMultiLineAction ? (
        <div className="flex-1 text-left">
          <div className="font-semibold">{actionTitle}</div>
          <div className="text-[10px] opacity-80 line-clamp-2">{actionDetail}</div>
        </div>
      ) : (
        <span className="flex-1 text-left truncate">{item.label}</span>
      )}
      {item.progress && (
        <span className={cn(
          'text-[10px] font-mono',
          item.progress.completed === item.progress.total
            ? 'text-[var(--color-success)]'
            : 'text-[var(--muted-foreground)]'
        )}>
          {item.progress.completed}/{item.progress.total}
        </span>
      )}
      {item.type === 'action' && (
        <Copy className={cn('w-3 h-3 flex-shrink-0 mt-0.5', copied && 'text-[var(--color-success)]')} />
      )}
    </button>
  );

  if (item.type === 'action' && item.command) {
    // Use custom tooltipContent if provided, otherwise show command
    const tooltipText = copied ? 'Copied!' : (item.tooltipContent || item.command);
    // Use maxWidth for text wrapping when there's custom tooltip content
    const tooltipMaxWidth = item.tooltipContent ? 280 : undefined;
    return (
      <Tooltip content={tooltipText} side="right" maxWidth={tooltipMaxWidth}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

// Workflow step component (expandable)
interface WorkflowNavItemProps {
  step: WorkflowNavStep;
  isExpanded: boolean;
  isActive: boolean;  // Currently viewed section
  activeSection: SectionId;  // For sub-item highlighting
  activeChecklistIndex?: number;  // For checklist sub-item highlighting
  onToggle: () => void;
  onSectionClick: (sectionId: SectionId, options?: { checklistIndex?: number; userStoryId?: string; showRawMarkdown?: boolean }) => void;
  onDragStart?: (sectionId: SectionId) => void;
  onDragEnd?: () => void;
}

function WorkflowNavItem({ step, isExpanded, isActive, activeSection, activeChecklistIndex, onToggle, onSectionClick, onDragStart, onDragEnd }: WorkflowNavItemProps) {
  const hasSubItems = step.subItems.length > 0;

  return (
    <div className="mb-0.5">
      {/* Step header */}
      <Tooltip content={step.description} side="right" delay={300}>
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-sm',
            isActive && 'bg-[var(--color-active-bg)] ring-1 ring-[var(--color-active)]/30',
            step.isCurrent && !isActive && 'bg-[var(--color-current-bg)] ring-1 ring-[var(--color-current)]/30',
            !step.isCurrent && !isActive && 'hover:bg-[var(--secondary)]/50'
          )}
        >
          {/* Expand/collapse chevron */}
          <span className={cn(
            'w-4 h-4 flex items-center justify-center flex-shrink-0 transition-opacity',
            hasSubItems ? 'opacity-100' : 'opacity-0'
          )}>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
            )}
          </span>

          {/* Semantic icon - always show icon, color based on state */}
          <div className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
            isActive
              ? 'bg-[var(--color-active)] text-white'
              : step.isCurrent
                ? 'bg-[var(--color-current)] text-white'
                : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
          )}>
            {getStepIcon(step.id)}
          </div>

          {/* Command label */}
          <span
            className="flex-1 text-left font-mono text-xs truncate"
            style={{
              color: isActive
                ? 'var(--color-active)'
                : step.isCurrent
                  ? 'var(--color-current)'
                  : 'var(--muted-foreground)'
            }}
          >
            {step.command}
            {step.progress && (
              <span className="ml-2 font-mono text-[var(--muted-foreground)]">
                ({Math.round((step.progress.completed / step.progress.total) * 100)}%)
              </span>
            )}
          </span>

          {/* Optional badge */}
          {step.isOptional && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--color-active-bg)] text-[var(--color-active)]">
              opt
            </span>
          )}

          {/* Current step badge */}
          {step.isCurrent && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--color-current)] text-white font-bold">
              NEXT
            </span>
          )}
        </button>
      </Tooltip>

      {/* Sub-items (when expanded) */}
      {isExpanded && hasSubItems && (
        <div className="mt-0.5">
          {step.subItems.map((item) => {
            // For checklist items, check both sectionId AND checklistIndex
            const isItemActive = item.sectionId === activeSection &&
              (item.type !== 'checklist' || item.checklistIndex === activeChecklistIndex);

            return (
              <WorkflowSubItemComponent
                key={item.id}
                item={item}
                isActive={isItemActive}
                onSectionClick={onSectionClick}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Group steps by phase
function groupStepsByPhase(steps: WorkflowNavStep[]): Map<NavWorkflowPhase, WorkflowNavStep[]> {
  const grouped = new Map<NavWorkflowPhase, WorkflowNavStep[]>();
  const phaseOrder: NavWorkflowPhase[] = ['overview', 'planning', 'qc', 'wbs', 'qa', 'coding'];

  for (const phase of phaseOrder) {
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

// Main NavSidebar component
export function NavSidebar({
  feature,
  hasConstitution,
  activeSection,
  activeChecklistIndex,
  onSectionClick,
  onDragStart,
  onDragEnd,
}: NavSidebarProps) {
  // Build workflow steps
  const steps = useMemo(() => buildWorkflowSteps(feature, hasConstitution), [feature, hasConstitution]);
  const groupedSteps = useMemo(() => groupStepsByPhase(steps), [steps]);

  const nextTask = getNextTask(feature);

  // Expanded state - default: expand current step, step containing active section, and always expand checklist/tasks
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Always expand checklist and tasks sections
    initial.add('checklist');
    initial.add('tasks');
    for (const step of steps) {
      // Expand if: current step, has incomplete sub-items, or contains the active section
      const containsActiveSection = step.id === activeSection || step.subItems.some(item => item.sectionId === activeSection);
      if (step.isCurrent || containsActiveSection || (!step.isComplete && step.subItems.length > 0)) {
        initial.add(step.id);
      }
    }
    return initial;
  });

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const phaseOrder: NavWorkflowPhase[] = ['overview', 'planning', 'qc', 'wbs', 'qa', 'coding'];

  return (
    <div className="w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Workflow navigation">
        {phaseOrder.map((phase) => {
          const phaseSteps = groupedSteps.get(phase) || [];
          if (phaseSteps.length === 0) return null;

          const config = NAV_PHASE_CONFIG[phase];

          return (
            <div key={phase} className="mb-3">
              {/* Phase header */}
              <div className={cn(
                'text-[10px] font-bold tracking-wider mb-1 px-2',
                config.color
              )}>
                {config.label}
              </div>

              {/* Phase steps */}
              <div>
                {phaseSteps.map((step) => (
                  <WorkflowNavItem
                    key={step.id}
                    step={step}
                    isExpanded={expandedSteps.has(step.id)}
                    isActive={activeSection === step.id || (step.subItems.some(item => item.sectionId === activeSection))}
                    activeSection={activeSection}
                    activeChecklistIndex={activeChecklistIndex}
                    onToggle={() => toggleStep(step.id)}
                    onSectionClick={onSectionClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
