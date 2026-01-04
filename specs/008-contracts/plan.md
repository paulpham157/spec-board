# Implementation Plan: Enhanced Contracts Viewer

**Branch**: `008-contracts` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-contracts/spec.md`

## Summary

Enhance the existing `contracts-viewer.tsx` component to provide syntax highlighting for code blocks, structured metadata display, section navigation, and copy-to-clipboard functionality for spec-kit API/component interface contracts.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode)
**Primary Dependencies**: Next.js 16.x, React 19.x, Tailwind CSS 4.x, Lucide React, DOMPurify, remark/remark-gfm/remark-html (existing), Prism.js or Shiki (new - for syntax highlighting)
**Storage**: N/A (contracts are read from filesystem via existing parser)
**Testing**: Vitest (existing test framework)
**Target Platform**: Web browser (Next.js App Router)
**Project Type**: Web application (existing Next.js project)
**Performance Goals**: Syntax highlighting renders in <100ms, copy-to-clipboard in <1s
**Constraints**: Must work in both light and dark themes, must sanitize all content via DOMPurify
**Scale/Scope**: Enhancement to single component, affects contracts/ directory viewing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven Visualization | Feature visualizes spec-kit contracts (read-only) | PASS |
| II. Type Safety | All code in TypeScript strict mode, no `any` types | PASS (will enforce) |
| III. Security First | DOMPurify for all rendered content | PASS (already required) |
| IV. Accessibility | ARIA labels, keyboard navigation for copy buttons | PASS (will implement) |
| V. Clean URL Architecture | N/A (no new routes) | N/A |
| VI. Component Simplicity | Single responsibility per component | PASS (will follow) |

**Gate Status**: PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/008-contracts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── contracts-viewer.tsx      # MODIFY: Main component to enhance
│   ├── code-block.tsx            # NEW: Syntax-highlighted code block with copy
│   └── markdown-renderer.tsx     # REFERENCE: Existing markdown rendering
├── lib/
│   ├── markdown/
│   │   └── contract-parser.ts    # NEW: Contract metadata/section parser
│   └── utils.ts                  # REFERENCE: Existing utilities
└── types/
    └── index.ts                  # MODIFY: Add contract-specific types

tests/
├── unit/
│   └── contract-parser.test.ts   # NEW: Parser unit tests
└── integration/
    └── contracts-viewer.test.tsx # NEW: Component integration tests
```

**Structure Decision**: Enhancing existing web application structure. New files follow existing patterns in `src/components/` and `src/lib/markdown/`.

## Complexity Tracking

> No violations to justify - feature follows existing patterns.
