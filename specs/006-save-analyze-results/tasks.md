# Tasks: Save Analyze Results

**Input**: Design documents from `/specs/006-save-analyze-results/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the spec. Only manual testing scenarios are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js)**: `src/` at repository root
- API routes: `src/app/api/`
- Components: `src/components/`
- Types: `src/types/`
- Utilities: `src/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and parser updates that all user stories depend on

- [x] T001 [P] Add `AnalysisReport` interface to src/types/index.ts
- [x] T002 [P] Update `FeatureAnalysis` interface with `reports` array in src/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update `parseAnalysis()` function to read multiple `*-analysis.md` files in src/lib/parser.ts
- [x] T004 Add timestamp extraction helper function `extractTimestampFromFilename()` in src/lib/parser.ts
- [x] T005 Update `parseAnalysis()` to sort reports by filename (newest first) in src/lib/parser.ts
- [x] T006 Ensure backwards compatibility: populate `markdownContent` and `markdownPath` from latest report in src/lib/parser.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Save Analysis Report (Priority: P1) 🎯 MVP

**Goal**: Enable users to save analysis reports from the dashboard to timestamped files

**Independent Test**: Trigger save action with analysis content, verify file created in `specs/<feature>/analysis/YYYY-MM-DD-HH-mm-analysis.md`

### Implementation for User Story 1

- [x] T007 [US1] Create API route file src/app/api/analysis/route.ts with POST handler skeleton
- [x] T008 [US1] Implement `generateAnalysisFilename()` helper function in src/app/api/analysis/route.ts
- [x] T009 [US1] Implement path validation using `isPathSafe()` in POST handler in src/app/api/analysis/route.ts
- [x] T010 [US1] Implement content validation (non-empty, max 1MB) in POST handler in src/app/api/analysis/route.ts
- [x] T011 [US1] Implement directory creation (`analysis/` folder) if not exists in src/app/api/analysis/route.ts
- [x] T012 [US1] Implement file write operation with proper error handling in src/app/api/analysis/route.ts
- [x] T013 [P] [US1] Create `AnalysisSaveModal` component file src/components/analysis-save-modal.tsx
- [x] T014 [US1] Implement modal UI with textarea for content input in src/components/analysis-save-modal.tsx
- [x] T015 [US1] Implement save button with loading state and API call in src/components/analysis-save-modal.tsx
- [x] T016 [US1] Add focus trap and keyboard handling (Escape to close) in src/components/analysis-save-modal.tsx
- [x] T017 [US1] Add ARIA labels for accessibility in src/components/analysis-save-modal.tsx
- [x] T018 [US1] Add "Save Analysis" button to `AnalysisViewer` component in src/components/analysis-viewer.tsx
- [x] T019 [US1] Integrate `AnalysisSaveModal` into `AnalysisViewer` with open/close state in src/components/analysis-viewer.tsx
- [x] T020 [US1] Add success/error toast notifications after save operation in src/components/analysis-viewer.tsx

**Checkpoint**: User Story 1 complete - users can save analysis reports from dashboard

---

## Phase 4: User Story 2 - View Analysis History (Priority: P2)

**Goal**: Enable users to view and select from multiple saved analysis reports

**Independent Test**: Create multiple analysis files with different timestamps, verify they appear in chronological order (newest first) and can be selected

### Implementation for User Story 2

- [x] T021 [US2] Add `selectedReportIndex` state to `AnalysisViewer` in src/components/analysis-viewer.tsx
- [x] T022 [US2] Create history list UI showing all reports with timestamps in src/components/analysis-viewer.tsx
- [x] T023 [US2] Implement report selection handler to display selected report content in src/components/analysis-viewer.tsx
- [x] T024 [US2] Style active/selected report in history list in src/components/analysis-viewer.tsx
- [x] T025 [US2] Update empty state to show instructions when no reports exist in src/components/analysis-viewer.tsx
- [x] T026 [US2] Add keyboard navigation for history list (arrow keys) in src/components/analysis-viewer.tsx

**Checkpoint**: User Story 2 complete - users can view analysis history and select reports

---

## Phase 5: User Story 3 - Delete Analysis Report (Priority: P3)

**Goal**: Enable users to delete individual analysis reports with confirmation

**Independent Test**: Create analysis file, trigger delete with confirmation, verify file removed and UI updates

### Implementation for User Story 3

- [x] T027 [US3] Add DELETE handler to API route in src/app/api/analysis/route.ts
- [x] T028 [US3] Implement path validation for DELETE using `isPathSafe()` in src/app/api/analysis/route.ts
- [x] T029 [US3] Implement file existence check and deletion in src/app/api/analysis/route.ts
- [x] T030 [US3] Add delete button to each report in history list in src/components/analysis-viewer.tsx
- [x] T031 [US3] Implement confirmation dialog before delete in src/components/analysis-viewer.tsx
- [x] T032 [US3] Implement delete API call with loading state in src/components/analysis-viewer.tsx
- [x] T033 [US3] Handle selection state after deletion (select next/previous report) in src/components/analysis-viewer.tsx
- [x] T034 [US3] Add success/error notifications for delete operation in src/components/analysis-viewer.tsx

**Checkpoint**: User Story 3 complete - users can delete analysis reports

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T035 [P] Add unit tests for `parseAnalysis()` multi-file support in src/lib/parser.test.ts
- [x] T036 [P] Add unit tests for timestamp extraction in src/lib/parser.test.ts
- [x] T037 Verify SSE real-time updates work for save/delete operations (manual test)
- [x] T038 Run quickstart.md validation checklist
- [x] T039 Update feature spec status from Draft to Complete in specs/006-save-analyze-results/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 (uses same parser output)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Within Each User Story

- API implementation before UI integration
- Modal component can be built in parallel with API
- UI integration after both API and component ready

### Parallel Opportunities

- T001, T002 can run in parallel (different type definitions)
- T013 (modal component) can run in parallel with T007-T012 (API implementation)
- T035, T036 (tests) can run in parallel
- All user stories can be worked on in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch API and Modal component in parallel:
Task: "Create API route file src/app/api/analysis/route.ts with POST handler skeleton"
Task: "Create AnalysisSaveModal component file src/components/analysis-save-modal.tsx"

# After both complete, integrate:
Task: "Integrate AnalysisSaveModal into AnalysisViewer"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T020)
4. **STOP and VALIDATE**: Test save functionality independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Save)
   - Developer B: User Story 2 (View History)
   - Developer C: User Story 3 (Delete)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- SSE watcher already handles real-time updates - no additional work needed
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
