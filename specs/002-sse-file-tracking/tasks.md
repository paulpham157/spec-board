# Tasks: SSE File Tracking with Auto-Refresh

**Input**: Design documents from `/specs/002-sse-file-tracking/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/watch-api.md, quickstart.md

**Tests**: Not requested in specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js)**: `src/app/`, `src/components/`, `src/lib/`, `src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add SSE-related types to the codebase

- [x] T001 [P] Add FileChangeEvent interface to src/types/index.ts
- [x] T002 [P] Add SSEMessage interface to src/types/index.ts
- [x] T003 [P] Add ConnectionState type and SSEConnectionStatus interface to src/types/index.ts

**Checkpoint**: Types ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create WatcherManager singleton with subscribe/unsubscribe methods in src/lib/watcher-manager.ts
- [x] T005 Add ManagedWatcher interface and pending changes buffer to src/lib/watcher-manager.ts
- [x] T006 Implement broadcast method for sending events to all subscribers in src/lib/watcher-manager.ts
- [x] T007 Add cleanup logic for watcher when last subscriber disconnects in src/lib/watcher-manager.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Real-Time File Change Monitoring (Priority: P1) 🎯 MVP

**Goal**: Achieve 0.5-second latency for file change notifications

**Independent Test**: Modify a tracked file and verify update appears in client within 0.5 seconds

### Implementation for User Story 1

- [x] T008 [US1] Reduce debounce timeout from 300ms to 150ms in src/app/api/watch/route.ts
- [x] T009 [US1] Add heartbeat interval (15 seconds) sending :ping comments in src/app/api/watch/route.ts
- [x] T010 [US1] Integrate WatcherManager into watch route (replace per-connection watchers) in src/app/api/watch/route.ts
- [x] T011 [US1] Add batch event support for multiple file changes in src/app/api/watch/route.ts
- [x] T012 [US1] Add retry: header to SSE response for client reconnection hint in src/app/api/watch/route.ts
- [x] T013 [US1] Add timestamp field to all SSE messages in src/app/api/watch/route.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - file changes detected and pushed within 0.5 seconds

---

## Phase 4: User Story 2 - Connection Management (Priority: P2)

**Goal**: Automatic reconnection with status visibility when connection drops

**Independent Test**: Simulate network disconnection and verify client reconnects within 5 seconds with status indicator

### Implementation for User Story 2

- [x] T014 [P] [US2] Create useSSE hook with connection state tracking in src/lib/sse-client.ts
- [x] T015 [US2] Implement automatic reconnection with exponential backoff (1s, 2s, 4s, max 5s) in src/lib/sse-client.ts
- [x] T016 [US2] Add heartbeat detection (30s stale timeout triggers reconnect) in src/lib/sse-client.ts
- [x] T017 [US2] Add lastEventTime tracking for connection health in src/lib/sse-client.ts
- [x] T018 [P] [US2] Create ConnectionStatus component with visual indicator in src/components/connection-status.tsx
- [x] T019 [US2] Add ARIA live region for screen reader announcements in src/components/connection-status.tsx
- [x] T020 [US2] Add tooltip with connection details (last event time, reconnect attempts) in src/components/connection-status.tsx
- [x] T021 [US2] Integrate ConnectionStatus component into project page header in src/app/projects/[name]/page.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - real-time updates with visible connection status

---

## Phase 5: User Story 3 - File Selection and Filtering (Priority: P3)

**Goal**: Allow users to specify which files/directories to track

**Independent Test**: Configure specific files to track and verify only those files trigger updates

### Implementation for User Story 3

- [x] T022 [P] [US3] Add TrackingConfiguration interface to src/types/index.ts
- [x] T023 [US3] Add includePaths and excludePaths parameters to watch route in src/app/api/watch/route.ts
- [x] T024 [US3] Implement path filtering logic in WatcherManager in src/lib/watcher-manager.ts
- [x] T025 [US3] Update useSSE hook to accept tracking configuration in src/lib/sse-client.ts
- [x] T026 [US3] Add filter pattern matching (glob support) in src/lib/watcher-manager.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T027 [P] Add error handling for watcher initialization failures in src/lib/watcher-manager.ts
- [x] T028 [P] Add graceful handling for inaccessible files (permissions, deletion) in src/lib/watcher-manager.ts
- [x] T029 Run manual validation per quickstart.md testing section
- [x] T030 Verify backward compatibility with existing /api/watch consumers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses US1's enhanced watch route but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1/US2 but independently testable

### Within Each User Story

- Server-side changes before client-side
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- T014 and T018 (US2) can run in parallel (different files)
- T022 (US3) can run in parallel with other US3 tasks
- T027 and T028 (Polish) can run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all type definitions together:
Task: "Add FileChangeEvent interface to src/types/index.ts"
Task: "Add SSEMessage interface to src/types/index.ts"
Task: "Add ConnectionState type and SSEConnectionStatus interface to src/types/index.ts"
```

## Parallel Example: User Story 2

```bash
# Launch hook and component creation together:
Task: "Create useSSE hook with connection state tracking in src/lib/sse-client.ts"
Task: "Create ConnectionStatus component with visual indicator in src/components/connection-status.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (WatcherManager)
3. Complete Phase 3: User Story 1 (0.5s latency)
4. **STOP and VALIDATE**: Test file change latency manually
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test latency → Deploy/Demo (MVP!)
3. Add User Story 2 → Test reconnection → Deploy/Demo
4. Add User Story 3 → Test filtering → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (server-side)
   - Developer B: User Story 2 (client-side hook + component)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 is the MVP - delivers core 0.5s latency requirement
