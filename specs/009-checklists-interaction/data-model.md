# Data Model: Checklists Interaction

**Feature**: 009-checklists-interaction
**Date**: 2026-01-03

## Entities

### ChecklistItem (Extended)

Represents a single toggleable item within a checklist section.

| Property | Type | Description |
|----------|------|-------------|
| text | string | The item's display text |
| checked | boolean | Current checked state |
| tag | string \| undefined | Optional tag (e.g., "Gap", "Clarity") |
| lineIndex | number | **NEW**: 0-based line number in source file |

**Validation Rules**:
- `text` must be non-empty after trimming
- `lineIndex` must be >= 0
- `lineIndex` must correspond to a valid checkbox line in the file

### ChecklistSection (Unchanged)

Groups related checklist items under a heading.

| Property | Type | Description |
|----------|------|-------------|
| title | string | Section heading text |
| items | ChecklistItem[] | Items in this section |

### ChecklistToggleRequest

API request payload for toggling a checklist item.

| Property | Type | Description |
|----------|------|-------------|
| filePath | string | Absolute path to checklist markdown file |
| lineIndex | number | 0-based line number to toggle |
| expectedState | boolean | Current state for conflict detection |

**Validation Rules**:
- `filePath` must pass `isPathSafe()` validation
- `filePath` must exist and be readable
- `filePath` must be within a valid specs directory
- `lineIndex` must be >= 0
- Line at `lineIndex` must contain a valid checkbox pattern

### ChecklistToggleResponse

API response for toggle operations.

| Property | Type | Description |
|----------|------|-------------|
| success | boolean | Whether the operation succeeded |
| newState | boolean \| undefined | New checked state (if success) |
| content | string \| undefined | Updated file content (if success) |
| error | string \| undefined | Error code (if failure) |
| message | string \| undefined | Human-readable error message |
| currentState | boolean \| undefined | Actual state (if conflict) |

**Error Codes**:
- `invalid_path`: Path validation failed
- `file_not_found`: File does not exist
- `invalid_line`: Line is not a valid checkbox
- `conflict`: Expected state doesn't match actual state
- `write_failed`: File system write error

## State Transitions

### Checklist Item State

```
┌─────────────┐     toggle()      ┌─────────────┐
│  Unchecked  │ ───────────────▶  │   Checked   │
│   - [ ]     │                   │   - [x]     │
└─────────────┘ ◀───────────────  └─────────────┘
                   toggle()
```

### UI Toggle State Machine

```
┌─────────┐
│  Idle   │
└────┬────┘
     │ user clicks/presses key
     ▼
┌─────────────────┐
│ Optimistic      │ ──▶ UI shows new state immediately
│ Update          │
└────┬────────────┘
     │ API call starts
     ▼
┌─────────────────┐
│ Saving          │ ──▶ Loading indicator shown
│ (debounced)     │
└────┬────────────┘
     │
     ├─── success ───▶ ┌─────────┐
     │                 │  Idle   │ ──▶ State confirmed
     │                 └─────────┘
     │
     └─── failure ───▶ ┌─────────────┐
                       │  Rollback   │ ──▶ Revert to previous state
                       └──────┬──────┘     Show error toast
                              │
                              ▼
                       ┌─────────┐
                       │  Idle   │
                       └─────────┘
```

## Type Definitions

```typescript
// New types to add to src/types/index.ts

/** Request payload for toggling a checklist item */
export interface ChecklistToggleRequest {
  filePath: string;
  lineIndex: number;
  expectedState: boolean;
}

/** Response from checklist toggle API */
export interface ChecklistToggleResponse {
  success: boolean;
  newState?: boolean;
  content?: string;
  error?: 'invalid_path' | 'file_not_found' | 'invalid_line' | 'conflict' | 'write_failed';
  message?: string;
  currentState?: boolean;
}

/** Extended ChecklistItem with line tracking */
export interface ChecklistItemWithLine {
  text: string;
  checked: boolean;
  tag?: string;
  lineIndex: number;
}
```

## Storage Schema

### File Format (Markdown)

Checklist files follow standard markdown checkbox syntax:

```markdown
# Checklist Title

**Purpose**: Description
**Created**: YYYY-MM-DD
**Feature**: [spec.md](../spec.md)

## Section Name

- [ ] Unchecked item
- [x] Checked item
- [ ] Item with [Tag]

## Notes

- Note item (not a checkbox)
```

**Checkbox Pattern**: `- [ ]` (unchecked) or `- [x]` / `- [X]` (checked)

### File Location

```
specs/<feature-name>/checklists/<checklist-name>.md
```

Example: `specs/009-checklists-interaction/checklists/requirements.md`

## Data Integrity

### Invariants

1. **Line index stability**: Line indices are valid only for the current file state
2. **Atomic writes**: File writes are atomic (write to temp, then rename)
3. **Content preservation**: Toggle operations preserve all non-checkbox content
4. **Single checkbox per line**: Each line contains at most one checkbox

### Conflict Detection

The `expectedState` parameter enables optimistic concurrency control:

1. Client sends current state with toggle request
2. Server reads file and checks actual state
3. If mismatch: return `conflict` error with `currentState`
4. Client can retry with correct state or refresh UI

### Error Recovery

| Scenario | Recovery |
|----------|----------|
| Network failure | Rollback UI, show retry option |
| File conflict | Refresh file content, re-apply toggle |
| Permission denied | Show error, suggest checking file permissions |
| File deleted | Show error, remove checklist from UI |
