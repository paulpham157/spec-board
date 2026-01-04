# Tasks: Quick Keyboard Shortcuts

**Input**: Design documents from `/specs/005-quick-shortcut/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` at repository root (Next.js App Router)
- Paths follow existing project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shortcuts module structure and type definitions

- [x] T001 Create shortcuts module directory at `src/lib/shortcuts/`
- [x] T002 [P] Add Shortcut types (Shortcut, ShortcutCategory, ShortcutContext, FocusState) to `src/types/index.ts`
- [x] T003 [P] Create shortcuts module index with exports in `src/lib/shortcuts/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shortcut infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `isEditableElement()` utility function in `src/lib/shortcuts/index.ts` (FR-004)
- [x] T005 Create shortcut configuration with all shortcut definitions in `src/lib/shortcuts/shortcut-config.ts`
- [x] T006 Implement `useShortcuts` hook with keyboard event handling in `src/lib/shortcuts/use-shortcuts.ts`
- [x] T007 Add FocusState to Zustand store (focusState, setFocusState, clearFocusState) in `src/lib/store.ts` (FR-008)
- [x] T008 Mount `useShortcuts` hook at application layout level in `src/app/layout.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Navigate Between Views Using Keyboard (Priority: P1) MVP

**Goal**: Enable users to navigate between views (Kanban board, feature details) using keyboard shortcuts without mouse

**Independent Test**: Press arrow keys on Kanban board to navigate between cards, press Enter to open feature detail, press Escape to go back

### Implementation for User Story 1

- [x] T009 [US1] Add keyboard focus state tracking to `KanbanBoard` component in `src/components/kanban-board.tsx`
- [x] T010 [US1] Implement arrow key navigation (up/down within column, left/right between columns) in `src/components/kanban-board.tsx` (FR-007)
- [x] T011 [US1] Add visual focus indicator for currently focused card in `src/components/kanban-board.tsx` (FR-005)
- [x] T012 [US1] Implement Enter key to open focused feature detail in `src/components/kanban-board.tsx`
- [x] T013 [US1] Implement Escape key to return to previous view / close modal in `src/lib/shortcuts/use-shortcuts.ts`
- [x] T014 [US1] Implement "g then h" sequence for go-to-home navigation in `src/lib/shortcuts/use-shortcuts.ts`
- [x] T015 [US1] Add screen reader announcements for navigation actions using `announce()` in `src/components/kanban-board.tsx`
- [x] T016 [US1] Restore focus position when returning to Kanban board from feature detail (FR-008) in `src/components/kanban-board.tsx`

**Checkpoint**: User Story 1 complete - users can navigate entirely by keyboard

---

## Phase 4: User Story 2 - Perform Common Actions via Keyboard (Priority: P2)

**Goal**: Enable users to perform card actions (move between columns) using keyboard shortcuts

**Independent Test**: Focus a card, press Shift+Right to move it to next column, press Shift+Left to move it back

### Implementation for User Story 2

- [x] T017 [US2] Implement Shift+Arrow shortcuts for moving cards between columns in `src/lib/shortcuts/use-shortcuts.ts` (FR-002)
- [x] T018 [US2] Add card movement handler that updates feature status in `src/components/kanban-board.tsx`
- [x] T019 [US2] Add visual feedback (highlight animation) when card is moved in `src/components/kanban-board.tsx` (FR-005)
- [x] T020 [US2] Add screen reader announcement when card is moved using `announce()` in `src/components/kanban-board.tsx`
- [x] T021 [US2] Handle edge case: show feedback when card cannot move (first/last column) in `src/components/kanban-board.tsx`

**Checkpoint**: User Story 2 complete - users can manage cards entirely by keyboard

---

## Phase 5: User Story 3 - Discover Available Shortcuts (Priority: P3)

**Goal**: Enable users to discover all available shortcuts via a help overlay triggered by "?" key

**Independent Test**: Press "?" anywhere in the app to see help overlay, press Escape to close it

### Implementation for User Story 3

- [x] T022 [P] [US3] Create `ShortcutHelpOverlay` component structure in `src/components/shortcut-help-overlay.tsx` (FR-003)
- [x] T023 [US3] Implement help overlay UI with shortcuts grouped by category in `src/components/shortcut-help-overlay.tsx`
- [x] T024 [US3] Add focus trap to help overlay using `useFocusTrap` in `src/components/shortcut-help-overlay.tsx`
- [x] T025 [US3] Implement "?" key to toggle help overlay in `src/lib/shortcuts/use-shortcuts.ts`
- [x] T026 [US3] Implement Escape key to close help overlay in `src/components/shortcut-help-overlay.tsx`
- [x] T027 [US3] Add ARIA labels and screen reader support to help overlay in `src/components/shortcut-help-overlay.tsx`
- [x] T028 [US3] Update existing `/shortcuts` page to use centralized shortcut config in `src/app/shortcuts/page.tsx`

**Checkpoint**: User Story 3 complete - users can discover all shortcuts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting all user stories

- [x] T029 Verify no browser shortcut conflicts (FR-006) - test Ctrl+T, Ctrl+W, etc. don't trigger app shortcuts
- [x] T030 Verify shortcuts are disabled in all input fields (FR-004) - test in search, forms, etc.
- [x] T031 Add CLAUDE.md documentation for shortcuts module in `src/lib/shortcuts/CLAUDE.md`
- [x] T032 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 and US3 can start in parallel after US1 if desired
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 focus state but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Completely independent of US1/US2

### Within Each User Story

- Core implementation before integration
- Visual feedback after core functionality
- Screen reader support after visual feedback

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- T022 can start in parallel with US1/US2 work (different component)
- All user stories can be worked on in parallel by different developers after Phase 2

---

## Parallel Example: Setup Phase

```bash
# Launch setup tasks in parallel:
Task: "Add Shortcut types to src/types/index.ts"
Task: "Create shortcuts module index in src/lib/shortcuts/index.ts"
```

## Parallel Example: User Story 3

```bash
# T022 can start while US1/US2 are in progress:
Task: "Create ShortcutHelpOverlay component in src/components/shortcut-help-overlay.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test keyboard navigation independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test navigation → Deploy/Demo (MVP!)
3. Add User Story 2 → Test card actions → Deploy/Demo
4. Add User Story 3 → Test help overlay → Deploy/Demo
5. Each story adds value without breaking previous stories

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers:
- Arrow key navigation on Kanban board
- Enter to open feature details
- Escape to go back
- Focus persistence when returning to board

Users can navigate the entire app without a mouse - core value delivered.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing accessibility utilities (`announce()`, `useFocusTrap`) should be reused
