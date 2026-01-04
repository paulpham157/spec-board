# Tasks: Feature Detail View

**Input**: Design documents from `/specs/003-feature-detail-view/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Status**: FEATURE ALREADY IMPLEMENTED - Tasks below are for verification only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Verification Setup

**Purpose**: Prepare for verification of existing implementation

- [x] T001 Review existing implementation in src/components/feature-detail/feature-detail.tsx
- [x] T002 [P] Review markdown rendering in src/components/markdown-renderer.tsx
- [x] T003 [P] Review parser implementation in src/lib/parser.ts

**Checkpoint**: Understand existing implementation before verification

---

## Phase 2: User Story 1 - View Feature Details (Priority: P1) - VERIFICATION

**Goal**: Verify users can click a feature card and see detailed markdown content

**Independent Test**: Click any feature card and verify detail view opens with properly formatted spec.md content

### Verification for User Story 1

- [x] T004 [US1] Verify FeatureDetail modal opens on feature card click in src/components/feature-detail/feature-detail.tsx
- [x] T005 [P] [US1] Verify markdown elements render correctly (headings, lists, tables, code blocks) in src/components/markdown-renderer.tsx
- [x] T006 [P] [US1] Verify DOMPurify sanitization is applied in src/components/markdown-renderer.tsx:28-36
- [x] T007 [US1] Verify close/dismiss functionality works (Escape key, close button) in src/components/feature-detail/feature-detail.tsx:313-318
- [x] T008 [US1] Verify error handling for missing spec.md files in src/lib/parser.ts:728-738
- [x] T009 [US1] Verify malformed markdown fallback in src/components/markdown-renderer.tsx:38-42

**Checkpoint**: User Story 1 requirements verified - FR-001, FR-002, FR-003, FR-005, FR-007, FR-008

---

## Phase 3: User Story 2 - Navigate Specification Sections (Priority: P2) - VERIFICATION

**Goal**: Verify users can navigate between document sections

**Independent Test**: Open feature detail and use navigation to jump to different sections

### Verification for User Story 2

- [x] T010 [US2] Verify NavSidebar displays section navigation in src/components/feature-detail/nav-sidebar.tsx
- [x] T011 [P] [US2] Verify section click scrolls to content in src/components/feature-detail/feature-detail.tsx:136-161
- [x] T012 [P] [US2] Verify heading hierarchy is visually represented in src/components/feature-detail/nav-item.tsx
- [x] T013 [US2] Verify keyboard navigation (1-9, arrows, Enter) in src/components/feature-detail/feature-detail.tsx:306-412

**Checkpoint**: User Story 2 requirements verified - FR-006

---

## Phase 4: User Story 3 - View Feature Metadata (Priority: P3) - VERIFICATION

**Goal**: Verify metadata (branch, date, status) is prominently displayed

**Independent Test**: Open feature detail and verify metadata fields are visible in header

### Verification for User Story 3

- [x] T014 [US3] Verify HeaderBar displays feature name and ID in src/components/feature-detail/header-bar.tsx
- [x] T015 [P] [US3] Verify branch name is parsed from spec.md in src/lib/parser.ts:303-307
- [x] T016 [US3] Verify status indicators are visually distinguished in src/components/feature-detail/section-icon.tsx

**Checkpoint**: User Story 3 requirements verified - FR-004

---

## Phase 5: Cross-Cutting Verification

**Purpose**: Verify non-functional requirements and constitution compliance

- [x] T017 [P] Verify TypeScript strict mode compliance (no `any` types) in src/components/feature-detail/
- [x] T018 [P] Verify accessibility (ARIA labels, focus trap) in src/lib/accessibility/
- [x] T019 [P] Verify responsive design (320px-2560px) in src/components/feature-detail/feature-detail.tsx
- [x] T020 Run test suite to verify coverage: pnpm test
- [x] T021 Update spec.md status from "Draft" to "Complete" in specs/003-feature-detail-view/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Verification Setup)**: No dependencies - review existing code
- **Phase 2 (US1 Verification)**: Depends on Phase 1 understanding
- **Phase 3 (US2 Verification)**: Can run parallel to Phase 2
- **Phase 4 (US3 Verification)**: Can run parallel to Phase 2 and 3
- **Phase 5 (Cross-Cutting)**: Depends on all user story verifications

### User Story Dependencies

- **User Story 1 (P1)**: Core functionality - verify first
- **User Story 2 (P2)**: Independent of US1 - can verify in parallel
- **User Story 3 (P3)**: Independent of US1/US2 - can verify in parallel

### Parallel Opportunities

All verification tasks marked [P] can run in parallel within their phase.

---

## Parallel Example: User Story 1 Verification

```bash
# Launch parallel verification tasks:
Task: "Verify markdown elements render correctly in src/components/markdown-renderer.tsx"
Task: "Verify DOMPurify sanitization is applied in src/components/markdown-renderer.tsx:28-36"
```

---

## Implementation Strategy

### Verification-Only Approach

Since this feature is **already fully implemented**, the tasks above are for:

1. **Code Review**: Verify existing implementation meets spec requirements
2. **Manual Testing**: Confirm user stories work as specified
3. **Compliance Check**: Ensure constitution principles are followed
4. **Documentation**: Update spec status to "Complete"

### Expected Outcome

All verification tasks should PASS because:
- FR-001 through FR-008 are implemented in existing code
- SC-001 through SC-006 are met by current implementation
- Constitution principles are satisfied

### If Gaps Are Found

If any verification task reveals a gap:
1. Document the specific gap
2. Create a new enhancement spec (004-xxx)
3. Do NOT modify this spec - it documents existing functionality

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 21 |
| US1 Tasks | 6 |
| US2 Tasks | 4 |
| US3 Tasks | 3 |
| Setup/Cross-Cutting | 8 |
| Parallel Opportunities | 11 tasks marked [P] |
| Implementation Required | **NONE** - verification only |

**MVP Scope**: All user stories already implemented. Verification confirms completeness.

---

## Notes

- This is a **verification-only** task list
- All functional requirements (FR-001 to FR-008) are already implemented
- Tasks verify existing code meets specification
- No new code needs to be written
- Mark spec as "Complete" after verification passes
