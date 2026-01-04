# Research: Kanban Board

**Feature**: 001-kanban-board
**Date**: 2025-12-29
**Status**: Complete (documenting existing implementation)

## Overview

This document captures the technology decisions made for the Kanban board feature in SpecBoard. Since this feature already exists, this research documents the rationale behind the current implementation.

## Technology Decisions

### 1. Column Categorization Logic

**Decision**: Use a deterministic function `getFeatureKanbanColumn()` to categorize features based on workflow state.

**Rationale**:
- Features naturally progress through stages: specify → plan → tasks → implement → complete
- Column assignment should be automatic based on file existence (spec.md, plan.md, tasks.md)
- Checklist completion affects "Done" status to ensure quality gates are met

**Alternatives Considered**:
- Manual column assignment by users → Rejected: adds friction, prone to stale data
- Stage-based only (ignoring checklists) → Rejected: features could be marked "done" prematurely

**Implementation**: `src/lib/utils.ts:75-106`

### 2. Progress Indicator Colors

**Decision**: Four-tier color system based on completion percentage.

| Range | Color | Meaning |
|-------|-------|---------|
| 0% or no tasks | Gray | Not started |
| 1-79% | Yellow/Warning | In progress |
| 80-99% | Neon/Highlight | Almost done |
| 100% | Green/Success | Complete |

**Rationale**:
- Gray for empty/zero provides clear "not started" signal
- Yellow for active work draws attention without alarm
- Neon at 80% creates urgency for final push
- Green for completion provides satisfaction feedback

**Alternatives Considered**:
- Two-tier (incomplete/complete) → Rejected: loses progress granularity
- Continuous gradient → Rejected: harder to interpret at a glance

**Implementation**: `src/components/kanban-board.tsx:13-25`

### 3. Component Architecture

**Decision**: Single file with multiple internal components.

```
kanban-board.tsx
├── KanbanBoard (exported)
├── KanbanColumnComponent (internal)
├── FeatureCard (internal)
└── EmptyColumn (internal)
```

**Rationale**:
- Components are tightly coupled and only used together
- Single file reduces import complexity
- Internal components don't need external access
- Follows constitution principle VI (Component Simplicity)

**Alternatives Considered**:
- Separate files per component → Rejected: over-engineering for tightly coupled components
- Single monolithic component → Rejected: violates single responsibility

### 4. Accessibility Approach

**Decision**: Comprehensive ARIA support with screen reader announcements.

**Features**:
- `aria-label` on all interactive elements
- `role="region"` for columns with `aria-labelledby`
- `role="list"` and `role="listitem"` for feature cards
- Screen reader summary with feature counts
- `announce()` function for dynamic updates

**Rationale**:
- Constitution principle IV requires accessibility
- Kanban boards are inherently visual; screen reader users need equivalent information
- Keyboard navigation (Enter/Space) enables mouse-free operation

**Implementation**: `src/components/kanban-board.tsx:159-205`, `src/lib/accessibility/index.ts`

### 5. State Management

**Decision**: Props-based with parent state management.

**Rationale**:
- Board receives `features` array and `onFeatureClick` callback
- No internal state needed (pure presentation component)
- Parent component (project page) manages data fetching and selection
- Follows React best practices for component composition

**Alternatives Considered**:
- Internal Zustand store → Rejected: unnecessary complexity for display-only component
- Context provider → Rejected: props sufficient for single-level data flow

## Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| React | UI framework | 19.x |
| Lucide React | Icons (GitBranch, ListTodo, Circle) | latest |
| Tailwind CSS | Styling | 4.x |
| `@/lib/utils` | Column categorization, class merging | internal |
| `@/lib/accessibility` | Screen reader announcements | internal |
| `@/types` | Feature type definition | internal |

## Performance Considerations

- **Memoization**: Not currently needed; React's default reconciliation handles typical feature counts (5-50)
- **Virtualization**: Not implemented; would be needed for 100+ features per column
- **Re-renders**: Minimized by keeping board as pure presentation component

## Future Considerations

These items are documented but NOT in scope for current implementation:

1. **Drag-and-drop**: Could allow manual column override (would require state persistence)
2. **Filtering**: Filter by branch, completion status, or search term
3. **Sorting**: Sort features within columns by name, progress, or date
4. **Column customization**: User-defined columns beyond the four defaults
