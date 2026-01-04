# Tasks: Checklists Interaction

**Input**: Design documents from `/specs/009-checklists-interaction/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/checklist-api.yaml, quickstart.md

**Tests**: No explicit test requirements in spec. Unit tests included for core utility functions only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Next.js App Router (single project)
- **Source**: `src/` at repository root
- **Tests**: `tests/` at repository root (following existing pattern)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new types and utility module structure

- [ ] T001 [P] Add ChecklistToggleRequest and ChecklistToggleResponse types in src/types/index.ts
- [ ] T002 [P] Create checklist-utils.ts module skeleton in src/lib/checklist-utils.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement toggleCheckboxLine() function in src/lib/checklist-utils.ts (regex-based line replacement)
- [ ] T004 Implement getCheckboxState() function in src/lib/checklist-utils.ts (read current state from line)
- [ ] T005 Implement isValidCheckboxLine() function in src/lib/checklist-utils.ts (validate line format)
- [ ] T006 [P] Create unit tests for checklist-utils in tests/lib/checklist-utils.test.ts
- [ ] T007 Create PATCH endpoint skeleton in src/app/api/checklist/route.ts with path validation
- [ ] T008 Implement file read/write logic in src/app/api/checklist/route.ts with conflict detection
- [ ] T009 Update parseChecklistContent() in src/components/checklist-viewer.tsx to track lineIndex for each item

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Toggle Checklist Items (Priority: P1) 🎯 MVP

**Goal**: Users can click checklist items to toggle checked/unchecked state with persistence to markdown files

**Independent Test**: Click any checkbox item → visual state changes immediately → verify markdown file updated

### Implementation for User Story 1

- [ ] T010 [US1] Add ChecklistItem interface with lineIndex property in src/components/checklist-viewer.tsx
- [ ] T011 [US1] Add filePath prop to ChecklistViewer component in src/components/checklist-viewer.tsx
- [ ] T012 [US1] Implement onToggle callback prop in ChecklistItemRow component in src/components/checklist-viewer.tsx
- [ ] T013 [US1] Add onClick handler to checkbox icon/row in ChecklistItemRow in src/components/checklist-viewer.tsx
- [ ] T014 [US1] Implement optimistic state update with useState in ChecklistContent component in src/components/checklist-viewer.tsx
- [ ] T015 [US1] Implement API call to PATCH /api/checklist in src/components/checklist-viewer.tsx
- [ ] T016 [US1] Implement rollback on API failure with error display in src/components/checklist-viewer.tsx
- [ ] T017 [US1] Pass filePath from parent component (feature-detail) to ChecklistViewer

**Checkpoint**: User Story 1 complete - users can toggle items with click and changes persist

---

## Phase 4: User Story 2 - Keyboard Accessibility (Priority: P2)

**Goal**: Users can toggle checklist items using keyboard (Tab to focus, Space/Enter to toggle)

**Independent Test**: Tab to checkbox → press Space or Enter → item toggles state

### Implementation for User Story 2

- [ ] T018 [US2] Add tabIndex={0} to ChecklistItemRow in src/components/checklist-viewer.tsx
- [ ] T019 [US2] Add role="checkbox" and aria-checked attributes in src/components/checklist-viewer.tsx
- [ ] T020 [US2] Add aria-label with item text and state in src/components/checklist-viewer.tsx
- [ ] T021 [US2] Implement onKeyDown handler for Space and Enter keys in src/components/checklist-viewer.tsx
- [ ] T022 [US2] Add focus ring styles (focus:ring-2) to ChecklistItemRow in src/components/checklist-viewer.tsx

**Checkpoint**: User Story 2 complete - full keyboard accessibility

---

## Phase 5: User Story 3 - Visual Feedback During Save (Priority: P3)

**Goal**: Users see loading indicator while save is in progress, with clear success/failure feedback

**Independent Test**: Toggle item → see brief loading state → see final confirmed state (or error message)

### Implementation for User Story 3

- [ ] T023 [US3] Add savingItems state (Set<string>) to track items being saved in src/components/checklist-viewer.tsx
- [ ] T024 [US3] Add Loader2 icon import from lucide-react in src/components/checklist-viewer.tsx
- [ ] T025 [US3] Show spinning loader icon when item is in savingItems set in src/components/checklist-viewer.tsx
- [ ] T026 [US3] Add opacity-50 and pointer-events-none styles during save in src/components/checklist-viewer.tsx
- [ ] T027 [US3] Add error toast/notification component for save failures in src/components/checklist-viewer.tsx
- [ ] T028 [US3] Clear item from savingItems on success or failure in src/components/checklist-viewer.tsx

**Checkpoint**: User Story 3 complete - clear visual feedback during save operations

---

## Phase 6: User Story 4 - Progress Updates on Toggle (Priority: P4)

**Goal**: Section and overall progress indicators update immediately when items are toggled

**Independent Test**: Toggle item → section progress (e.g., "3/5" → "4/5") updates → overall progress updates

### Implementation for User Story 4

- [ ] T029 [US4] Refactor progress calculation to use local state in ChecklistSectionView in src/components/checklist-viewer.tsx
- [ ] T030 [US4] Lift checklist items state to ChecklistContent component in src/components/checklist-viewer.tsx
- [ ] T031 [US4] Update section progress bar when items state changes in src/components/checklist-viewer.tsx
- [ ] T032 [US4] Update overall progress indicator when items state changes in src/components/checklist-viewer.tsx
- [ ] T033 [US4] Ensure progress recalculates on optimistic update (before API response) in src/components/checklist-viewer.tsx

**Checkpoint**: User Story 4 complete - progress indicators update in real-time

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, debouncing, and final refinements

- [ ] T034 [P] Implement per-item debouncing (300ms) using useRef Map in src/components/checklist-viewer.tsx
- [ ] T035 [P] Add cursor-pointer style to interactive checkbox rows in src/components/checklist-viewer.tsx
- [ ] T036 Handle conflict response (409) by refreshing checklist content in src/components/checklist-viewer.tsx
- [ ] T037 Add screen reader announcement on toggle using aria-live region in src/components/checklist-viewer.tsx
- [ ] T038 Run quickstart.md verification checklist manually
- [ ] T039 Run pnpm lint and fix any linting errors
- [ ] T040 Run pnpm test and ensure all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Phase 2
  - US2 (P2): Can start after Phase 2 (independent of US1)
  - US3 (P3): Depends on US1 (needs toggle mechanism)
  - US4 (P4): Depends on US1 (needs state management)
- **Polish (Phase 7)**: Depends on US1-US4 completion

### User Story Dependencies

```
Phase 2 (Foundational)
       │
       ▼
   ┌───┴───┐
   │       │
   ▼       ▼
  US1     US2  (can run in parallel)
   │
   ├───────┬───────┐
   ▼       ▼       ▼
  US3     US4   Polish
