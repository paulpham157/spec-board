# Research: SSE File Tracking with Auto-Refresh

**Feature**: 002-sse-file-tracking
**Date**: 2025-12-30
**Status**: Complete

## Executive Summary

This research analyzes the existing SSE implementation and determines the optimal approach to achieve 0.5-second file change notification latency while maintaining system stability and compatibility.

---

## Research Task 1: Current SSE Implementation Analysis

### Findings

**Current Implementation** (`src/app/api/watch/route.ts`):
- Uses **chokidar** library for file watching
- Polling mode enabled: `usePolling: true`
- Poll interval: **300ms**
- Debounce timeout: **300ms**
- Watch depth: 3 levels
- Ignores dotfiles

**Current Latency Calculation**:
- Best case: 0ms (change detected immediately after poll) + 300ms debounce = **300ms**
- Worst case: 299ms (just missed poll) + 300ms poll + 300ms debounce = **~600ms**
- Average case: ~150ms + 300ms = **~450ms**

### Decision

**Reduce debounce to 150ms** to achieve consistent sub-500ms latency:
- New worst case: 299ms + 300ms + 150ms = **~450ms** (within 500ms target)
- Keep polling at 300ms for reliability (chokidar docs recommend this for cross-platform)

**Rationale**: Reducing poll interval below 300ms risks CPU overhead and missed events on some platforms. Reducing debounce is safer and sufficient.

**Alternatives Considered**:
1. ❌ Native fs.watch (event-based): Unreliable for in-place writes from IDEs/AI tools
2. ❌ 100ms polling: Higher CPU usage, diminishing returns
3. ✅ 300ms poll + 150ms debounce: Optimal balance

---

## Research Task 2: Connection Status Feedback

### Findings

**Current State**: No connection status indicator exists. Users have no visibility into SSE connection health.

**Browser SSE Behavior**:
- `EventSource` auto-reconnects on connection loss
- Default retry interval: 3 seconds (can be overridden by server)
- Events: `open`, `message`, `error`

### Decision

**Create dedicated SSE client hook** (`useSSE`) with:
- Connection state tracking: `connected`, `disconnected`, `reconnecting`
- Automatic reconnection with exponential backoff (1s, 2s, 4s, max 5s)
- Server-sent retry interval support
- Heartbeat detection (server sends ping every 30s)

**UI Component**: Simple status indicator with:
- Green dot: Connected
- Yellow dot + "Reconnecting...": Reconnecting
- Red dot + "Disconnected": Failed after max retries
- ARIA live region for screen reader announcements

**Rationale**: Native EventSource reconnection is sufficient but lacks visibility. Custom wrapper adds observability without replacing core functionality.

---

## Research Task 3: Multiple Client Connections

### Findings

**Current Implementation**: Each SSE connection creates its own chokidar watcher instance.

**Scalability Concern**: 100 clients = 100 watchers = 100x filesystem polling overhead.

### Decision

**Implement shared watcher pattern**:
- Single chokidar watcher per project path
- Broadcast changes to all connected clients via in-memory subscriber list
- Clean up watcher when last client disconnects

**Implementation Approach**:
```
WatcherManager (singleton)
├── watchers: Map<projectPath, { watcher, subscribers: Set<controller> }>
├── subscribe(path, controller): void
├── unsubscribe(path, controller): void
└── broadcast(path, data): void
```

**Rationale**: Reduces filesystem overhead from O(n) to O(1) per project. Essential for 100+ concurrent connections target.

**Alternatives Considered**:
1. ❌ Keep per-connection watchers: Won't scale to 100 connections
2. ❌ Redis pub/sub: Over-engineering for single-server deployment
3. ✅ In-memory broadcast: Simple, sufficient for target scale

---

## Research Task 4: Bulk Change Handling

### Findings

**Edge Case**: Git operations, IDE refactoring, or build tools can trigger 100+ file changes in <1 second.

**Risk**: Flooding clients with individual events causes UI thrashing and potential memory issues.

### Decision

**Implement batching with flush interval**:
- Collect changes in buffer during debounce window
- Send single batched event with all changes
- Client receives array of changes, updates UI once

**Event Format**:
```typescript
// Single change
{ type: 'update', data: Project }

// Batched (new)
{ type: 'batch', changes: FileChangeEvent[], data: Project }
```

**Rationale**: Maintains backward compatibility (single updates still work) while handling bulk scenarios gracefully.

---

## Research Task 5: Heartbeat and Connection Health

### Findings

**Problem**: SSE connections can silently fail (proxy timeout, network change). Client may not know it's disconnected.

**Standard Practice**: Server sends periodic heartbeat; client detects stale connection if no heartbeat received.

### Decision

**Implement server heartbeat**:
- Server sends `:ping` comment every 15 seconds (SSE comment format, ignored by EventSource)
- Client tracks last event time
- If no event for 30 seconds, client triggers reconnection

**Rationale**: 15-second heartbeat balances connection health detection with minimal overhead. SSE comment format is standard and doesn't trigger message handlers.

---

## Summary of Decisions

| Topic | Decision | Impact |
|-------|----------|--------|
| Latency | Reduce debounce to 150ms | Achieves <500ms p95 |
| Connection Status | New `useSSE` hook + status component | User visibility |
| Scalability | Shared watcher per project | Supports 100+ clients |
| Bulk Changes | Batched events | Handles mass file changes |
| Health Check | 15s server heartbeat | Detects stale connections |

---

## Dependencies Identified

- **chokidar**: Already installed, no changes needed
- **No new dependencies required**: All features implementable with existing stack

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Debounce too aggressive | Low | Monitor for duplicate events, adjust if needed |
| Memory leak in watcher manager | Medium | Ensure cleanup on disconnect, add tests |
| Heartbeat overhead | Low | SSE comments are minimal (~5 bytes) |
