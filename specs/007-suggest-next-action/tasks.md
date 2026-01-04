# Tasks: Suggest Next Action

**Input**: Design documents from `/specs/007-suggest-next-action/`
**Prerequisites**: spec.md (user stories), research.md (existing code analysis), data-model.md (type definitions), quickstart.md (implementation guide)

**Tests**: Unit tests included as this is a logic-heavy feature where testing ensures accuracy.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` at repository root (Next.js App Router structure)
- Tests in `tests/unit/`

---

## Phase 1: Setup

**Purpose**: Prepare development environment and verify existing infrastructure

- [x] T001 Verify development environment with `pnpm install && pnpm dev`
- [x] T002 [P] Review existing `getSuggestedCommand()` function in src/lib/utils.ts
- [x] T003 [P] Review existing `SuggestedCommandCard` component in src/components/feature-detail/suggested-command-card.tsx

---

## Phase 2: Foundational (Type Enhancement)

**Purpose**: Extend types to support reason field - MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `reason` field to `SuggestedCommand` interface in src/lib/utils.ts
- [x] T005 Update all return statements in `getSuggestedCommand()` to include `reason` field in src/lib/utils.ts

**Checkpoint**: Type enhancement complete - user story implementation can now begin

---

## Phase 3: User Story 1 - View Suggested Next Action (Priority: P1) 🎯 MVP

**Goal**: Display appropriate next action suggestions based on feature state

**Independent Test**: View any feature card and verify appropriate suggestion appears based on feature state

### Tests for User Story 1

- [x] T006 [P] [US1] Create unit test file for suggestion logic in tests/unit/suggest-next-action.test.ts
- [x] T007 [P] [US1] Add test case: no constitution → suggests /speckit.constitution in tests/unit/suggest-next-action.test.ts
- [x] T008 [P] [US1] Add test case: no spec → suggests /speckit.specify in tests/unit/suggest-next-action.test.ts
- [x] T009 [P] [US1] Add test case: has spec, no plan → suggests /speckit.plan in tests/unit/suggest-next-action.test.ts
- [x] T010 [P] [US1] Add test case: has plan, no tasks → suggests /speckit.tasks in tests/unit/suggest-next-action.test.ts
- [x] T011 [P] [US1] Add test case: incomplete tasks → suggests /speckit.implement in tests/unit/suggest-next-action.test.ts
- [x] T012 [P] [US1] Add test case: all tasks complete → suggests /speckit.analyze or null in tests/unit/suggest-next-action.test.ts

### Implementation for User Story 1

- [x] T013 [US1] Update reason for "no constitution" case in src/lib/utils.ts
- [x] T014 [US1] Update reason for "no spec" case in src/lib/utils.ts
- [x] T015 [US1] Update reason for "has spec, no plan" case in src/lib/utils.ts
- [x] T016 [US1] Update reason for "has plan, no tasks" case in src/lib/utils.ts
- [x] T017 [US1] Update reason for "incomplete tasks" case with task count in src/lib/utils.ts
- [x] T018 [US1] Update reason for "complete" case in src/lib/utils.ts
- [x] T019 [US1] Run tests to verify all suggestion logic works: `pnpm test`

**Checkpoint**: User Story 1 complete - suggestions display correct next action for all states

---

## Phase 4: User Story 2 - Understand Why Action is Suggested (Priority: P2)

**Goal**: Display explanation text for why each action is suggested

**Independent Test**: View any suggested action and verify brief explanation is visible

### Tests for User Story 2

- [x] T020 [P] [US2] Add test case: reason text is non-empty for all suggestion states in tests/unit/suggest-next-action.test.ts
- [x] T021 [P] [US2] Add test case: reason mentions specific missing item (e.g., "spec.md") in tests/unit/suggest-next-action.test.ts

### Implementation for User Story 2

- [x] T022 [US2] Add reason display element to CommandCard component in src/components/feature-detail/suggested-command-card.tsx
- [x] T023 [US2] Style reason text with italic, muted color in src/components/feature-detail/suggested-command-card.tsx
- [x] T024 [US2] Add ARIA label for reason text for accessibility in src/components/feature-detail/suggested-command-card.tsx
- [x] T025 [US2] Verify reason displays correctly in feature detail modal

**Checkpoint**: User Story 2 complete - users can see WHY each action is suggested

---

## Phase 5: User Story 3 - Take Action from Suggestion (Priority: P3)

**Goal**: Add suggestion indicator to Kanban cards for at-a-glance visibility

**Independent Test**: View Kanban board and verify suggestion indicator appears on feature cards

### Implementation for User Story 3

- [x] T026 [US3] Import Lightbulb icon from lucide-react in src/components/kanban-board.tsx
- [x] T027 [US3] Import getSuggestedCommand function in src/components/kanban-board.tsx
- [x] T028 [US3] Add suggestion indicator (Lightbulb icon) to feature card in src/components/kanban-board.tsx
- [x] T029 [US3] Add ARIA label "Next action available" to indicator in src/components/kanban-board.tsx
- [x] T030 [US3] Style indicator with amber color to match suggestion theme in src/components/kanban-board.tsx
- [x] T031 [US3] Verify indicator appears on Kanban cards with pending actions

**Checkpoint**: User Story 3 complete - users can see at-a-glance which features have suggested actions

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T032 Run full test suite: `pnpm test`
- [x] T033 Run linter: `pnpm lint`
- [x] T034 Run build to verify no TypeScript errors: `pnpm build`
- [x] T035 Manual verification: test all feature states in browser
- [x] T036 [P] Verify accessibility: screen reader announces reason text

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 can start immediately after Phase 2
  - US2 can start after Phase 2 (independent of US1)
  - US3 can start after Phase 2 (independent of US1, US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational - Independent of US1, US2

### Within Each User Story

- Tests written first (T006-T012, T020-T021)
- Implementation follows tests
- Verification at checkpoint

### Parallel Opportunities

- T002, T003 can run in parallel (reviewing existing code)
- T006-T012 can run in parallel (all test cases)
- T020-T021 can run in parallel (US2 test cases)
- All three user stories can be worked on in parallel after Phase 2

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all test case tasks together:
Task: "Add test case: no constitution → suggests /speckit.constitution"
Task: "Add test case: no spec → suggests /speckit.specify"
Task: "Add test case: has spec, no plan → suggests /speckit.plan"
Task: "Add test case: has plan, no tasks → suggests /speckit.tasks"
Task: "Add test case: incomplete tasks → suggests /speckit.implement"
Task: "Add test case: all tasks complete → suggests /speckit.analyze or null"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (type enhancement)
3. Complete Phase 3: User Story 1 (core suggestion logic with reasons)
4. **STOP and VALIDATE**: Test all feature states
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Types ready
2. Add User Story 1 → Test independently → Core suggestions work (MVP!)
3. Add User Story 2 → Test independently → Reason text visible
4. Add User Story 3 → Test independently → Kanban indicators work
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Existing infrastructure: `getSuggestedCommand()` already handles workflow logic
- Main changes: Add `reason` field, display it in UI, add Kanban indicator
- Total estimated tasks: 36
- Parallel opportunities: 15 tasks can run in parallel
