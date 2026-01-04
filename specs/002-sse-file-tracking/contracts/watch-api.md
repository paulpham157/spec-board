# API Contract: SSE Watch Endpoint

**Feature**: 002-sse-file-tracking
**Date**: 2025-12-30
**Endpoint**: `GET /api/watch`

## Overview

Server-Sent Events endpoint for real-time file change notifications with 0.5-second latency target.

---

## Endpoint

### GET /api/watch

Establishes an SSE connection to receive real-time file change notifications.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute filesystem path to the project directory |

**Headers**:

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `text/event-stream` | SSE content type |
| `Cache-Control` | `no-cache` | Disable caching |
| `Connection` | `keep-alive` | Persistent connection |

---

## Request

```http
GET /api/watch?path=/Users/paul/my-project HTTP/1.1
Accept: text/event-stream
```

---

## Response

### Success (200 OK)

Returns an SSE stream with the following event types:

#### Initial Update Event

Sent immediately upon connection with current project state.

```
data: {"type":"update","data":{...project},"timestamp":"2025-12-30T09:00:00.000Z"}

```

#### Change Update Event

Sent when file changes are detected (single file).

```
data: {"type":"update","data":{...project},"timestamp":"2025-12-30T09:00:01.500Z"}

```

#### Batch Update Event

Sent when multiple files change within the debounce window.

```
data: {"type":"batch","data":{...project},"changes":[{"path":"/path/to/file.md","changeType":"modify","timestamp":"2025-12-30T09:00:01.000Z"}],"timestamp":"2025-12-30T09:00:01.150Z"}

```

#### Heartbeat (Comment)

Sent every 15 seconds to maintain connection health.

```
:ping 2025-12-30T09:00:15.000Z

```

#### Error Event

Sent when an error occurs during watching.

```
data: {"type":"error","error":"Failed to parse project","timestamp":"2025-12-30T09:00:02.000Z"}

```

### Error Responses

#### 400 Bad Request

Missing required `path` parameter.

```json
{
  "error": "Project path is required"
}
```

#### 403 Forbidden

Path is outside allowed directories (security violation).

```json
{
  "error": "Access denied: Path is outside allowed directories"
}
```

---

## Event Schema

### SSEMessage

```typescript
interface SSEMessage {
  type: 'update' | 'batch' | 'ping' | 'error';
  data?: Project;
  changes?: FileChangeEvent[];
  error?: string;
  timestamp: string;
}
```

### FileChangeEvent

```typescript
interface FileChangeEvent {
  path: string;
  changeType: 'create' | 'modify' | 'delete';
  timestamp: string;
  size?: number;
}
```

---

## Timing Guarantees

| Metric | Target | Notes |
|--------|--------|-------|
| Initial data | < 500ms | From connection to first `update` event |
| Change notification | < 500ms (p95) | From file change to client receipt |
| Heartbeat interval | 15 seconds | SSE comment format |
| Reconnect hint | 3 seconds | Server-sent `retry:` field |

---

## Client Implementation

### JavaScript/TypeScript

```typescript
const eventSource = new EventSource('/api/watch?path=' + encodeURIComponent(projectPath));

eventSource.onopen = () => {
  console.log('Connected');
};

eventSource.onmessage = (event) => {
  const message: SSEMessage = JSON.parse(event.data);

  switch (message.type) {
    case 'update':
    case 'batch':
      updateProject(message.data);
      break;
    case 'error':
      handleError(message.error);
      break;
  }
};

eventSource.onerror = () => {
  console.log('Connection error, will auto-reconnect');
};
```

---

## Security Considerations

1. **Path Validation**: All paths validated via `isPathSafe()` before watching
2. **Allowed Directories**: Only paths within user home, `/Users`, or `/home`
3. **No Write Access**: Endpoint is read-only, cannot modify files
4. **Rate Limiting**: Debounce prevents event flooding (150ms minimum between events)

---

## Backward Compatibility

This contract maintains backward compatibility with existing clients:

| Feature | Existing | Enhanced |
|---------|----------|----------|
| `update` events | Supported | Supported |
| `batch` events | N/A | New (additive) |
| Heartbeat | N/A | New (SSE comment, ignored by existing clients) |
| Error events | Implicit | Explicit `type: 'error'` |

Existing clients will continue to work without modification.
