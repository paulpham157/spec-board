# Tasks: Kanban Board

**Input**: Design documents from `/specs/001-kanban-board/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Note**: This feature documents an **existing implementation**. Tasks focus on verification and documentation completeness rather than new code implementation.

**Organization**: Tasks are grouped by user story to enable independent verification of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Component**: `src/components/kanban-board.tsx`
- **Utilities**: `src/lib/utils.ts`
- **Types**: `src/types/index.ts`
- **Tests**: `src/lib/utils.test.ts`
- **Accessibility**: `src/lib/accessibility/index.ts`

---

## Phase 1: Setup (Documentation Verification)

**Purpose**: Verify all spec documentation is complete and accurate

- [x] T001 [P] Verify spec.md matches existing implementation in src/components/kanban-board.tsx
- [x] T002 [P] Verify plan.md technical context matches package.json dependencies
- [x] T003 [P] Verify data-model.md entities match src/types/index.ts definitions
- [x] T004 [P] Verify contracts/component-interface.md matches actual component props

---

## Phase 2: Foundational (Code Verification)

**Purpose**: Verify core infrastructure exists and functions correctly

**⚠️ CRITICAL**: These verifications must pass before user story verification

- [x] T005 Verify KanbanColumn type exists in src/lib/utils.ts:49
- [x] T006 Verify getFeatureKanbanColumn() function exists in src/lib/utils.ts:75-106
- [x] T007 Verify getKanbanColumnLabel() function exists in src/lib/utils.ts:108
- [x] T008 Verify Feature type has all required fields in src/types/index.ts
- [x] T009 Run existing tests: `pnpm test src/lib/utils.test.ts`

**Checkpoint**: Foundation verified - user story verification can now begin

---

## Phase 3: User Story 1 - View Feature Pipeline (Priority: P1) 🎯 MVP

**Goal**: Verify features are correctly organized into four columns based on workflow state

**Independent Test**: Load a project with features in different stages and verify column assignment

### Verification for User Story 1

- [x] T010 [US1] Verify four columns render in src/components/kanban-board.tsx (Backlog, Planning, In Progress, Done)
- [x] T011 [US1] Verify COLUMNS array order in src/components/kanban-board.tsx:9
- [x] T012 [P] [US1] Test: Feature with no spec → Backlog column
- [x] T013 [P] [US1] Test: Feature with spec but no plan → Backlog column
- [x] T014 [P] [US1] Test: Feature with plan but no tasks → Planning column
- [x] T015 [P] [US1] Test: Feature with incomplete tasks → In Progress column
- [x] T016 [P] [US1] Test: Feature with all tasks/checklists complete → Done column
- [x] T017 [US1] Verify column headers display feature counts

**Checkpoint**: User Story 1 verified - column categorization works correctly

---

## Phase 4: User Story 2 - Track Task Progress (Priority: P2)

**Goal**: Verify task completion progress displays correctly on feature cards

**Independent Test**: View features with varying task completion rates

### Verification for User Story 2

- [x] T018 [US2] Verify FeatureCard displays task count (X/Y format) in src/components/kanban-board.tsx:33-131
- [x] T019 [US2] Verify progress percentage calculation in FeatureCard
- [x] T020 [P] [US2] Verify progress bar renders with correct width percentage
- [x] T021 [P] [US2] Verify getProgressColorStyle() returns gray for 0% in src/components/kanban-board.tsx:13-25
- [x] T022 [P] [US2] Verify getProgressColorStyle() returns warning color for 1-79%
- [x] T023 [P] [US2] Verify getProgressColorStyle() returns neon color for 80-99%
- [x] T024 [P] [US2] Verify getProgressColorStyle() returns success color for 100%
- [x] T025 [US2] Verify checklist progress displays when checklists exist

**Checkpoint**: User Story 2 verified - progress tracking displays correctly

---

## Phase 5: User Story 3 - Access Feature Details (Priority: P3)

**Goal**: Verify clicking feature cards opens detail view

**Independent Test**: Click a feature card and verify callback is invoked

### Verification for User Story 3

- [x] T026 [US3] Verify FeatureCard has onClick handler in src/components/kanban-board.tsx
- [x] T027 [US3] Verify onFeatureClick prop is called when card clicked
- [x] T028 [P] [US3] Verify Enter key activates card (keyboard handler)
- [x] T029 [P] [US3] Verify Space key activates card (keyboard handler)
- [x] T030 [US3] Verify card is rendered as button element for accessibility

**Checkpoint**: User Story 3 verified - feature detail access works

---

## Phase 6: User Story 4 - Navigate Board Accessibly (Priority: P4)

**Goal**: Verify keyboard and screen reader accessibility

**Independent Test**: Navigate board using keyboard only and screen reader

### Verification for User Story 4

- [x] T031 [US4] Verify screen reader summary exists with aria-live="polite" in src/components/kanban-board.tsx:159-205
- [x] T032 [US4] Verify columns have role="region" with aria-label
- [x] T033 [P] [US4] Verify feature lists have role="list" and role="listitem"
- [x] T034 [P] [US4] Verify FeatureCard has aria-label with feature name and status
- [x] T035 [US4] Verify announce() is called when opening feature details in src/lib/accessibility/index.ts
- [x] T036 [US4] Verify tab order is logical through all interactive elements

**Checkpoint**: User Story 4 verified - accessibility requirements met

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation updates

- [x] T037 [P] Verify all CSS variables used exist in theme (--foreground, --border, --card, etc.)
- [x] T038 [P] Verify empty column hints match spec in EmptyColumn component
- [x] T039 Update quickstart.md if any discrepancies found
- [x] T040 Run full test suite: `pnpm test`
- [x] T041 Mark all checklists as complete in specs/001-kanban-board/checklists/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all user stories being verified

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P4)**: Can start after Foundational - Independent of other stories

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel
- All Foundational tasks (T005-T008) can run in parallel, T009 after
- Column categorization tests (T012-T016) can run in parallel
- Progress color tests (T021-T024) can run in parallel
- Keyboard tests (T028-T029) can run in parallel
- Accessibility attribute tests (T033-T034) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all column categorization tests together:
Task: "Test: Feature with no spec → Backlog column"
Task: "Test: Feature with spec but no plan → Backlog column"
Task: "Test: Feature with plan but no tasks → Planning column"
Task: "Test: Feature with incomplete tasks → In Progress column"
Task: "Test: Feature with all tasks/checklists complete → Done column"
```

---

## Implementation Strategy

### Verification First (User Story 1 Only)

1. Complete Phase 1: Setup (documentation verification)
2. Complete Phase 2: Foundational (code verification)
3. Complete Phase 3: User Story 1 (column categorization)
4. **STOP and VALIDATE**: Run tests, verify all scenarios
5. Document any discrepancies found

### Incremental Verification

1. Complete Setup + Foundational → Foundation verified
2. Verify User Story 1 → Column categorization confirmed
3. Verify User Story 2 → Progress tracking confirmed
4. Verify User Story 3 → Click handling confirmed
5. Verify User Story 4 → Accessibility confirmed
6. Each story verification is independent

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a **verification** task list for existing code, not new implementation
- Run `pnpm test src/lib/utils.test.ts` to verify column categorization logic
- All tasks reference specific file paths and line numbers where applicable
- Commit documentation updates after each phase verification
