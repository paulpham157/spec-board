# Data Model: SSE File Tracking with Auto-Refresh

**Feature**: 002-sse-file-tracking
**Date**: 2025-12-30
**Status**: Complete

## Overview

This document defines the data structures for the enhanced SSE file tracking system. All types are defined in TypeScript and will be added to `src/types/index.ts`.

---

## Core Entities

### FileChangeEvent

Represents a single file change detected by the watcher.

```typescript
interface FileChangeEvent {
  /** Absolute path to the changed file */
  path: string;

  /** Type of change detected */
  changeType: 'create' | 'modify' | 'delete';

  /** ISO timestamp when change was detected */
  timestamp: string;

  /** File size in bytes (undefined for delete events) */
  size?: number;
}
```

**Validation Rules**:
- `path` must be a valid absolute path within allowed directories
- `timestamp` must be valid ISO 8601 format
- `size` must be non-negative when present

---

### SSEMessage

Represents a message sent over the SSE connection.

```typescript
interface SSEMessage {
  /** Message type for client routing */
  type: 'update' | 'batch' | 'ping' | 'error';

  /** Full project data (for update/batch types) */
  data?: Project;

  /** Array of changes (for batch type only) */
  changes?: FileChangeEvent[];

  /** Error message (for error type only) */
  error?: string;

  /** Server timestamp */
  timestamp: string;
}
```

**Message Types**:
| Type | Description | Payload |
|------|-------------|---------|
| `update` | Single file change | `data: Project` |
| `batch` | Multiple changes | `data: Project, changes: FileChangeEvent[]` |
| `ping` | Heartbeat | `timestamp` only |
| `error` | Error notification | `error: string` |

---

### ConnectionState

Represents the client-side connection status.

```typescript
type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

interface SSEConnectionStatus {
  /** Current connection state */
  state: ConnectionState;

  /** Number of reconnection attempts */
  reconnectAttempts: number;

  /** Timestamp of last successful message */
  lastEventTime: string | null;

  /** Error message if disconnected due to error */
  error?: string;
}
```

---

### WatcherSubscription (Server-side)

Internal structure for managing shared watchers.

```typescript
interface WatcherSubscription {
  /** Project path being watched */
  projectPath: string;

  /** Stream controller for sending events */
  controller: ReadableStreamDefaultController<Uint8Array>;

  /** Unique subscription ID */
  id: string;

  /** Timestamp when subscription was created */
  createdAt: Date;
}

interface ManagedWatcher {
  /** Chokidar watcher instance */
  watcher: FSWatcher;

  /** Set of active subscriptions */
  subscribers: Set<WatcherSubscription>;

  /** Pending changes buffer for batching */
  pendingChanges: FileChangeEvent[];

  /** Debounce timer reference */
  debounceTimer: NodeJS.Timeout | null;

  /** Heartbeat interval reference */
  heartbeatInterval: NodeJS.Timeout | null;
}
```

---

## State Transitions

### Connection State Machine

```
                    ┌─────────────────┐
                    │                 │
    ┌───────────────▶   connected    │◀──────────────┐
    │               │                 │               │
    │               └────────┬────────┘               │
    │                        │                        │
    │                   error/timeout                 │
    │                        │                        │
    │                        ▼                        │
    │               ┌─────────────────┐               │
    │               │                 │          success
    │               │  reconnecting   │───────────────┘
    │               │                 │
    │               └────────┬────────┘
    │                        │
    │                   max retries
    │                        │
    │                        ▼
    │               ┌─────────────────┐
    │               │                 │
    └───────────────│  disconnected  │
      user retry    │                 │
                    └─────────────────┘
```

### Reconnection Backoff

| Attempt | Delay |
|---------|-------|
| 1 | 1000ms |
| 2 | 2000ms |
| 3 | 4000ms |
| 4+ | 5000ms (max) |

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        Server                                │
│  ┌─────────────────┐      ┌─────────────────────────────┐   │
│  │ WatcherManager  │      │      ManagedWatcher         │   │
│  │ (singleton)     │──1:N─│  - watcher (chokidar)       │   │
│  │                 │      │  - subscribers              │   │
│  └─────────────────┘      │  - pendingChanges           │   │
│                           └──────────────┬──────────────┘   │
│                                          │                   │
│                                          │ 1:N               │
│                                          ▼                   │
│                           ┌─────────────────────────────┐   │
│                           │   WatcherSubscription       │   │
│                           │  - controller (stream)      │   │
│                           │  - projectPath              │   │
│                           └──────────────┬──────────────┘   │
└──────────────────────────────────────────┼──────────────────┘
                                           │
                                           │ SSE Stream
                                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│  ┌─────────────────┐      ┌─────────────────────────────┐   │
│  │   useSSE Hook   │──────│   SSEConnectionStatus       │   │
│  │                 │      │  - state                    │   │
│  │                 │      │  - reconnectAttempts        │   │
│  └────────┬────────┘      │  - lastEventTime            │   │
│           │               └─────────────────────────────┘   │
│           │                                                  │
│           │ receives                                         │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │   SSEMessage    │                                        │
│  │  - type         │                                        │
│  │  - data         │                                        │
│  │  - changes      │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Existing Types (Reference)

These types already exist in `src/types/index.ts` and will be used:

- `Project`: Full project data structure (returned in SSEMessage.data)
- `Feature`: Individual feature data
- `Task`: Task item within a feature

No modifications needed to existing types.
