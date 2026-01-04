# Quickstart: SSE File Tracking with Auto-Refresh

**Feature**: 002-sse-file-tracking
**Date**: 2025-12-30

## Overview

This guide provides a quick reference for implementing the enhanced SSE file tracking system with 0.5-second latency.

---

## Prerequisites

- Node.js 18+ (for ReadableStream support)
- Existing SpecBoard codebase
- chokidar (already installed)

---

## Implementation Checklist

### Server-Side (Priority Order)

1. **Update Watch Route Timing** (`src/app/api/watch/route.ts`)
   - Change debounce from 300ms to 150ms
   - Add heartbeat interval (15 seconds)
   - Add batch event support

2. **Create Watcher Manager** (`src/lib/watcher-manager.ts`)
   - Singleton pattern for shared watchers
   - Subscribe/unsubscribe methods
   - Cleanup on last subscriber disconnect

3. **Add SSE Types** (`src/types/index.ts`)
   - `FileChangeEvent` interface
   - `SSEMessage` interface
   - `ConnectionState` type

### Client-Side (Priority Order)

1. **Create SSE Hook** (`src/lib/sse-client.ts`)
   - `useSSE(projectPath)` hook
   - Connection state management
   - Automatic reconnection with backoff

2. **Create Status Component** (`src/components/connection-status.tsx`)
   - Visual indicator (green/yellow/red dot)
   - ARIA live region for accessibility
   - Tooltip with connection details

3. **Integrate Status Component**
   - Add to project page header
   - Connect to `useSSE` hook state

---

## Key Code Snippets

### Debounce Update (Server)

```typescript
// src/app/api/watch/route.ts
// Change from:
timeout = setTimeout(handleChange, 300);
// To:
timeout = setTimeout(handleChange, 150);
```

### Heartbeat (Server)

```typescript
// Add after watcher setup
const heartbeat = setInterval(() => {
  controller.enqueue(encoder.encode(`:ping ${new Date().toISOString()}\n\n`));
}, 15000);

// Cleanup
request.signal.addEventListener('abort', () => {
  clearInterval(heartbeat);
  // ... existing cleanup
});
```

### useSSE Hook (Client)

```typescript
// src/lib/sse-client.ts
export function useSSE(projectPath: string) {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/watch?path=${encodeURIComponent(projectPath)}`);

    es.onopen = () => setState('connected');
    es.onerror = () => setState('reconnecting');
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'update' || msg.type === 'batch') {
        setProject(msg.data);
      }
    };

    return () => es.close();
  }, [projectPath]);

  return { state, project };
}
```

### Connection Status (Client)

```typescript
// src/components/connection-status.tsx
export function ConnectionStatus({ state }: { state: ConnectionState }) {
  const colors = {
    connected: 'bg-green-500',
    reconnecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <div className={cn('w-2 h-2 rounded-full', colors[state])} />
      <span className="sr-only">
        {state === 'connected' ? 'Connected' : state === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
      </span>
    </div>
  );
}
```

---

## Testing

### Manual Testing

1. Start dev server: `pnpm dev`
2. Open project in browser
3. Modify a spec file
4. Verify update appears within 0.5 seconds

### Latency Measurement

```typescript
// Add to client for debugging
const start = performance.now();
es.onmessage = (e) => {
  console.log(`SSE latency: ${performance.now() - start}ms`);
  // ... handle message
};
```

### Connection Status Testing

1. Open DevTools Network tab
2. Throttle to "Offline"
3. Verify status changes to "Reconnecting"
4. Restore connection
5. Verify status returns to "Connected"

---

## Configuration

| Setting | Default | Location |
|---------|---------|----------|
| Poll interval | 300ms | `watch/route.ts` |
| Debounce | 150ms | `watch/route.ts` |
| Heartbeat | 15s | `watch/route.ts` |
| Reconnect backoff | 1-5s | `sse-client.ts` |
| Stale timeout | 30s | `sse-client.ts` |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Updates > 500ms | Debounce too high | Verify debounce is 150ms |
| No updates | Watcher not started | Check console for errors |
| Frequent reconnects | Heartbeat missing | Verify heartbeat interval |
| Memory leak | Watcher not cleaned up | Check abort handler |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/watch/route.ts` | Modify | Reduce debounce, add heartbeat |
| `src/lib/watcher-manager.ts` | Create | Shared watcher singleton |
| `src/lib/sse-client.ts` | Create | Client SSE hook |
| `src/components/connection-status.tsx` | Create | Status indicator |
| `src/types/index.ts` | Modify | Add SSE types |
