# Feature Detail Directory

## Purpose
Full-screen modal components for viewing and navigating feature details with split-view support.

## Overview
This directory contains the redesigned Feature Detail Modal - a full-screen modal with a left navigation sidebar, split-view capability, and comprehensive keyboard navigation. Components are organized by responsibility: layout (header, sidebar), content rendering (panes), and interaction (drag-to-split).

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `feature-detail.tsx` | Main modal component with state management | ~510 |
| `types.ts` | TypeScript types, constants, and helper functions | ~190 |
| `split-view.tsx` | Resizable split-pane container | ~160 |
| `nav-sidebar.tsx` | Left navigation with phase groupings | ~115 |
| `content-pane.tsx` | Content renderer for each section type | ~varies |
| `header-bar.tsx` | Top bar with title and action buttons | ~70 |
| `status-header.tsx` | Progress bar and next action display | ~80 |
| `nav-item.tsx` | Individual navigation item with drag support | ~100 |
| `section-icon.tsx` | Semantic icons for each section type | ~75 |
| `index.tsx` | Public export | ~5 |

## Architecture

```
FeatureDetail (modal container)
├── HeaderBar (title, split toggle, close)
├── NavSidebar
│   ├── StatusHeader (progress, next task)
│   └── NavItem[] (grouped by phase)
│       └── SectionIcon (semantic icon per section)
└── SplitView
    ├── ContentPane (left)
    ├── Divider (resizable)
    └── ContentPane (right, optional)
```

## Section Types

Sections are grouped by workflow phase:

| Phase | Sections |
|-------|----------|
| **OVERVIEW** | Overview, Spec |
| **PLANNING** | Plan, Research, Data Model |
| **CODING** | Tasks |
| **QA** | Analysis |
| **QC** | Checklists |

## State Management

The modal manages several pieces of state:

| State | Type | Purpose |
|-------|------|---------|
| `activeSection` | `SectionId` | Currently displayed section |
| `selectedNavIndex` | `number` | Keyboard-selected nav item |
| `splitView` | `SplitViewState` | Split view configuration |
| `draggedSection` | `SectionId \| null` | Section being dragged |

### SplitViewState

```typescript
interface SplitViewState {
  isActive: boolean;
  leftPane: SectionId;
  rightPane: SectionId | null;
  splitRatio: number;      // 0.2 to 0.8
  focusedPane: 'left' | 'right';
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close split view, or close modal |
| `Ctrl+\` | Toggle split view |
| `Tab` | Switch focus between panes (in split mode) |
| `1-9` | Jump to section by number |
| `Shift+1-9` | Open section in right pane |
| `↑/↓` | Navigate sections |
| `Enter` | Open selected section |
| `Shift+Enter` | Open in split view |

## Drag and Drop

Users can drag navigation items to the content area to open them in split view:

1. `onDragStart` sets `draggedSection`
2. Content area shows drop indicator
3. `onDrop` activates split view with dragged section in right pane

## Constants

```typescript
// Split ratio bounds (split-view.tsx)
const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;
const SPLIT_RATIO_STEP = 0.05;

// Phase configuration (types.ts)
const PHASE_CONFIG: Record<WorkflowPhase, { label: string; sections: SectionId[] }>;
```

## Accessibility

- `aria-modal="true"` on dialog
- `aria-labelledby="modal-title"` references header title
- Focus trap within modal (`useFocusTrap`)
- Screen reader announcements via `announce()`
- Keyboard navigation for all interactions
- `role="separator"` on split divider with ARIA value attributes

## Patterns & Conventions

- **Memoization**: `useMemo` for section configs to prevent recalculation
- **Callbacks**: `useCallback` for all event handlers
- **Type Safety**: Explicit types on reduce callbacks (e.g., `Priority`)
- **Announcements**: Use section labels (not IDs) for screen readers
- **CSS Variables**: Theme-aware colors via `var(--foreground)`, etc.

## Dependencies

- **Internal**: `@/lib/utils`, `@/lib/accessibility`, `@/types`, viewer components
- **External**: react, lucide-react

## Common Tasks

- **Add new section**: Add to `SectionId` type, `PHASE_CONFIG`, and `buildSectionConfigs()`
- **Change split bounds**: Modify `MIN_SPLIT_RATIO`, `MAX_SPLIT_RATIO` constants
- **Add keyboard shortcut**: Add handler in `handleKeyDown` callback
- **Add status indicator**: Extend `getSectionStatus()` in types.ts

## Important Notes

- Modal uses focus trap - all focus stays within modal
- Split ratio is clamped to prevent panes from being too small
- Section visibility is determined by `show` property in config
- `buildSectionConfigs` checks `additionalFiles` for optional sections
- In split view, both left and right pane sections are highlighted in nav
- `selectedNavIndex` syncs with `activeSection` on click to prevent stale highlights

## Semantic Icons (section-icon.tsx)

Each section has a semantic icon that conveys document meaning:

| Section | Icon | Color Logic |
|---------|------|-------------|
| Overview | (none) | - |
| Spec | `FileCode` | Green if `hasSpec`, muted otherwise |
| Plan | `FileText` | Green if `hasPlan`, muted otherwise |
| Research | `BookOpen` | Green if file exists |
| Data Model | `Database` | Green if file exists |
| Tasks | `ListTodo` | Green if `hasTasks`, muted otherwise |
| Analysis | `AlertTriangle`/`CheckCircle`/`FileSearch` | Based on analysis severity |
| Checklists | `ClipboardCheck` | Green if `hasChecklists` |

Additional badges:
- **Spec**: Shows clarifications count with `MessageCircle` icon
- **Tasks**: Shows User Story count (e.g., "5 US")
- **Checklists**: Shows checklist file count (e.g., "3 checklists")
