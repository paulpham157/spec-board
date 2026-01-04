# API Contract: Analysis Endpoints

**Feature**: 006-save-analyze-results
**Date**: 2026-01-03
**Base Path**: `/api/analysis`

## Overview

RESTful API endpoints for saving and deleting analysis reports. These endpoints handle write operations for analysis files, complementing the read-only `/api/project` endpoint.

## Endpoints

### POST /api/analysis

Save a new analysis report to the filesystem.

#### Request

```typescript
interface SaveAnalysisRequest {
  featurePath: string;  // Absolute path to feature directory
  content: string;      // Markdown content of the analysis report
}
```

**Headers**:
| Header | Value |
|--------|-------|
| Content-Type | application/json |

**Example**:
```json
{
  "featurePath": "/Users/paul/my-project/specs/001-feature",
  "content": "# Specification Analysis Report\n\n**Feature**: 001-feature\n..."
}
```

#### Response

**Success (201 Created)**:
```typescript
interface SaveAnalysisResponse {
  success: true;
  filename: string;   // Generated filename
  path: string;       // Full path to saved file
}
```

**Example**:
```json
{
  "success": true,
  "filename": "2026-01-03-16-30-analysis.md",
  "path": "/Users/paul/my-project/specs/001-feature/analysis/2026-01-03-16-30-analysis.md"
}
```

**Error Responses**:

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing featurePath | `{ "error": "Feature path is required" }` |
| 400 | Missing content | `{ "error": "Analysis content is required" }` |
| 400 | Empty content | `{ "error": "Analysis content cannot be empty" }` |
| 400 | Content too large | `{ "error": "Analysis content exceeds maximum size (1MB)" }` |
| 403 | Path outside allowed directories | `{ "error": "Access denied: Path is outside allowed directories" }` |
| 404 | Feature directory not found | `{ "error": "Feature directory not found" }` |
| 500 | Filesystem write error | `{ "error": "Failed to save analysis: [details]" }` |

---

### DELETE /api/analysis

Delete an existing analysis report.

#### Request

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| path | string | Yes | Full path to the analysis file to delete |

**Example**:
```
DELETE /api/analysis?path=/Users/paul/my-project/specs/001-feature/analysis/2026-01-03-16-30-analysis.md
```

#### Response

**Success (200 OK)**:
```typescript
interface DeleteAnalysisResponse {
  success: true;
  deleted: string;  // Path of deleted file
}
```

**Example**:
```json
{
  "success": true,
  "deleted": "/Users/paul/my-project/specs/001-feature/analysis/2026-01-03-16-30-analysis.md"
}
```

**Error Responses**:

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Missing path parameter | `{ "error": "File path is required" }` |
| 403 | Path outside allowed directories | `{ "error": "Access denied: Path is outside allowed directories" }` |
| 404 | File not found | `{ "error": "Analysis file not found" }` |
| 500 | Filesystem delete error | `{ "error": "Failed to delete analysis: [details]" }` |

---

## Security

### Path Validation

All paths are validated using `isPathSafe()` from `@/lib/path-utils`:

```typescript
const { safe, resolvedPath } = isPathSafe(requestedPath);
if (!safe) {
  return NextResponse.json(
    { error: 'Access denied: Path is outside allowed directories' },
    { status: 403 }
  );
}
```

### Allowed Directories

Paths must be within:
- User home directory (`os.homedir()`)
- `/Users` (macOS)
- `/home` (Linux)

### Content Validation

| Validation | Rule |
|------------|------|
| Non-empty | `content.trim().length > 0` |
| Max size | 1,048,576 bytes (1MB) |
| Encoding | Valid UTF-8 |

---

## Implementation Notes

### Filename Generation

```typescript
function generateAnalysisFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}-${minute}-analysis.md`;
}
```

### Directory Creation

If `analysis/` directory doesn't exist, create it before saving:

```typescript
const analysisDir = path.join(featurePath, 'analysis');
if (!fs.existsSync(analysisDir)) {
  fs.mkdirSync(analysisDir, { recursive: true });
}
```

### Real-time Updates

No explicit notification needed. The existing SSE watcher (`/api/watch`) will detect file changes and trigger UI updates automatically.

---

## Usage Examples

### Save Analysis (JavaScript)

```typescript
const response = await fetch('/api/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    featurePath: '/Users/paul/my-project/specs/001-feature',
    content: analysisMarkdown
  })
});

if (response.ok) {
  const { filename, path } = await response.json();
  console.log(`Saved to: ${path}`);
}
```

### Delete Analysis (JavaScript)

```typescript
const filePath = encodeURIComponent('/Users/paul/my-project/specs/001-feature/analysis/2026-01-03-16-30-analysis.md');
const response = await fetch(`/api/analysis?path=${filePath}`, {
  method: 'DELETE'
});

if (response.ok) {
  console.log('Analysis deleted');
}
```
