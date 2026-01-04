# Data Model: Suggest Next Action

**Feature**: 007-suggest-next-action
**Date**: 2026-01-03

## Entities

### SuggestedCommand (Enhanced)

Represents a single suggested action with explanation.

**Location**: `src/lib/utils.ts`

```typescript
export interface SuggestedCommand {
  command: string;        // The /speckit.* command to run
  title: string;          // Short action title (e.g., "Create Implementation Plan")
  description: string;    // Detailed description of what the command does
  reason: string;         // NEW: Why this action is suggested now
  isOptional: boolean;    // Whether this is an optional step
}
```

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | `string` | Yes | The spec-kit command (e.g., `/speckit.plan`) |
| `title` | `string` | Yes | Human-readable action title |
| `description` | `string` | Yes | What the command does |
| `reason` | `string` | Yes | **NEW** - Why this is the next step |
| `isOptional` | `boolean` | Yes | Whether user can skip this step |

### CommandSuggestion (Unchanged)

Container for primary and optional suggestions.

```typescript
export interface CommandSuggestion {
  primary: SuggestedCommand | null;   // Main suggested action
  optional: SuggestedCommand | null;  // Optional alternative action
}
```

### SuggestionIndicator (New)

Lightweight indicator for Kanban cards.

```typescript
export interface SuggestionIndicator {
  hasAction: boolean;      // Whether there's a suggested action
  actionLabel: string;     // Short label (e.g., "Plan", "Implement")
  isBlocked: boolean;      // Whether feature is in blocked state
  blockedReason?: string;  // Why feature is blocked
}
```

## State Transitions

### Feature Workflow States

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     No constitution
│  SPECIFY    │◄────────────────────┐
│  (no spec)  │                     │
└──────┬──────┘                     │
       │ spec.md created            │
       ▼                            │
┌─────────────┐                     │
│    PLAN     │                     │
│  (no plan)  │                     │
└──────┬──────┘                     │
       │ plan.md created            │
       ▼                            │
┌─────────────┐                     │
│   TASKS     │                     │
│ (no tasks)  │                     │
└──────┬──────┘                     │
       │ tasks.md created           │
       ▼                            │
┌─────────────┐                     │
│ IMPLEMENT   │                     │
│ (in progress)│                    │
└──────┬──────┘                     │
       │ all tasks complete         │
       ▼                            │
┌─────────────┐                     │
│  COMPLETE   │                     │
│ (all done)  │                     │
└─────────────┘                     │
                                    │
┌─────────────┐                     │
│  BLOCKED    │─────────────────────┘
│ (error state)│  (resolve and retry)
└─────────────┘
```

### Suggestion Mapping

| State | Primary Suggestion | Reason Template |
|-------|-------------------|-----------------|
| No constitution | `/speckit.constitution` | "Project needs guiding principles before features" |
| No spec | `/speckit.specify` | "Define requirements before implementation" |
| Has spec, no plan | `/speckit.plan` | "Spec complete ({n} user stories) - ready for technical design" |
| Has plan, no tasks | `/speckit.tasks` | "Plan complete - break down into actionable tasks" |
| Has tasks, incomplete | `/speckit.implement` | "{n} of {total} tasks remaining" |
| All tasks complete, no analysis | `/speckit.analyze` | "Implementation complete - verify against spec" |
| Complete with analysis | `null` | "Feature complete!" |
| Blocked | `null` | "{specific blocked reason}" |

## Validation Rules

### SuggestedCommand Validation

| Field | Rule |
|-------|------|
| `command` | Must start with `/speckit.` |
| `title` | Max 50 characters |
| `description` | Max 200 characters |
| `reason` | Max 100 characters, must explain current state |

### Blocked State Detection

A feature is considered blocked when:

1. **Inconsistent state**: Has tasks but no plan (shouldn't happen)
2. **Missing required files**: Plan references files that don't exist
3. **Circular dependency**: Feature depends on incomplete feature

## Storage Schema

No database storage required. All data is derived from:

1. `Feature` object (from parser)
2. `hasConstitution` flag (from project)

Suggestions are computed on-demand, not persisted.
