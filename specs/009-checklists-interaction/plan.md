# Implementation Plan: Checklists Interaction

**Branch**: `009-checklists-interaction` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-checklists-interaction/spec.md`

## Summary

Enable users to toggle checklist items directly in the SpecBoard dashboard by clicking or using keyboard controls. Changes persist to the underlying markdown files with optimistic UI updates, loading indicators, and automatic progress recalculation. This follows the precedent established by feature 006-save-analyze-results for file writing operations.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode)
**Primary Dependencies**: Next.js 16.x, React 19.x, Lucide React (icons)
**Storage**: Filesystem (markdown files in `specs/<feature>/checklists/*.md`)
**Testing**: Vitest (unit tests), existing test patterns
**Target Platform**: Web browser (desktop-first, 1024px+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: <100ms optimistic UI update, <2s file persistence
**Constraints**: Debounce rapid toggles (300ms), handle file conflicts gracefully
**Scale/Scope**: Single user per session, ~50 checklist items per feature max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven Visualization | "MUST NOT modify source files" | ⚠️ JUSTIFIED |
| II. Type Safety | No `any` types, strict mode | ✅ PASS |
| III. Security First | Path validation, input sanitization | ✅ PASS |
| IV. Accessibility | ARIA labels, keyboard navigation | ✅ PASS |
| V. Clean URL Architecture | N/A (no new routes) | ✅ PASS |
| VI. Component Simplicity | Single responsibility | ✅ PASS |

**Justification for Principle I Violation:**

The constitution states the dashboard "MUST NOT modify source files" - this refers to core spec-kit workflow files (spec.md, plan.md, tasks.md). However:

1. **Precedent**: Feature 006-save-analyze-results establishes that auxiliary files (analysis reports) can be written
2. **Checklists are auxiliary**: They track progress/quality, not core specification content
3. **User intent**: Checklists are explicitly designed to be toggled (checkbox syntax `- [ ]` / `- [x]`)
4. **No spec corruption**: Toggle operations only change checkbox state, preserving all other content

This is a **controlled exception** for progress-tracking files, not a violation of the core principle.

## Project Structure

### Documentation (this feature)

```text
specs/009-checklists-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── checklist-api.yaml
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── checklist/
│           └── route.ts          # NEW: PATCH endpoint for toggling items
├── components/
│   └── checklist-viewer.tsx      # MODIFY: Add toggle handlers, loading states
├── lib/
│   └── checklist-utils.ts        # NEW: Toggle logic, markdown manipulation
└── types/
    └── index.ts                  # MODIFY: Add ChecklistToggleRequest type

tests/
└── lib/
    └── checklist-utils.test.ts   # NEW: Unit tests for toggle logic
```

**Structure Decision**: Follows existing Next.js App Router structure. New API endpoint at `/api/checklist` for PATCH operations. Utility functions extracted to `lib/checklist-utils.ts` for testability.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| File write from dashboard | Core feature requirement - users need to toggle checklists without leaving the app | Read-only display doesn't meet user needs; manual file editing breaks workflow |
