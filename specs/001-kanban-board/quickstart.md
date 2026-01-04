# Quickstart: Kanban Board

**Feature**: 001-kanban-board
**Date**: 2025-12-29

## Overview

The Kanban board displays spec-kit features in a four-column pipeline view. This guide explains how to use and modify the component.

## Using the Component

### Basic Usage

```tsx
import { KanbanBoard } from '@/components/kanban-board';
import type { Feature } from '@/types';

function MyPage() {
  const features: Feature[] = [...]; // From parser or API

  const handleFeatureClick = (feature: Feature) => {
    console.log('Selected:', feature.name);
  };

  return (
    <KanbanBoard
      features={features}
      onFeatureClick={handleFeatureClick}
    />
  );
}
```

### Integration with Project Page

The Kanban board is already integrated in `src/app/projects/[name]/page.tsx`:

```tsx
// Features come from the project data
const { project } = useProjectStore();

<KanbanBoard
  features={project?.features ?? []}
  onFeatureClick={handleFeatureSelect}
/>
```

## Understanding Column Assignment

Features are automatically assigned to columns based on their state:

| Column | Condition |
|--------|-----------|
| **Backlog** | No spec.md OR spec.md exists but no plan.md |
| **Planning** | Has plan.md but no tasks.md |
| **In Progress** | Has tasks.md with incomplete tasks OR incomplete checklists |
| **Done** | All tasks complete AND all checklists complete |

### Testing Column Logic

```bash
# Run the column categorization tests
pnpm test src/lib/utils.test.ts
```

## Customizing Progress Colors

Progress colors are defined in `src/components/kanban-board.tsx`:

```typescript
// Lines 13-25
function getProgressColorStyle(percentage: number, hasItems: boolean) {
  if (!hasItems || percentage === 0) return { color: 'var(--muted-foreground)' };
  if (percentage < 80) return { color: 'var(--color-warning)' };
  if (percentage < 100) return { color: 'var(--color-neon)' };
  return { color: 'var(--color-success)' };
}
```

To change thresholds, modify the percentage checks.

## Adding a New Column

1. **Update the type** in `src/lib/utils.ts`:
   ```typescript
   export type KanbanColumn = 'backlog' | 'planning' | 'in_progress' | 'review' | 'done';
   ```

2. **Update the COLUMNS array** in `src/components/kanban-board.tsx`:
   ```typescript
   const COLUMNS: KanbanColumn[] = ['backlog', 'planning', 'in_progress', 'review', 'done'];
   ```

3. **Update the categorization logic** in `getFeatureKanbanColumn()`:
   ```typescript
   // Add new condition for 'review' column
   ```

4. **Add label and hint** for the new column:
   ```typescript
   // In getKanbanColumnLabel()
   review: 'Review',

   // In EmptyColumn hints
   review: 'Features awaiting review',
   ```

## Accessibility Testing

### Keyboard Navigation

1. Tab to focus a feature card
2. Press Enter or Space to open details
3. Use Tab to move between cards

### Screen Reader Testing

1. Enable VoiceOver (macOS) or NVDA (Windows)
2. Navigate to the board
3. Verify announcements include:
   - Total feature count
   - Features per column
   - Feature name and progress on each card

## File Locations

| File | Purpose |
|------|---------|
| `src/components/kanban-board.tsx` | Main component |
| `src/lib/utils.ts` | Column categorization logic |
| `src/lib/utils.test.ts` | Unit tests |
| `src/types/index.ts` | Type definitions |
| `src/lib/accessibility/index.ts` | Screen reader utilities |

## Common Tasks

### Change column order

Edit the `COLUMNS` array in `kanban-board.tsx:9`.

### Modify card content

Edit the `FeatureCard` component in `kanban-board.tsx:33-131`.

### Add new progress indicator

1. Add field to `Feature` type
2. Add display logic in `FeatureCard`
3. Update ARIA label for accessibility

### Debug column assignment

```typescript
import { getFeatureKanbanColumn } from '@/lib/utils';

// In your component or test
console.log(getFeatureKanbanColumn(feature)); // 'backlog' | 'planning' | 'in_progress' | 'done'
```
