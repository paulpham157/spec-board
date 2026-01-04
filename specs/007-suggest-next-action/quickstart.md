# Quickstart: Suggest Next Action

**Feature**: 007-suggest-next-action
**Date**: 2026-01-03

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Existing spec-board development environment

## Setup Steps

### 1. Verify Development Environment

```bash
# Ensure you're on the feature branch
git checkout 007-suggest-next-action

# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev
```

### 2. Locate Files to Modify

The following files need modification:

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | Enhance `getSuggestedCommand()` with reasons |
| `src/components/feature-detail/suggested-command-card.tsx` | Display reason text |
| `src/components/kanban-board.tsx` | Add suggestion indicator to cards |

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Production build |

## Implementation Guide

### Step 1: Extend SuggestedCommand Type

In `src/lib/utils.ts`, add the `reason` field:

```typescript
export interface SuggestedCommand {
  command: string;
  title: string;
  description: string;
  reason: string;  // ADD THIS LINE
  isOptional: boolean;
}
```

### Step 2: Update getSuggestedCommand()

Add reason strings to each suggestion case. Example for the "no spec" case:

```typescript
if (!feature.hasSpec) {
  return {
    primary: {
      command: '/speckit.specify',
      title: 'Create Feature Specification',
      description: 'Define user stories, acceptance criteria, and requirements.',
      reason: 'No spec.md found - define requirements before implementation',  // ADD
      isOptional: false,
    },
    optional: null,
  };
}
```

### Step 3: Display Reason in SuggestedCommandCard

In `suggested-command-card.tsx`, add reason display after the description:

```tsx
{/* Reason - NEW */}
{command.reason && (
  <p className="text-xs text-[var(--muted-foreground)] mt-1 italic">
    {command.reason}
  </p>
)}
```

### Step 4: Add Kanban Card Indicator

In `kanban-board.tsx`, add a small badge showing the next action:

```tsx
{suggestion.primary && (
  <span className="text-xs text-amber-500" aria-label="Next action available">
    <Lightbulb className="w-3 h-3 inline" />
  </span>
)}
```

## Verification Checklist

- [ ] `pnpm dev` starts without errors
- [ ] Feature cards show suggestion indicator
- [ ] Feature detail modal shows reason text
- [ ] All existing tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm build`)
- [ ] Accessibility: reason text is readable by screen readers

## Key Files to Create

| File | Purpose |
|------|---------|
| `tests/unit/suggest-next-action.test.ts` | Unit tests for suggestion logic |

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- ES2020 JavaScript
- CSS Custom Properties
- Clipboard API (for copy functionality)
