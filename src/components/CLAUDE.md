# Components Directory

## Purpose
React UI components for the SpecBoard dashboard.

## Overview
This directory contains all React components used throughout the application. Most components follow a flat structure, with the exception of `feature-detail/` which contains the redesigned Feature Detail Modal. All components use Tailwind CSS with CSS variables for styling and are client-side (`'use client'`) for interactivity.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `feature-detail/` | Full-screen modal with split-view for feature details (see `feature-detail/CLAUDE.md`) |

## Key Files

| File | Purpose |
|------|---------|
| `kanban-board.tsx` | 3-column Kanban board (Backlog, In Progress, Done, Review) |
| `recent-projects-list.tsx` | Recent projects with full context (stats, time, completion %) |
| `open-project-modal.tsx` | Project search modal with path autocomplete |
| `project-selector.tsx` | Legacy filesystem browser (deprecated) |
| `task-group.tsx` | Task list grouped by user story |
| `markdown-renderer.tsx` | Safe markdown-to-HTML rendering |
| `spec-viewer.tsx` | Spec.md content with user stories and clarifications |
| `analysis-viewer.tsx` | Analysis results with spec alignment |
| `checklist-viewer.tsx` | Checklist items display |
| `tooltip.tsx` | Reusable tooltip component |

## Component Inventory

### Home Page Components
| Component | Props | Purpose |
|-----------|-------|---------|
| `RecentProjectsList` | projects, onSelect, onRemove | Display recent projects with metadata |
| `OpenProjectModal` | isOpen, onClose, onOpen | Modal for searching/opening projects |

### Layout & Navigation
| Component | Props | Purpose |
|-----------|-------|---------|
| `KanbanBoard` | features, onFeatureClick | Main feature pipeline view |
| `ProjectSelector` | onSelect, recentProjects | Legacy filesystem browser (deprecated) |

### Feature Display
| Component | Props | Purpose |
|-----------|-------|---------|
| `FeatureDetail` (in `feature-detail/`) | feature, onClose | Full-screen modal with split-view |
| `SpecViewer` | content | Render spec.md content with user stories |
| `PlanViewer` | content | Render plan.md content |
| `TaskGroup` | taskGroup, projectPath | Tasks grouped by user story |
| `AnalysisViewer` | analysis | Spec alignment and analysis results |
| `ChecklistViewer` | checklists | Checklist items with completion status |

### Metrics & Info
| Component | Props | Purpose |
|-----------|-------|---------|
| `ConstitutionPanel` | constitution, hasConstitution | Project principles display |
| `ClarityHistoryPanel` | features, totalClarifications | Q&A history timeline |

### Content Viewers
| Component | Props | Purpose |
|-----------|-------|---------|
| `MarkdownRenderer` | content | Safe HTML from markdown |
| `ResearchViewer` | content | Research notes display |
| `QuickstartViewer` | content | Quickstart guide display |
| `DataModelViewer` | content | Data model documentation |
| `ContractsViewer` | contracts | API contracts display |
| `AnalysisViewer` | analysis | Spec alignment analysis |
| `ChecklistViewer` | checklists | Checklist items display |

### Utilities
| Component | Props | Purpose |
|-----------|-------|---------|
| `PriorityBadge` | priority | P1/P2/P3 colored badge |
| `Tooltip` | content, children | Hover tooltip wrapper |

## Patterns & Conventions

- **Styling**: Tailwind CSS with `cn()` utility for conditional classes
- **CSS Variables**: Use `var(--foreground)`, `var(--border)`, etc. for theming
- **Icons**: Lucide React icons (`lucide-react`)
- **Charts**: Recharts for data visualization
- **Sanitization**: DOMPurify for markdown HTML output

## Dependencies

- **Internal**: `@/lib/utils`, `@/types`
- **External**: react, lucide-react, recharts, dompurify, remark, remark-html

## Common Tasks

- **Add new component**: Create `[name].tsx` with `'use client'` directive
- **Add icon**: Import from `lucide-react`
- **Style conditionally**: Use `cn(baseClass, condition && 'conditional-class')`
- **Render markdown**: Use `MarkdownRenderer` component

## Important Notes

- All components use `'use client'` for React hooks
- CSS variables enable automatic dark mode support
- `cn()` from `@/lib/utils` merges Tailwind classes safely
- `openInEditor()` from utils opens files in VS Code
