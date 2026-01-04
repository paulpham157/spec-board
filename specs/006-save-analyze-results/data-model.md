# Data Model: Save Analyze Results

**Feature**: 006-save-analyze-results
**Date**: 2026-01-03

## Entities

### AnalysisReport

Represents a single saved analysis report file.

| Property | Type | Description |
|----------|------|-------------|
| `filename` | string | File name (e.g., `2026-01-03-16-30-analysis.md`) |
| `timestamp` | string | ISO date extracted from filename (e.g., `2026-01-03T16:30:00`) |
| `path` | string | Full filesystem path to the file |
| `content` | string | Markdown content of the report |

```typescript
interface AnalysisReport {
  filename: string;
  timestamp: string;
  path: string;
  content: string;
}
```

### FeatureAnalysis (Updated)

Collection of analysis reports for a feature. Extends existing type with backwards compatibility.

| Property | Type | Description |
|----------|------|-------------|
| `reports` | AnalysisReport[] | All analysis reports, sorted newest first |
| `markdownContent` | string \| null | Latest report content (backwards compat) |
| `markdownPath` | string \| null | Latest report path (backwards compat) |

```typescript
interface FeatureAnalysis {
  reports: AnalysisReport[];
  // Backwards compatibility with existing code
  markdownContent: string | null;
  markdownPath: string | null;
}
```

## Validation Rules

### Filename Format

| Rule | Pattern | Example |
|------|---------|---------|
| Timestamp format | `YYYY-MM-DD-HH-mm-analysis.md` | `2026-01-03-16-30-analysis.md` |
| Regex validation | `/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-analysis\.md$/` | - |

### Content Validation

| Rule | Constraint |
|------|------------|
| Non-empty | `content.trim().length > 0` |
| Max size | 1MB (1,048,576 bytes) |
| Format | Valid UTF-8 string |

### Path Validation

| Rule | Implementation |
|------|----------------|
| Safe path | `isPathSafe(path)` returns `{ safe: true }` |
| Within specs | Path must be under `specs/<feature>/analysis/` |
| No traversal | Path must not contain `..` after resolution |

## State Transitions

### Analysis Report Lifecycle

```
[Not Exists] --save--> [Saved] --delete--> [Not Exists]
```

| State | Condition |
|-------|-----------|
| Not Exists | File does not exist on filesystem |
| Saved | File exists with valid content |

### UI State

```
[Empty] --save--> [Has Reports] --delete all--> [Empty]
                       |
                       v
                  [Selected Report]
```

| State | Description |
|-------|-------------|
| Empty | No analysis reports exist |
| Has Reports | One or more reports exist |
| Selected Report | User viewing specific report |

## Storage Schema

### Filesystem Structure

```text
specs/<feature>/
└── analysis/
    ├── 2026-01-03-16-30-analysis.md
    ├── 2026-01-02-10-15-analysis.md
    └── 2026-01-01-09-00-analysis.md
```

### File Content Format

Analysis files are plain markdown with no required structure. Content is preserved exactly as provided by `/speckit.analyze` output.

## Sorting Behavior

| Sort | Direction | Implementation |
|------|-----------|----------------|
| By date | Descending (newest first) | Sort by filename (lexicographic) |

**Note**: Timestamp-based filenames ensure lexicographic sort equals chronological sort.

## Data Integrity

### Uniqueness

- Filenames are unique per feature (timestamp-based)
- Minute-level precision prevents conflicts in typical usage
- If collision occurs, operation fails with error (user retries)

### Persistence

- Files persist on filesystem until explicitly deleted
- No database storage required
- SSE watcher detects changes automatically

### Consistency

- Parser reads all `*-analysis.md` files on each update
- UI reflects current filesystem state via SSE
- No caching layer - always reads from filesystem
