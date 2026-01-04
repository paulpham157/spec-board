# Implementation Plan: Quick Keyboard Shortcuts

**Branch**: `005-quick-shortcut` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-quick-shortcut/spec.md`

## Summary

Implement a comprehensive keyboard shortcut system for SpecBoard that enables users to navigate views, perform card actions, and discover shortcuts via a help overlay. This feature directly fulfills Constitution Principle IV (Accessibility) which mandates keyboard navigation for all features.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode)
**Primary Dependencies**: Next.js 16.x, React 19.x, Zustand 5.x
**Storage**: N/A (shortcuts are static configuration, focus state in Zustand)
**Testing**: vitest (unit tests for shortcut handlers)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Shortcut response < 50ms, no perceptible delay
**Constraints**: Must not conflict with browser shortcuts, must disable in input fields
**Scale/Scope**: ~15-20 shortcuts across 3 categories (navigation, actions, help)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven Visualization | Feature visualizes spec-kit projects | N/A - UX enhancement |
| II. Type Safety | All code in TypeScript strict mode | PASS - Typed shortcut definitions |
| III. Security First | Validate inputs, sanitize outputs | PASS - No user input, no external data |
| IV. Accessibility | ARIA labels, keyboard nav, screen reader | PASS - This IS the keyboard nav requirement |
| V. Clean URL Architecture | URLs use database slugs | N/A - No URL changes |
| VI. Component Simplicity | Single responsibility, one component per file | PASS - Focused components |

**Gate Status**: PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/005-quick-shortcut/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - No API contracts needed
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── shortcut-help-overlay.tsx    # NEW: Help overlay modal (FR-003)
│   └── kanban-board.tsx             # MODIFY: Add arrow key navigation (FR-007)
├── lib/
│   ├── shortcuts/
│   │   ├── index.ts                 # NEW: Shortcut registry and types
│   │   ├── use-shortcuts.ts         # NEW: Global shortcut hook
│   │   └── shortcut-config.ts       # NEW: Shortcut definitions
│   ├── accessibility/
│   │   └── index.ts                 # EXISTING: announce(), useFocusTrap
│   └── store.ts                     # MODIFY: Add focus state tracking (FR-008)
├── app/
│   └── shortcuts/
│       └── page.tsx                 # MODIFY: Make dynamic from shortcut-config
└── types/
    └── index.ts                     # MODIFY: Add Shortcut types

tests/
├── unit/
│   └── shortcuts/
│       ├── use-shortcuts.test.ts    # Hook tests
│       └── shortcut-config.test.ts  # Config validation tests
└── integration/
    └── keyboard-navigation.test.ts  # E2E keyboard flow tests
```

**Structure Decision**: Single web application structure. New `lib/shortcuts/` module encapsulates all shortcut logic. Follows existing patterns in `lib/accessibility/`.

## Complexity Tracking

No violations - design follows existing patterns and Constitution principles.
