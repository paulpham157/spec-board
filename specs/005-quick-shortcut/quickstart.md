# Quickstart: Quick Keyboard Shortcuts

**Feature**: 005-quick-shortcut
**Date**: 2025-12-31

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Existing SpecBoard development environment set up

## Setup Steps

### 1. Create Shortcuts Module

Create the new shortcuts module directory:

```bash
mkdir -p src/lib/shortcuts
```

### 2. Install Dependencies

No additional dependencies required - uses native browser APIs and existing React/Zustand.

### 3. Create Core Files

Create the following files in order:

1. `src/lib/shortcuts/index.ts` - Types and exports
2. `src/lib/shortcuts/shortcut-config.ts` - Shortcut definitions
3. `src/lib/shortcuts/use-shortcuts.ts` - Global shortcut hook
4. `src/components/shortcut-help-overlay.tsx` - Help modal component

## Development

### Running the Development Server

```bash
pnpm dev
```

### Testing Shortcuts

1. Open the app at `http://localhost:3000`
2. Press `?` to open the shortcuts help overlay
3. Navigate to a project with features
4. Use arrow keys to navigate the Kanban board
5. Press `Enter` to open a feature

### Running Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm typecheck
```

## Verification Checklist

- [ ] `?` key opens help overlay from any view
- [ ] `Escape` closes help overlay
- [ ] Arrow keys navigate between cards on Kanban board
- [ ] `Enter` opens focused card
- [ ] Shortcuts are disabled when typing in input fields
- [ ] Screen reader announces shortcut actions
- [ ] No conflicts with browser shortcuts (Ctrl+T, Ctrl+W, etc.)

## Key Files to Create

| File | Purpose |
|------|---------|
| `src/lib/shortcuts/index.ts` | Type definitions and module exports |
| `src/lib/shortcuts/shortcut-config.ts` | Centralized shortcut definitions |
| `src/lib/shortcuts/use-shortcuts.ts` | React hook for global shortcut handling |
| `src/components/shortcut-help-overlay.tsx` | Modal showing all available shortcuts |

## Browser Support

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Keyboard Event Compatibility

All shortcuts use standard `KeyboardEvent` properties:
- `event.key` for key identification
- `event.shiftKey`, `event.ctrlKey`, `event.metaKey` for modifiers
- `event.preventDefault()` to prevent default browser behavior

## Architecture Notes

### Shortcut Processing Flow

1. Global `keydown` listener attached at layout level
2. Check if active element is editable (input, textarea, contenteditable)
3. If editable, ignore shortcut
4. Match key combination against shortcut registry
5. Check if shortcut context matches current view
6. Execute action handler
7. Announce action to screen reader

### Integration Points

| Component | Integration |
|-----------|-------------|
| `src/app/layout.tsx` | Mount `useShortcuts` hook |
| `src/lib/store.ts` | Add focus state management |
| `src/components/kanban-board.tsx` | Add arrow key navigation |
| `src/app/shortcuts/page.tsx` | Use centralized config |
