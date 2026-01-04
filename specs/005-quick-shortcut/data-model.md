# Data Model: Quick Keyboard Shortcuts

**Feature**: 005-quick-shortcut
**Date**: 2025-12-31

## Entities

### Shortcut

Represents a keyboard shortcut definition.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (e.g., "nav-home", "action-move-right") |
| `keys` | `string[]` | Key combination (e.g., `["g", "h"]` or `["Shift", "→"]`) |
| `description` | `string` | Human-readable description |
| `category` | `ShortcutCategory` | Grouping category |
| `context` | `ShortcutContext` | Where shortcut is active |
| `action` | `string` | Action identifier to execute |

### ShortcutCategory

Enum for grouping shortcuts in help overlay.

| Value | Description |
|-------|-------------|
| `navigation` | View and focus navigation |
| `actions` | Card/feature manipulation |
| `help` | Help and discovery |

### ShortcutContext

Enum for context-aware shortcut activation.

| Value | Description |
|-------|-------------|
| `global` | Active everywhere (except input fields) |
| `kanban` | Active only on Kanban board |
| `feature-detail` | Active only in feature detail view |
| `modal` | Active only when modal is open |

### FocusState

Tracks current keyboard focus position for Kanban navigation.

| Property | Type | Description |
|----------|------|-------------|
| `column` | `KanbanColumn \| null` | Currently focused column |
| `cardIndex` | `number \| null` | Index of focused card in column |
| `featureId` | `string \| null` | ID of focused feature |

## Enums

### KanbanColumn (existing)

```typescript
type KanbanColumn = 'backlog' | 'planning' | 'in_progress' | 'done';
```

## State Transitions

### Focus State Machine

```
┌─────────────┐
│   No Focus  │ ←── Initial state / Escape pressed
└──────┬──────┘
       │ Arrow key or Tab
       ▼
┌─────────────┐
│ Card Focused│ ←── Arrow keys navigate
└──────┬──────┘
       │ Enter
       ▼
┌─────────────┐
│ Detail Open │ ←── Feature detail modal
└──────┬──────┘
       │ Escape
       ▼
┌─────────────┐
│ Card Focused│ ←── Returns to previous focus
└─────────────┘
```

### Shortcut Processing Flow

```
KeyDown Event
     │
     ▼
┌────────────────┐
│ Is input field?│──Yes──► Ignore (FR-004)
└───────┬────────┘
        │ No
        ▼
┌────────────────┐
│ Match shortcut │──No───► Ignore
└───────┬────────┘
        │ Yes
        ▼
┌────────────────┐
│ Check context  │──No───► Ignore
└───────┬────────┘
        │ Yes
        ▼
┌────────────────┐
│ Execute action │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Announce (a11y)│
└────────────────┘
```

## Storage Schema

### Zustand Store Extension

```typescript
// Added to existing ProjectStore in src/lib/store.ts
interface FocusState {
  column: KanbanColumn | null;
  cardIndex: number | null;
  featureId: string | null;
}

interface ProjectStore {
  // ... existing fields ...

  // NEW: Focus state for keyboard navigation
  focusState: FocusState;
  setFocusState: (state: Partial<FocusState>) => void;
  clearFocusState: () => void;
}
```

### localStorage (existing pattern)

Focus state is NOT persisted to localStorage - it resets on page refresh.
This is intentional: focus should start fresh each session.

## Validation Rules

### Shortcut Definition

| Field | Rule |
|-------|------|
| `id` | Required, unique, kebab-case |
| `keys` | Required, 1-3 keys, no browser conflicts |
| `description` | Required, max 100 chars |
| `category` | Required, valid enum value |
| `context` | Required, valid enum value |
| `action` | Required, must map to handler |

### Focus State

| Field | Rule |
|-------|------|
| `column` | Must be valid KanbanColumn or null |
| `cardIndex` | Must be >= 0 and < column.length, or null |
| `featureId` | Must match existing feature ID, or null |

## Data Integrity

### Shortcut Registry

- All shortcuts must have unique `id` values
- All shortcuts must have unique `keys` combinations within same `context`
- No shortcut may use browser-reserved key combinations
- All `action` values must have corresponding handler functions

### Focus State

- `cardIndex` must be validated against current column length
- If focused card is removed, focus moves to nearest valid card
- If column becomes empty, focus moves to nearest non-empty column