```

- **User Story 1 (P1)**: No dependencies on other stories - MVP
- **User Story 2 (P2)**: No dependencies on other stories - can parallel with US1
- **User Story 3 (P3)**: Depends on US1 (needs toggle handler to add loading state)
- **User Story 4 (P4)**: Depends on US1 (needs state management pattern)

### Within Each User Story

- Core implementation before integration
- State management before UI updates
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T001 (types) ─┬─ parallel
T002 (utils) ─┘
```

**Phase 2 (Foundational)**:
```
T003 (toggleCheckboxLine) ──┐
T004 (getCheckboxState)  ───┼─ sequential (T003 first)
T005 (isValidCheckboxLine) ─┘
T006 (tests) ─── parallel with T007-T009
T007-T009 ─── sequential (API depends on utils)
```

**Phase 3-4 (US1 + US2)**:
```
US1 tasks ─┬─ can run in parallel
US2 tasks ─┘  (different concerns, same file but different sections)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch both setup tasks together:
Task: "Add ChecklistToggleRequest and ChecklistToggleResponse types in src/types/index.ts"
Task: "Create checklist-utils.ts module skeleton in src/lib/checklist-utils.ts"
```

## Parallel Example: US1 + US2

```bash
# After Phase 2, launch US1 and US2 in parallel:
# Developer A: US1 tasks (T010-T017)
# Developer B: US2 tasks (T018-T022)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T009)
3. Complete Phase 3: User Story 1 (T010-T017)
4. **STOP and VALIDATE**: Test clicking checkboxes, verify file persistence
5. Deploy/demo if ready - core functionality complete!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Click to toggle works → **MVP!**
3. Add User Story 2 → Keyboard accessibility → Deploy
4. Add User Story 3 → Loading indicators → Deploy
5. Add User Story 4 → Progress updates → Deploy
6. Polish → Debouncing, edge cases → Final release

### Suggested MVP Scope

**Minimum viable**: Phase 1 + Phase 2 + Phase 3 (User Story 1)
- Total tasks: 17 tasks
- Delivers: Click-to-toggle with persistence
- Value: Users can interact with checklists without editing files

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 2 | Types and module skeleton |
| Phase 2: Foundational | 7 | Core utils, API, parser update |
| Phase 3: US1 (P1) | 8 | Click toggle with persistence |
| Phase 4: US2 (P2) | 5 | Keyboard accessibility |
| Phase 5: US3 (P3) | 6 | Loading indicators |
| Phase 6: US4 (P4) | 5 | Progress updates |
| Phase 7: Polish | 7 | Debouncing, edge cases, validation |
| **Total** | **40** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Primary file modified: src/components/checklist-viewer.tsx
- New files: src/lib/checklist-utils.ts, src/app/api/checklist/route.ts, tests/lib/checklist-utils.test.ts
