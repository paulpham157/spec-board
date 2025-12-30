'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import type { Feature } from '@/types';
import { cn } from '@/lib/utils';
import { useFocusTrap, announce } from '@/lib/accessibility';
import { HeaderBar } from './header-bar';
import { NavSidebar } from './nav-sidebar';
import { SplitView } from './split-view';
import {
  type SectionId,
  type SectionConfig,
  type SplitViewState,
  getSectionStatus,
  PHASE_CONFIG,
} from './types';

interface FeatureDetailProps {
  feature: Feature;
  onClose: () => void;
}

// Build section configurations from feature
function buildSectionConfigs(feature: Feature): SectionConfig[] {
  // Helper to check if additional file exists
  const hasAdditionalFile = (type: string) => {
    return feature.additionalFiles?.some(f => f.type === type && f.exists) ?? false;
  };

  // Get checklist files
  const checklistFiles = feature.additionalFiles?.filter(f => f.type === 'checklist') ?? [];

  return [
    // OVERVIEW phase
    {
      id: 'overview' as SectionId,
      label: 'Overview',
      phase: 'overview' as const,
      show: true,
      status: 'none',
    },
    {
      id: 'spec' as SectionId,
      label: 'Spec',
      phase: 'overview' as const,
      show: true,
      status: getSectionStatus('spec', feature),
      filePath: feature.path ? `${feature.path}/spec.md` : undefined,
    },
    // PLANNING phase
    {
      id: 'plan' as SectionId,
      label: 'Plan',
      phase: 'planning' as const,
      show: true,
      status: getSectionStatus('plan', feature),
      filePath: feature.path ? `${feature.path}/plan.md` : undefined,
    },
    {
      id: 'research' as SectionId,
      label: 'Research',
      phase: 'planning' as const,
      show: hasAdditionalFile('research'),
      status: 'none',
    },
    {
      id: 'data-model' as SectionId,
      label: 'Data Model',
      phase: 'planning' as const,
      show: hasAdditionalFile('data-model'),
      status: 'none',
    },
    // CODING phase
    {
      id: 'tasks' as SectionId,
      label: 'Tasks',
      phase: 'coding' as const,
      show: true,
      status: getSectionStatus('tasks', feature),
      taskCount: { completed: feature.completedTasks, total: feature.totalTasks },
      groupCount: feature.taskGroups.length > 0
        ? { count: feature.taskGroups.length, label: 'US' }
        : undefined,
      filePath: feature.path ? `${feature.path}/tasks.md` : undefined,
    },
    // QA phase
    {
      id: 'analysis' as SectionId,
      label: 'Analysis',
      phase: 'qa' as const,
      show: true,
      status: 'none',
    },
    // QC phase
    {
      id: 'checklists' as SectionId,
      label: 'Checklists',
      phase: 'qc' as const,
      show: checklistFiles.length > 0,
      status: 'none',
      taskCount: feature.hasChecklists
        ? { completed: feature.completedChecklistItems, total: feature.totalChecklistItems }
        : undefined,
      groupCount: checklistFiles.length > 0
        ? { count: checklistFiles.length, label: checklistFiles.length === 1 ? 'checklist' : 'checklists' }
        : undefined,
    },
  ];
}

