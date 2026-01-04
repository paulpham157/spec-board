# Component Interface Contract: Kanban Board

**Feature**: 001-kanban-board
**Date**: 2025-12-29
**Type**: React Component Interface

## Overview

The Kanban board is a React component, not an API endpoint. This document defines the component interface contract - the props, callbacks, and expected behavior.

## Component: KanbanBoard

**Location**: `src/components/kanban-board.tsx`
**Export**: Named export `KanbanBoard`

### Props Interface

```typescript
interface KanbanBoardProps {
  /**
   * Array of features to display on the board.
   * Features are automatically categorized into columns based on workflow state.
   */
  features: Feature[];

  /**
   * Callback invoked when a feature card is clicked or activated via keyboard.
   * @param feature - The feature that was selected
   */
  onFeatureClick: (feature: Feature) => void;
}
```

### Usage Example

```tsx
import { KanbanBoard } from '@/components/kanban-board';
import type { Feature } from '@/types';

function ProjectPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <>
      <KanbanBoard
        features={features}
        onFeatureClick={(feature) => setSelectedFeature(feature)}
      />
      {selectedFeature && (
        <FeatureDetail
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </>
  );
}
```

## Internal Components

### FeatureCard

Renders a single feature as a clickable card.

```typescript
interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}
```

**Behavior**:
- Displays feature name, branch (if present), task progress, checklist progress
- Clickable button with `onClick` handler
- Keyboard accessible: Enter and Space activate the card
- ARIA label includes feature name and task completion status

### KanbanColumnComponent

Renders a single column with its features.

```typescript
interface KanbanColumnComponentProps {
  column: KanbanColumn;
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
}
```

**Behavior**:
- Displays column header with label and feature count
- Renders FeatureCard for each feature
- Shows EmptyColumn placeholder when no features

### EmptyColumn

Renders placeholder content for empty columns.

```typescript
interface EmptyColumnProps {
  column: KanbanColumn;
}
```

**Hints by Column**:
- `backlog`: "Features being specified"
- `planning`: "Features with plan, awaiting tasks"
- `in_progress`: "Features being worked on"
- `done`: "Fully completed features"

## Utility Functions

### getFeatureKanbanColumn

**Location**: `src/lib/utils.ts:75`

```typescript
function getFeatureKanbanColumn(feature: Feature): KanbanColumn
```

**Input**: Feature object
**Output**: KanbanColumn ('backlog' | 'planning' | 'in_progress' | 'done')

**Logic**:
1. No spec → `backlog`
2. Spec but no plan → `backlog`
3. Plan but no tasks → `planning`
4. Tasks incomplete → `in_progress`
5. Tasks complete but checklists incomplete → `in_progress`
6. All complete → `done`

### getKanbanColumnLabel

**Location**: `src/lib/utils.ts:108`

```typescript
function getKanbanColumnLabel(column: KanbanColumn): string
```

**Mapping**:
- `backlog` → "Backlog"
- `planning` → "Planning"
- `in_progress` → "In Progress"
- `done` → "Done"

## Accessibility Contract

The component MUST provide:

1. **Screen Reader Summary**: Hidden div with `aria-live="polite"` announcing total features and breakdown by column
2. **Column Regions**: Each column has `role="region"` with `aria-label`
3. **Feature Lists**: Features wrapped in `role="list"` with `role="listitem"` children
4. **Card Labels**: Each card has `aria-label` with feature name and task status
5. **Keyboard Navigation**: Enter and Space keys activate focused cards
6. **Announcements**: `announce()` called when opening feature details

## Styling Contract

The component uses:
- Tailwind CSS classes
- CSS variables for theming: `--foreground`, `--border`, `--card`, `--secondary`, `--muted-foreground`
- Color variables: `--color-warning`, `--color-neon`, `--color-success`, `--progress-empty`
- `cn()` utility for conditional class merging
