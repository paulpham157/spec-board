# Shortcuts Module

## Purpose
Keyboard shortcut system for SpecBoard enabling keyboard-only navigation and actions.

## Overview
This module provides a centralized keyboard shortcut system with:
- Global shortcut registry with typed definitions
- Context-aware shortcut handling (global, kanban, modal)
- Input field detection to disable shortcuts when typing
- Help overlay for shortcut discovery
- Screen reader announcements for accessibility

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Module exports and `isEditableElement()` utility |
| `shortcut-config.ts` | Centralized shortcut definitions |
| `use-shortcuts.ts` | Global keyboard event hook |

## Architecture

### Shortcut Flow
```
KeyDown Event
    │
    ▼
isEditableElement? ──Yes──► Ignore
    │ No
    ▼
Match shortcut? ──No──► Ignore
    │ Yes
    ▼
Check context ──No──► Ignore
    │ Yes
    ▼
Execute action
    │
    ▼
Announce (a11y)
```

### Context Types

| Context | Description |
|---------|-------------|
| `global` | Active everywhere (except input fields) |
| `kanban` | Active only on Kanban board |
| `feature-detail` | Active in feature detail view |
| `modal` | Active when modal is open |

## Shortcut Categories

| Category | Shortcuts |
|----------|-----------|
| Navigation | Arrow keys, Enter, Escape, g+h |
| Actions | Shift+Arrow (feedback only - read-only app) |
| Help | ? (toggle help overlay) |

## Integration Points

| Component | Integration |
|-----------|-------------|
| `src/app/layout.tsx` | Mounts `ShortcutsProvider` |
| `src/lib/store.ts` | `focusState`, `setFocusState`, `clearFocusState` |
| `src/components/kanban-board.tsx` | Arrow key navigation, focus indicators |
| `src/components/shortcuts-provider.tsx` | Global shortcuts context |
| `src/components/shortcut-help-overlay.tsx` | Help modal |
| `src/app/shortcuts/page.tsx` | Full shortcuts reference page |

## Adding New Shortcuts

1. Add shortcut definition to `shortcut-config.ts`:
```typescript
{
  id: 'my-shortcut',
  keys: ['Shift', 'N'],
  description: 'My new shortcut',
  category: 'actions',
  context: 'kanban',
  action: 'my-action',
}
```

2. Add action handler in `use-shortcuts.ts` or component:
```typescript
case 'my-action':
  // Handle action
  announce('Action performed', 'polite');
  break;
```

## Patterns & Conventions

- **Single letters**: Only when not in input (e.g., `?`, `g`)
- **Sequences**: Two-key sequences like `g` then `h`
- **Modifiers**: `Shift+Key` for actions
- **Avoid**: Browser shortcuts (Ctrl+T, Ctrl+W, etc.)

## Dependencies

- **Internal**: `@/types`, `@/lib/store`, `@/lib/accessibility`
- **External**: react, next/navigation

## Important Notes

- SpecBoard is read-only - card movement shows feedback only
- Focus state is NOT persisted to localStorage (resets on refresh)
- All shortcuts are disabled in input/textarea/contenteditable elements
- Screen reader announcements via `announce()` from accessibility module
