# Tasks: Theme Switcher

**Input**: Design documents from `/specs/004-theme-switcher/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Component**: `src/components/theme-toggle.tsx`
- **Utilities**: `src/lib/theme.ts`
- **Store**: `src/lib/store.ts`
- **Types**: `src/types/index.ts`
- **Layout**: `src/app/layout.tsx`
- **Styles**: `src/app/globals.css`
- **FOUC Script**: `public/theme-init.js`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Verify prerequisites and prepare project structure

- [x] T001 Verify existing Zustand store exists in src/lib/store.ts
- [x] T002 [P] Verify src/types/index.ts exists for type definitions
- [x] T003 [P] Verify src/app/globals.css exists for CSS variables
- [x] T004 [P] Verify src/app/layout.tsx exists for layout integration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared types and utilities needed by all user stories

**CRITICAL**: These tasks must complete before user story implementation

- [x] T005 Add Theme and ResolvedTheme types to src/types/index.ts
- [x] T006 Create src/lib/theme.ts with getSystemTheme() and resolveTheme() functions
- [x] T007 Add dark theme CSS variables to src/app/globals.css ([data-theme="dark"] selector)
- [x] T008 Add theme transition styles to src/app/globals.css (150ms ease-in-out)

**Checkpoint**: Foundation complete - user story implementation can begin

---

## Phase 3: User Story 1 - Switch Between Themes (Priority: P1)

**Goal**: Users can switch between light and dark themes with immediate visual feedback

**Independent Test**: Click the theme toggle and verify UI colors change appropriately

### Implementation for User Story 1

- [x] T009 [US1] Create ThemeToggle component skeleton in src/components/theme-toggle.tsx
- [x] T010 [US1] Implement theme cycling logic (Light → Dark → System → Light) in src/components/theme-toggle.tsx
- [x] T011 [P] [US1] Add theme icons (sun, moon, monitor) to ThemeToggle in src/components/theme-toggle.tsx
- [x] T012 [P] [US1] Add aria-label for accessibility in src/components/theme-toggle.tsx
- [x] T013 [US1] Add setTheme() function to src/lib/theme.ts (applies data-theme attribute to document)
- [x] T014 [US1] Extend Zustand store with theme state (theme, resolvedTheme, setTheme) in src/lib/store.ts
- [x] T015 [US1] Connect ThemeToggle to Zustand store in src/components/theme-toggle.tsx
- [x] T016 [US1] Add ThemeToggle to layout in src/app/layout.tsx
- [x] T017 [US1] Verify theme changes apply to all UI components (background, text, cards, borders)

**Checkpoint**: User Story 1 complete - theme switching works

---

## Phase 4: User Story 2 - Persist Theme Preference (Priority: P2)

**Goal**: Theme preference persists across browser sessions via localStorage

**Independent Test**: Select a theme, close browser, reopen and verify theme persists

### Implementation for User Story 2

- [x] T018 [US2] Add getTheme() function with localStorage read in src/lib/theme.ts
- [x] T019 [US2] Update setTheme() to persist to localStorage in src/lib/theme.ts
- [x] T020 [US2] Add localStorage error handling (graceful fallback) in src/lib/theme.ts
- [x] T021 [US2] Initialize store theme from localStorage on app load in src/lib/store.ts
- [x] T022 [US2] Verify theme persists after page refresh
- [x] T023 [US2] Verify clearing localStorage resets to system default

**Checkpoint**: User Story 2 complete - persistence works

---

## Phase 5: User Story 3 - Follow System Preference (Priority: P3)

**Goal**: "System" option follows OS theme preference and updates in real-time

**Independent Test**: Set theme to "system", change OS theme, verify app updates

### Implementation for User Story 3

- [x] T024 [US3] Create FOUC prevention script in public/theme-init.js
- [x] T025 [US3] Add Script component with beforeInteractive strategy to src/app/layout.tsx
- [x] T026 [US3] Add matchMedia listener for system theme changes in src/components/theme-toggle.tsx
- [x] T027 [US3] Update resolvedTheme when system preference changes in src/lib/store.ts
- [x] T028 [US3] Verify no FOUC on page load (theme applied before render)
- [x] T029 [US3] Verify system theme option responds to OS preference changes in real-time
- [x] T030 [US3] Handle edge case: browser doesn't support matchMedia (fallback to light)

**Checkpoint**: User Story 3 complete - system preference works

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and accessibility compliance

- [x] T031 [P] Verify keyboard navigation works on ThemeToggle (Enter/Space activation)
- [x] T032 [P] Verify WCAG 2.1 AA contrast ratios in light theme (4.5:1 normal text, 3:1 large text)
- [x] T033 [P] Verify WCAG 2.1 AA contrast ratios in dark theme (4.5:1 normal text, 3:1 large text)
- [x] T034 Verify theme changes apply within 300ms (performance requirement)
- [x] T035 Run full test suite: `pnpm test`
- [x] T036 Update quickstart.md verification checklist with completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 builds on US1 (persistence requires switching)
  - US3 builds on US2 (FOUC prevention requires persistence)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational)
    │
    ▼
Phase 3 (US1: Switch Themes) ─── MVP COMPLETE
    │
    ▼
Phase 4 (US2: Persistence)
    │
    ▼
Phase 5 (US3: System Preference)
    │
    ▼
Phase 6 (Polish)
```

### Parallel Opportunities

- Setup tasks (T001-T004) can run in parallel
- Within US1: T011 and T012 can run in parallel (different concerns)
- Within Polish: T031-T033 can run in parallel (independent verifications)

---

## Parallel Example: Setup Phase

```bash
# Launch all setup verification tasks together:
Task: "Verify existing Zustand store exists in src/lib/store.ts"
Task: "Verify src/types/index.ts exists for type definitions"
Task: "Verify src/app/globals.css exists for CSS variables"
Task: "Verify src/app/layout.tsx exists for layout integration"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verification)
2. Complete Phase 2: Foundational (types, utilities, CSS)
3. Complete Phase 3: User Story 1 (theme switching)
4. **STOP and VALIDATE**: Theme toggle works, colors change
5. Ship MVP if needed

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Theme switching works (MVP)
3. User Story 2 → Persistence works
4. User Story 3 → System preference works
5. Polish → Accessibility verified
6. Each story is independently testable

---

## Requirement Traceability

| Requirement | Task(s) | User Story |
|-------------|---------|------------|
| FR-001 (three theme options) | T010 | US1 |
| FR-002 (immediate apply) | T013, T014, T015 | US1 |
| FR-003 (persist preference) | T018, T019, T021 | US2 |
| FR-004 (system preference) | T026, T027, T029 | US3 |
| FR-005 (consistent theme) | T007, T017 | US1 |
| FR-006 (visible toggle) | T009, T016 | US1 |
| FR-007 (no FOUC) | T024, T025, T028 | US3 |
| FR-008 (WCAG contrast) | T032, T033 | Polish |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- MVP scope = Phase 1 + Phase 2 + Phase 3 (User Story 1)
- Run `pnpm test` to verify implementation
- All tasks reference specific file paths
- Commit after each phase completion
