'use client';

import { NavItem } from './nav-item';
import { StatusHeader } from './status-header';
import type { Feature } from '@/types';
import type { SectionConfig, SectionId, WorkflowPhase } from './types';
import { PHASE_CONFIG, getNextTask } from './types';

interface NavSidebarProps {
  feature: Feature;
  sections: SectionConfig[];
  activeSection: SectionId;
  rightPaneSection?: SectionId | null;  // For split view highlighting
  selectedIndex: number;
  onSectionClick: (sectionId: SectionId) => void;
  onDragStart: (sectionId: SectionId) => void;
  onDragEnd: () => void;
}

// Group sections by workflow phase
function groupSectionsByPhase(sections: SectionConfig[]): Map<WorkflowPhase, SectionConfig[]> {
  const grouped = new Map<WorkflowPhase, SectionConfig[]>();

  // Initialize all phases
  for (const phase of Object.keys(PHASE_CONFIG) as WorkflowPhase[]) {
    grouped.set(phase, []);
  }

  // Group visible sections by their phase
  for (const section of sections) {
    if (section.show) {
      const group = grouped.get(section.phase);
      if (group) {
        group.push(section);
      }
    }
  }

  return grouped;
}

export function NavSidebar({
  feature,
  sections,
  activeSection,
  rightPaneSection,
  selectedIndex,
  onSectionClick,
  onDragStart,
  onDragEnd,
}: NavSidebarProps) {
  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  const nextTask = getNextTask(feature);
  const groupedSections = groupSectionsByPhase(sections);

  // Calculate shortcut keys for visible sections
  const visibleSections = sections.filter(s => s.show);
  const getShortcutKey = (sectionId: SectionId): number | undefined => {
    const index = visibleSections.findIndex(s => s.id === sectionId);
    return index >= 0 && index < 9 ? index + 1 : undefined;
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden">
      {/* Status Header */}
      <StatusHeader
        feature={feature}
        progressPercentage={progressPercentage}
        nextTask={nextTask}
      />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Feature sections">
        {(Object.keys(PHASE_CONFIG) as WorkflowPhase[]).map((phase) => {
          const phaseSections = groupedSections.get(phase) || [];
          if (phaseSections.length === 0) return null;

          return (
            <div key={phase} className="mb-4">
              {/* Phase label */}
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-3 mb-2">
                {PHASE_CONFIG[phase].label}
              </div>

              {/* Section items */}
              <div className="space-y-0.5">
                {phaseSections.map((section) => {
                  const visibleIndex = visibleSections.findIndex(s => s.id === section.id);
                  return (
                    <NavItem
                      key={section.id}
                      id={section.id}
                      label={section.label}
                      feature={feature}
                      isActive={activeSection === section.id || rightPaneSection === section.id}
                      isSelected={selectedIndex === visibleIndex}
                      taskCount={section.taskCount}
                      groupCount={section.groupCount}
                      onClick={() => onSectionClick(section.id)}
                      onDragStart={() => onDragStart(section.id)}
                      onDragEnd={onDragEnd}
                      shortcutKey={getShortcutKey(section.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
