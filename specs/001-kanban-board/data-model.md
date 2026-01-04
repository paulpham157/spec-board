# Data Model: Kanban Board

**Feature**: 001-kanban-board
**Date**: 2025-12-29
**Source**: `src/types/index.ts`, `src/lib/utils.ts`

## Overview

The Kanban board displays **Features** organized into **Columns** based on workflow state. This document describes the data structures used by the board component.

## Entities

### Feature

The primary entity displayed on the Kanban board. Represents a development item from a spec-kit project.

**Source**: `src/types/index.ts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (folder name, e.g., "001-kanban-board") |
| `name` | `string` | Display name (derived from folder name) |
| `path` | `string` | Filesystem path to feature directory |
| `stage` | `FeatureStage` | Current workflow stage |
| `hasSpec` | `boolean` | Whether spec.md exists |
| `hasPlan` | `boolean` | Whether plan.md exists |
| `hasTasks` | `boolean` | Whether tasks.md exists |
| `hasChecklists` | `boolean` | Whether checklists directory has files |
| `totalTasks` | `number` | Total number of tasks in tasks.md |
| `completedTasks` | `number` | Number of completed tasks |
| `totalChecklistItems` | `number` | Total checklist items across all checklists |
| `completedChecklistItems` | `number` | Number of completed checklist items |
| `branch` | `string \| null` | Git branch name (from spec/plan frontmatter) |
| `tasks` | `Task[]` | Array of task objects |
| `phases` | `TaskPhase[]` | Tasks grouped by phase |
| `userStories` | `UserStory[]` | User stories from spec.md |
| `taskGroups` | `TaskGroup[]` | Tasks grouped by user story |
| `clarificationSessions` | `ClarificationSession[]` | Q&A history from spec.md |
| `specContent` | `string \| null` | Raw spec.md content |
| `planContent` | `string \| null` | Raw plan.md content |
| `additionalFiles` | `SpecKitFile[]` | Other files (research.md, etc.) |
| `analysis` | `FeatureAnalysis \| null` | Spec alignment analysis |

### FeatureStage

Enum representing the workflow stage of a feature.

**Source**: `src/types/index.ts`

```typescript
type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';
```

| Value | Description |
|-------|-------------|
| `specify` | Feature is being specified (no spec or incomplete) |
| `plan` | Feature has spec, planning in progress |
| `tasks` | Feature has plan, tasks being defined |
| `implement` | Tasks defined, implementation in progress |
| `complete` | All tasks and checklists complete |

### KanbanColumn

Type representing the four columns on the Kanban board.

**Source**: `src/lib/utils.ts:49`

```typescript
type KanbanColumn = 'backlog' | 'planning' | 'in_progress' | 'done';
```

| Value | Label | Features Included |
|-------|-------|-------------------|
| `backlog` | Backlog | No spec OR spec without plan |
| `planning` | Planning | Has plan but no tasks |
| `in_progress` | In Progress | Has tasks (incomplete) OR incomplete checklists |
| `done` | Done | All tasks AND checklists complete |

## Relationships

```
Project (1) ──────< Feature (many)
                        │
                        ├── hasSpec, hasPlan, hasTasks → determines KanbanColumn
                        │
                        ├── totalTasks, completedTasks → progress percentage
                        │
                        └── totalChecklistItems, completedChecklistItems → checklist progress
```

## State Transitions

Features move between columns based on file existence and completion status:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [No spec] ──────> [Has spec] ──────> [Has plan] ──────> [Has tasks]
│      │                  │                  │                  │
│      v                  v                  v                  v
│   BACKLOG           BACKLOG           PLANNING          IN_PROGRESS
│                                                               │
│                                                               │
│                                          [All tasks complete] │
│                                                   │           │
│                                                   v           │
│                                          [Checklists exist?]  │
│                                              /        \       │
│                                            Yes        No      │
│                                             │          │      │
│                                             v          v      │
│                                    [All complete?]   DONE     │
│                                        /      \               │
│                                      Yes      No              │
│                                       │        │              │
│                                       v        v              │
│                                     DONE   IN_PROGRESS        │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Rules

1. **Feature ID**: Must be a valid directory name (alphanumeric, hyphens, underscores)
2. **Progress Calculation**: `percentage = (completedTasks / totalTasks) * 100` (0 if no tasks)
3. **Column Assignment**: Deterministic based on `getFeatureKanbanColumn()` logic
4. **Checklist Impact**: Features with incomplete checklists remain in "In Progress" even if all tasks complete

## Component Props

### KanbanBoardProps

```typescript
interface KanbanBoardProps {
  features: Feature[];           // All features to display
  onFeatureClick: (feature: Feature) => void;  // Callback when card clicked
}
```

### FeatureCardProps

```typescript
interface FeatureCardProps {
  feature: Feature;              // Feature to display
  onClick: () => void;           // Click handler
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;  // Keyboard handler
}
```
