# SpecBoard API Documentation

## Overview

SpecBoard provides a REST API for managing projects and accessing spec-kit data. All endpoints return JSON responses.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Projects API

Manage registered projects with shareable URL slugs.

### List All Projects

```http
GET /api/projects
```

Returns all registered projects ordered by last update.

**Response (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-project",
    "displayName": "My Project",
    "filePath": "/path/to/project",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Create Project

```http
POST /api/projects
```

Register a new project with a shareable URL slug.

**Request Body**
```json
{
  "name": "my-project",
  "displayName": "My Project",
  "filePath": "/path/to/project"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | URL-safe slug (lowercase letters, numbers, hyphens) |
| `displayName` | string | Yes | Human-readable project name |
| `filePath` | string | Yes | Absolute path to spec-kit project |

**Validation Rules**

- `name` must match pattern: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- Valid examples: `my-project`, `app123`, `feature-v2`
- Invalid examples: `My_Project`, `app--name`, `-start`

**Response (201 Created)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-project",
  "displayName": "My Project",
  "filePath": "/path/to/project",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 201 | Created successfully |
| 400 | Invalid request (missing fields or invalid slug format) |
| 409 | Project with this name already exists |
| 500 | Server error |

---

### Get Project by Name

```http
GET /api/projects/:name
```

Retrieve a project by its URL slug.

**Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Project URL slug |

**Response (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-project",
  "displayName": "My Project",
  "filePath": "/path/to/project",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Project not found |
| 500 | Server error |

---

### Update Project

```http
PUT /api/projects/:name
```

Update project details. All fields are optional.

**Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Project URL slug |

**Request Body**
```json
{
  "displayName": "Updated Name",
  "filePath": "/new/path/to/project"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `displayName` | string | No | New display name |
| `filePath` | string | No | New file path (must be valid directory) |

**Response (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-project",
  "displayName": "Updated Name",
  "filePath": "/new/path/to/project",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Updated successfully |
| 400 | Invalid file path (directory does not exist) |
| 404 | Project not found |
| 500 | Server error |

---

### Delete Project

```http
DELETE /api/projects/:name
```

Remove a project registration. Does not delete actual files.

**Response (200 OK)**
```json
{
  "success": true
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Deleted successfully |
| 404 | Project not found |
| 500 | Server error |

---

## Spec Data API

Load and parse spec-kit project data.

### Load Project Data

```http
GET /api/project?path=:path
```

Load and parse spec-kit files from a project directory.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to spec-kit project |

**Response (200 OK)**

Returns a complete `Project` object with all parsed spec data:

```json
{
  "path": "/path/to/project",
  "name": "project-name",
  "features": [
    {
      "id": "feature-id",
      "name": "Feature Name",
      "stage": "implement",
      "specContent": "# Spec content...",
      "planContent": "# Plan content...",
      "tasks": [...],
      "userStories": [...],
      "clarifications": [...],
      "additionalFiles": [...]
    }
  ],
  "constitution": {
    "principles": [...],
    "sections": [...]
  }
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Missing path parameter |
| 500 | Failed to parse project |

---

### Browse Directories

```http
GET /api/browse?path=:path
```

Browse filesystem directories for project selection.

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | string | No | User's home directory | Directory to browse |

**Path Shortcuts**

- `~` - User's home directory
- `~/folder` - Relative to home directory

**Response (200 OK)**

```json
{
  "currentPath": "/Users/name/projects",
  "parentPath": "/Users/name",
  "entries": [
    {
      "name": "my-project",
      "path": "/Users/name/projects/my-project",
      "isDirectory": true,
      "isSpecKitProject": true
    }
  ],
  "isSpecKitProject": false
}
```

**Entry Sorting**

Entries are sorted with spec-kit projects first, then alphabetically.

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Path is not a directory |
| 403 | Access denied (path outside allowed directories) |
| 404 | Directory does not exist |
| 500 | Server error |

**Security: Path Traversal Protection**

The browse API includes protection against path traversal attacks:
- Paths are resolved to absolute paths (handles `..`, symlinks)
- Only allows browsing within allowed directories:
  - User's home directory
  - `/Users` (macOS)
  - `/home` (Linux)
- Attempts to access paths outside these directories return `403 Forbidden`

---

### Watch for Changes (SSE)

```http
GET /api/watch?path=:path
```

Establish Server-Sent Events connection for real-time updates.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to spec-kit project |

**Response Headers**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Format**

```
data: {"type":"update","data":{...project object...}}

data: {"type":"update","data":{...updated project...}}
```

**Message Structure**

```json
{
  "type": "update",
  "data": { /* Full Project object */ }
}
```

**Behavior**

- Sends initial project data immediately on connection
- Watches for file changes with 300ms debounce
- Monitors up to 3 directory levels deep
- Ignores dotfiles (`.git`, `.env`, etc.)
- Automatically cleans up on client disconnect

**Client Usage Example**

```javascript
const eventSource = new EventSource('/api/watch?path=/path/to/project');

eventSource.onmessage = (event) => {
  try {
    const { type, data } = JSON.parse(event.data);
    if (type === 'update') {
      console.log('Project updated:', data);
    }
  } catch (error) {
    console.error('Failed to parse SSE message:', error);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  eventSource.close();
});
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | SSE stream established |
| 400 | Missing path parameter |

---

## URL Routes

### Page Routes

| Route | Description |
|-------|-------------|
| `/` | Home page - project list and registration |
| `/projects/:name` | Project board view |
| `/projects/:name/features/:featureId` | Feature detail (deep link) |
| `/projects/:name/features/:featureId/spec` | Spec viewer with SSE updates |
| `/projects/:name/features/:featureId/plan` | Plan viewer with SSE updates |

### Example URLs

```
# Board view
https://specboard.example.com/projects/my-project

# Feature deep link
https://specboard.example.com/projects/my-project/features/cloudflare-early-warning

# Spec viewer
https://specboard.example.com/projects/my-project/features/auth-system/spec

# Share with teammates
https://specboard.example.com/projects/my-project
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

---

## Type Definitions

### Project

```typescript
interface Project {
  name: string;
  path: string;
  features: Feature[];
  constitution: Constitution | null;
}
```

### Feature

```typescript
interface Feature {
  id: string;
  name: string;
  stage: 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';
  specContent: string | null;
  specPath: string | null;
  planContent: string | null;
  planPath: string | null;
  tasks: Task[];
  phases: Phase[];
  userStories: UserStory[];
  clarifications: ClarificationSession[];
  additionalFiles: SpecKitFile[];
}
```

### Task

```typescript
interface Task {
  id: string;
  description: string;
  completed: boolean;
  parallel: boolean;
  userStoryId: string | null;
  filePath: string | null;
}
```

### UserStory

```typescript
interface UserStory {
  id: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  acceptanceCriteria: AcceptanceCriterion[];
}
```

### DirectoryEntry

```typescript
interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSpecKitProject: boolean;
}
```

---

## Security Considerations

### Path Traversal Protection

The `/api/browse` endpoint includes protection against path traversal attacks:

- Paths are resolved to absolute paths before validation
- Only paths within allowed directories are accessible:
  - User's home directory
  - `/Users` (macOS)
  - `/home` (Linux)
- Attempts to access paths outside these directories return `403 Forbidden`

### File Path Validation

The `/api/projects/:name` PUT endpoint validates that `filePath`:
- Points to an existing directory
- Is accessible by the server process

### Input Validation

- Project names are validated against a strict slug pattern
- All user inputs are validated before database operations
- Prisma ORM provides SQL injection protection

### XSS Prevention

- Markdown content is sanitized with DOMPurify before rendering
- All user-generated content is escaped in the UI

### Rate Limiting

Currently, no rate limiting is implemented. For production deployments, consider adding rate limiting middleware.

---

## Utility Functions

### Path Utilities

Server-side path safety utilities used by API routes:

```typescript
import { isPathSafe, isSpecKitProject, normalizePath } from '@/lib/path-utils';

// Validate path is within allowed directories
const { safe, resolvedPath } = isPathSafe('/some/path');

// Check if directory is a spec-kit project
const isProject = isSpecKitProject('/path/to/dir');

// Expand ~ to home directory
const fullPath = normalizePath('~/projects');
```

### isPrismaError

Type guard for handling Prisma ORM errors:

```typescript
import { isPrismaError } from '@/lib/utils';

try {
  await prisma.project.create({ ... });
} catch (error) {
  if (isPrismaError(error, 'P2002')) {
    // Handle unique constraint violation
  }
  if (isPrismaError(error, 'P2025')) {
    // Handle record not found
  }
}
```

### openInEditor

Opens files in VS Code from the browser:

```typescript
import { openInEditor } from '@/lib/utils';

const result = openInEditor('/path/to/file.ts', 42);
// result: { success: boolean, message: string }
```