export function FeatureDetail({ feature, onClose }: FeatureDetailProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [selectedNavIndex, setSelectedNavIndex] = useState(0);
  const [draggedSection, setDraggedSection] = useState<SectionId | null>(null);
  const [dropSide, setDropSide] = useState<'left' | 'right' | null>(null);
  const [splitView, setSplitView] = useState<SplitViewState>({
    isActive: false,
    leftPane: 'overview',
    rightPane: null,
    splitRatio: 0.5,
    focusedPane: 'left',
  });

  // Build section configs - memoized to prevent recalculation on every render
  const sections = useMemo(() => buildSectionConfigs(feature), [feature]);
  const visibleSections = useMemo(() => sections.filter(s => s.show), [sections]);

  // Focus trap for modal
  useFocusTrap(modalRef, true);

  // Handle section click
  const handleSectionClick = useCallback((sectionId: SectionId) => {
    if (splitView.isActive && splitView.focusedPane === 'right') {
      // If split view is active and right pane is focused, update right pane
      setSplitView(prev => ({ ...prev, rightPane: sectionId }));
    } else {
      // Otherwise update left pane / active section
      setActiveSection(sectionId);
      setSplitView(prev => ({ ...prev, leftPane: sectionId }));
    }
    // Update selected nav index to match clicked section
    const clickedIndex = visibleSections.findIndex(s => s.id === sectionId);
    if (clickedIndex >= 0) {
      setSelectedNavIndex(clickedIndex);
    }
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      announce(`Opened ${section.label}`);
    }
  }, [splitView.isActive, splitView.focusedPane, sections, visibleSections]);

  // Handle drag start
  const handleDragStart = useCallback((sectionId: SectionId) => {
    setDraggedSection(sectionId);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedSection(null);
  }, []);

  // Handle drop on content area
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const sectionId = e.dataTransfer.getData('text/plain') as SectionId;
    if (!sectionId) {
      setDraggedSection(null);
      setDropSide(null);
      return;
    }

    // Determine which side the user dropped on
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const isLeftSide = dropX < rect.width / 2;

    if (splitView.isActive) {
      // Split view is already active - replace the appropriate pane only
      if (isLeftSide) {
        // Replace left pane, keep right pane as is
        setSplitView(prev => ({
          ...prev,
          leftPane: sectionId,
          focusedPane: 'left',
        }));
      } else {
        // Keep left pane as is, replace right pane
        setSplitView(prev => ({
          ...prev,
          rightPane: sectionId,
          focusedPane: 'right',
        }));
      }
    } else {
      // Split view not active - activate it
      if (sectionId === activeSection) {
        setDraggedSection(null);
        setDropSide(null);
        return;
      }

      if (isLeftSide) {
        // Dropped on left side: dragged section goes left, current goes right
        setSplitView(prev => ({
          ...prev,
          isActive: true,
          leftPane: sectionId,
          rightPane: activeSection,
          focusedPane: 'left',
        }));
      } else {
        // Dropped on right side: current stays left, dragged goes right
        setSplitView(prev => ({
          ...prev,
          isActive: true,
          leftPane: activeSection,
          rightPane: sectionId,
          focusedPane: 'right',
        }));
      }
    }

    const section = sections.find(s => s.id === sectionId);
    announce(`Opened ${section?.label ?? sectionId} in split view`);
    setDraggedSection(null);
    setDropSide(null);
  }, [activeSection, splitView.isActive, sections]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    // Track which side the user is hovering over
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const isLeftSide = dropX < rect.width / 2;
    setDropSide(isLeftSide ? 'left' : 'right');
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDropSide(null);
  }, []);

  // Toggle split view
  const handleToggleSplit = useCallback(() => {
    if (splitView.isActive) {
      // Close split view
      setSplitView(prev => ({
        ...prev,
        isActive: false,
        rightPane: null,
      }));
      announce('Closed split view');
    } else {
      // Open split view with a default second section
      const otherSection = visibleSections.find(s => s.id !== activeSection);
      if (otherSection) {
        setSplitView(prev => ({
          ...prev,
          isActive: true,
          leftPane: activeSection,
          rightPane: otherSection.id,
        }));
        announce(`Opened split view with ${otherSection.label}`);
      }
    }
  }, [splitView.isActive, activeSection, visibleSections]);

  // Handle split ratio change
  const handleRatioChange = useCallback((ratio: number) => {
    setSplitView(prev => ({ ...prev, splitRatio: ratio }));
  }, []);

  // Handle close right pane
  const handleCloseRight = useCallback(() => {
    setSplitView(prev => ({
      ...prev,
      isActive: false,
      rightPane: null,
      focusedPane: 'left',
    }));
    announce('Closed split view');
  }, []);

  // Handle focus change
  const handleFocusChange = useCallback((pane: 'left' | 'right') => {
    setSplitView(prev => ({ ...prev, focusedPane: pane }));
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      if (splitView.isActive) {
        handleCloseRight();
      } else {
        announce('Closing feature details');
        onClose();
      }
      return;
    }

    // Ctrl+\ to toggle split
    if (e.key === '\\' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleToggleSplit();
      return;
    }

    // Tab to switch focus between panes
    if (e.key === 'Tab' && splitView.isActive && !e.shiftKey) {
      e.preventDefault();
      const newPane = splitView.focusedPane === 'left' ? 'right' : 'left';
      handleFocusChange(newPane);
      announce(`Focused ${newPane} pane`);
      return;
    }

    // Number keys 1-9 to switch sections
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      const targetSection = visibleSections[num - 1];
      if (targetSection) {
        e.preventDefault();
        if (e.shiftKey && splitView.isActive) {
          // Shift+number opens in right pane
          setSplitView(prev => ({ ...prev, rightPane: targetSection.id }));
        } else if (e.shiftKey && !splitView.isActive) {
          // Shift+number opens split view
          setSplitView(prev => ({
            ...prev,
            isActive: true,
            leftPane: activeSection,
            rightPane: targetSection.id,
          }));
        } else {
          handleSectionClick(targetSection.id);
        }
        setSelectedNavIndex(num - 1);
      }
    }

    // Arrow keys for nav navigation
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = selectedNavIndex;
      let newIndex: number;

      if (e.key === 'ArrowUp') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : visibleSections.length - 1;
      } else {
        newIndex = currentIndex < visibleSections.length - 1 ? currentIndex + 1 : 0;
      }

      setSelectedNavIndex(newIndex);
      const newSection = visibleSections[newIndex];
      if (newSection) {
        announce(`Selected ${newSection.label}`);
      }
    }

    // Enter to open selected section
    if (e.key === 'Enter') {
      const selectedSection = visibleSections[selectedNavIndex];
      if (selectedSection) {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Enter opens in split view
          if (!splitView.isActive) {
            setSplitView(prev => ({
              ...prev,
              isActive: true,
              leftPane: activeSection,
              rightPane: selectedSection.id,
            }));
          } else {
            setSplitView(prev => ({ ...prev, rightPane: selectedSection.id }));
          }
        } else {
          handleSectionClick(selectedSection.id);
        }
      }
    }
  }, [
    splitView,
    activeSection,
    selectedNavIndex,
    visibleSections,
    handleSectionClick,
    handleToggleSplit,
    handleCloseRight,
    handleFocusChange,
    onClose,
  ]);

  // Sync activeSection with splitView.leftPane
  useEffect(() => {
    if (!splitView.isActive) {
      setSplitView(prev => ({ ...prev, leftPane: activeSection }));
    }
  }, [activeSection, splitView.isActive]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed inset-0 bg-[var(--background)] flex flex-col focus-ring',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        tabIndex={-1}
      >
        {/* Header */}
        <HeaderBar
          featureName={feature.name}
          featureId={feature.id}
          onClose={onClose}
          onToggleSplit={handleToggleSplit}
          isSplitActive={splitView.isActive}
        />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          <NavSidebar
            feature={feature}
            sections={sections}
            activeSection={splitView.isActive ? splitView.leftPane : activeSection}
            rightPaneSection={splitView.isActive ? splitView.rightPane : null}
            selectedIndex={selectedNavIndex}
            onSectionClick={handleSectionClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />

          {/* Content area with optional split */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'flex-1 flex flex-col overflow-hidden relative',
              draggedSection && 'ring-2 ring-blue-500/50 ring-inset'
            )}
          >
            {draggedSection && (
              <div className="absolute inset-0 flex pointer-events-none z-10">
                {/* Left drop zone indicator */}
                <div className={cn(
                  'flex-1 flex items-center justify-center border-r border-dashed border-blue-500/50 transition-colors',
                  dropSide === 'left' && 'bg-blue-500/20'
                )}>
                  <div className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    dropSide === 'left'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/10 text-blue-400 border border-dashed border-blue-500'
                  )}>
                    Drop here for left
                  </div>
                </div>
                {/* Right drop zone indicator */}
                <div className={cn(
                  'flex-1 flex items-center justify-center transition-colors',
                  dropSide === 'right' && 'bg-blue-500/20'
                )}>
                  <div className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    dropSide === 'right'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/10 text-blue-400 border border-dashed border-blue-500'
                  )}>
                    Drop here for right
                  </div>
                </div>
              </div>
            )}
            <SplitView
              leftSection={splitView.isActive ? splitView.leftPane : activeSection}
              rightSection={splitView.isActive ? splitView.rightPane : null}
              feature={feature}
              splitRatio={splitView.splitRatio}
              onRatioChange={handleRatioChange}
              onCloseRight={handleCloseRight}
              focusedPane={splitView.focusedPane}
              onFocusChange={handleFocusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
