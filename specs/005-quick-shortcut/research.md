# Research: Quick Keyboard Shortcuts

**Feature**: 005-quick-shortcut
**Date**: 2025-12-31

## Technology Decisions

### 1. Shortcut Library vs Custom Implementation

**Decision**: Custom implementation using native browser KeyboardEvent API

**Rationale**:
- The existing codebase already handles keyboard events natively (see `kanban-board.tsx`, `use-focus-trap.ts`)
- No external dependencies needed - keeps bundle size small
- Full control over shortcut behavior and conflict resolution
- Aligns with Constitution Principle VI (Component Simplicity)

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| `react-hotkeys-hook` | Adds dependency for simple use case; existing patterns work well |
| `mousetrap` | jQuery-era library, not React-idiomatic |
| `tinykeys` | Good option but custom solution is simpler for our needs |

### 2. Shortcut Registry Architecture

**Decision**: Centralized configuration object with typed shortcut definitions

**Rationale**:
- Single source of truth for all shortcuts
- Easy to generate help overlay dynamically
- Type-safe shortcut definitions prevent runtime errors
- Follows existing pattern in `src/app/shortcuts/page.tsx` (SHORTCUT_GROUPS)

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| Distributed shortcuts per component | Hard to maintain, no central documentation |
| Database-stored shortcuts | Over-engineering for static shortcuts |
| User-configurable shortcuts | Out of scope for MVP, can add later |

### 3. Global Shortcut Handler Placement

**Decision**: Custom hook (`useShortcuts`) applied at layout level with context-aware filtering

**Rationale**:
- Single event listener for performance
- Context-aware: knows when to disable (input fields, modals)
- Can be composed with existing `useFocusTrap` for modal scenarios
- Follows React patterns used elsewhere in codebase

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| Per-component handlers | Duplicate logic, harder to maintain |
| Global window listener in useEffect | Less React-idiomatic, harder to test |
| Context provider pattern | Over-engineering for this use case |

### 4. Focus State Management

**Decision**: Extend existing Zustand store with focus tracking

**Rationale**:
- Store already manages `selectedFeature` state
- Adding `focusedCardIndex` and `focusedColumn` is natural extension
- Enables FR-008 (persist focus position when returning to view)
- Consistent with existing state management patterns

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| React Context for focus | Would duplicate state management patterns |
| Local component state | Can't persist across navigation |
| URL-based focus tracking | Over-engineering, pollutes URL |

### 5. Help Overlay Implementation

**Decision**: Modal component using existing `useFocusTrap` and `announce()` utilities

**Rationale**:
- Reuses existing accessibility infrastructure
- Consistent with other modals in the app (OpenProjectModal)
- Triggered by "?" key globally
- Auto-generates content from shortcut registry

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| Separate page (existing /shortcuts) | Less discoverable, breaks flow |
| Tooltip-based hints | Too intrusive, doesn't show all shortcuts |
| Browser extension | Out of scope, not portable |

## Existing Code Analysis

### Current Keyboard Handling

| Location | Current Behavior | Enhancement Needed |
|----------|------------------|-------------------|
| `kanban-board.tsx:49-58` | Enter/Space opens feature | Add arrow key navigation |
| `feature-detail/` | Number keys 1-9 switch tabs | Already implemented |
| `open-project-modal.tsx` | Arrow keys navigate suggestions | Already implemented |
| `use-focus-trap.ts` | Tab trapping in modals | Reuse for help overlay |

### Accessibility Utilities Available

| Utility | Location | Usage |
|---------|----------|-------|
| `announce()` | `lib/accessibility/announcer.ts` | Screen reader feedback |
| `useFocusTrap()` | `lib/accessibility/use-focus-trap.ts` | Modal focus management |
| `sr-only` class | CSS | Hidden screen reader text |

### Browser Shortcuts to Avoid

Based on FR-006, these shortcuts MUST NOT be used:

| Shortcut | Browser Function |
|----------|------------------|
| Ctrl+T | New tab |
| Ctrl+W | Close tab |
| Ctrl+N | New window |
| Ctrl+R / F5 | Refresh |
| Ctrl+L | Focus address bar |
| Ctrl+D | Bookmark |
| Alt+Left/Right | Back/Forward |
| Ctrl+Tab | Switch tabs |

### Safe Shortcut Patterns

| Pattern | Example | Notes |
|---------|---------|-------|
| Single letters | `?`, `g`, `n` | Only when not in input |
| Shift + letter | `Shift+N` | Safe modifier |
| Ctrl + non-browser | `Ctrl+\` | Already used in app |
| Arrow keys | `↑`, `↓`, `←`, `→` | Context-dependent |

## Input Field Detection Strategy

For FR-004 (disable shortcuts in input fields):

```typescript
function isEditableElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Check contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check if inside contenteditable parent
  return element.closest('[contenteditable="true"]') !== null;
}
```

## Proposed Shortcut Mapping

Based on spec requirements and existing patterns:

### Navigation Shortcuts (FR-001)

| Shortcut | Action | Context |
|----------|--------|---------|
| `g` then `h` | Go to home/dashboard | Global |
| `Escape` | Go back / close modal | Global |
| `↑` / `↓` | Navigate cards in column | Kanban board |
| `←` / `→` | Navigate between columns | Kanban board |
| `Enter` | Open focused card | Kanban board |

### Action Shortcuts (FR-002)

| Shortcut | Action | Context |
|----------|--------|---------|
| `n` | New feature (if applicable) | Kanban board |
| `Shift+←` | Move card left (prev status) | Card focused |
| `Shift+→` | Move card right (next status) | Card focused |

### Help Shortcuts (FR-003)

| Shortcut | Action | Context |
|----------|--------|---------|
| `?` | Show shortcuts help overlay | Global |
| `Escape` | Close help overlay | Help overlay open |

## Visual Feedback Strategy (FR-005)

| Action | Feedback Type |
|--------|---------------|
| Card focused | Focus ring (existing `focus-ring` class) |
| Card moved | Announce via screen reader + brief highlight |
| Shortcut executed | Announce action to screen reader |
| Invalid action | Subtle shake animation + announce "Cannot move" |

## Next Steps

1. Create `src/lib/shortcuts/` module with types and configuration
2. Implement `useShortcuts` hook with input field detection
3. Add focus state to Zustand store
4. Enhance `KanbanBoard` with arrow key navigation
5. Create `ShortcutHelpOverlay` component
6. Update `/shortcuts` page to use centralized config
7. Add unit tests for shortcut handlers
