# Implementation Plan: Theme Switcher

**Branch**: `004-theme-switcher` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-theme-switcher/spec.md`

## Summary

The Theme Switcher provides users with three theme options (Light, Dark, System) for visual customization. The feature uses CSS variables for theming, localStorage for persistence, and the `prefers-color-scheme` media query for system preference detection. Theme changes apply immediately without page reload, and FOUC is prevented via an inline script in the document head.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode)
**Primary Dependencies**: React 19.x, Next.js 16.x (App Router), Tailwind CSS 4.x, Zustand 5.x
**Storage**: localStorage (browser-side persistence)
**Testing**: Vitest (`pnpm test`)
**Target Platform**: Web browser (desktop and mobile)
**Project Type**: Web application (Next.js)
**Performance Goals**: Theme changes apply within 300ms, no FOUC on page load
**Constraints**: Must maintain WCAG 2.1 AA contrast ratios in both themes
**Scale/Scope**: Single-page application, affects all UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-Driven Visualization | ✅ PASS | Theme switcher is a UI enhancement; does not modify spec files |
| II. Type Safety | ✅ PASS | Theme type will be defined as union type `'light' | 'dark' | 'system'` in `src/types/index.ts` |
| III. Security First | ✅ PASS | No user input beyond theme selection; localStorage is sandboxed per origin |
| IV. Accessibility | ✅ PASS | Theme toggle will have ARIA labels; both themes meet WCAG 2.1 AA contrast |
| V. Clean URL Architecture | ✅ PASS | Theme preference stored in localStorage, not URL |
| VI. Component Simplicity | ✅ PASS | Single `ThemeToggle` component with clear responsibility |

**Gate Result**: ✅ ALL PRINCIPLES SATISFIED

## Project Structure

### Documentation (this feature)

```text
specs/004-theme-switcher/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technology decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Developer guide
├── contracts/           # Component interface
│   └── component-interface.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── components/
│   └── theme-toggle.tsx     # Theme toggle UI component
├── lib/
│   ├── theme.ts             # Theme utilities (getTheme, setTheme, getSystemTheme)
│   └── store.ts             # Extend Zustand store with theme state
├── types/
│   └── index.ts             # Add Theme type
└── app/
    └── layout.tsx           # Add ThemeProvider and FOUC prevention script
```

**Structure Decision**: Single Next.js web application. The theme switcher integrates into the existing component structure with a new `ThemeToggle` component and theme utilities in `src/lib/theme.ts`.

## Complexity Tracking

> No constitution violations - section not applicable.
