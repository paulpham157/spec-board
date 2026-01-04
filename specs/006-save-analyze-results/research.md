# Research: Save Analyze Results

**Feature**: 006-save-analyze-results
**Date**: 2026-01-03
**Status**: Complete

## Technology Decisions

### 1. File Storage Pattern

**Decision**: Use timestamped markdown files in `specs/<feature>/analysis/` directory

**Rationale**:
- Consistent with existing spec-kit file organization
- Timestamps provide natural ordering and uniqueness
- Markdown format matches existing analysis output from `/speckit.analyze`
- No database changes required - filesystem is the source of truth

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Database storage | Violates constitution principle I (filesystem as source of truth) |
| Single file with sections | Loses history, harder to manage |
| JSON format | Less readable, inconsistent with other spec-kit files |

### 2. Filename Format

**Decision**: `YYYY-MM-DD-HH-mm-analysis.md`

**Rationale**:
- Sortable by filename (lexicographic = chronological)
- Human-readable timestamps
- Minute precision sufficient for typical usage (avoids second-level conflicts)
- Consistent with existing analysis file naming pattern observed in `001-kanban-board/analysis/`

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Unix timestamps | Not human-readable |
| UUID-based | No natural ordering |
| Sequential numbers | Requires tracking state |

### 3. API Design

**Decision**: New `/api/analysis` endpoint with POST (save) and DELETE operations

**Rationale**:
- Follows existing RESTful patterns in the codebase
- Separates write operations from read-only `/api/project` endpoint
- Allows for proper error handling and validation

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Extend `/api/project` | Violates single responsibility, mixes read/write |
| WebSocket | Overkill for simple CRUD, SSE already handles updates |

### 4. Real-time Updates

**Decision**: Leverage existing SSE watcher (chokidar) - no changes needed

**Rationale**:
- Existing `/api/watch` endpoint already monitors `specs/` directory with depth 3
- File changes in `analysis/` subdirectory will be automatically detected
- Parser already calls `parseAnalysis()` on each update

**Evidence from codebase**:
- `src/app/api/watch/route.ts:42-49`: chokidar watches with `depth: 3`
- `src/lib/parser.ts:780`: `parseAnalysis()` called in `parseFeature()`

### 5. UI Component Strategy

**Decision**: Extend existing `AnalysisViewer` component, add new `AnalysisSaveModal`

**Rationale**:
- Minimizes new code by extending existing component
- Modal pattern consistent with `OpenProjectModal`
- Keeps save functionality separate from display

**Components**:
| Component | Responsibility |
|-----------|----------------|
| `AnalysisViewer` | Display history list, select report, delete button |
| `AnalysisSaveModal` | Text input for analysis content, save action |

## Security Considerations

### Path Validation

**Requirement**: All file paths must be validated using `isPathSafe()` before any write operation.

**Implementation**:
```typescript
// In /api/analysis/route.ts
const { safe, resolvedPath } = isPathSafe(featurePath);
if (!safe) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

### Input Validation

**Requirement**: Validate analysis content is non-empty and reasonable size.

**Implementation**:
- Check content is non-empty string
- Limit content size (e.g., 1MB max) to prevent abuse
- Sanitize filename components (feature path)

### Directory Traversal Prevention

**Requirement**: Prevent malicious paths like `../../../etc/passwd`

**Implementation**:
- Use `path.resolve()` to normalize paths
- Verify resolved path is within allowed `specs/` directory
- Reject paths containing `..` segments

## Parser Modifications

### Current Implementation

`parseAnalysis()` in `src/lib/parser.ts:487-507` currently:
- Reads single `analysis/analysis.md` file
- Returns `{ markdownContent, markdownPath }`

### Required Changes

1. **Read all `*-analysis.md` files** in the `analysis/` directory
2. **Sort by filename** (newest first due to timestamp format)
3. **Return array of reports** with metadata

### Updated Type

```typescript
// Current
interface FeatureAnalysis {
  markdownContent: string | null;
  markdownPath: string | null;
}

// Updated
interface AnalysisReport {
  filename: string;
  timestamp: string;  // Extracted from filename
  path: string;
  content: string;
}

interface FeatureAnalysis {
  reports: AnalysisReport[];
  // Backwards compatibility
  markdownContent: string | null;  // Latest report content
  markdownPath: string | null;     // Latest report path
}
```

## Existing Patterns to Follow

### API Route Pattern
From `src/app/api/projects/register/route.ts`:
- Use `NextResponse.json()` for responses
- Validate inputs early, return 400 for bad requests
- Use `isPathSafe()` for path validation
- Return 403 for access denied

### Component Pattern
From `src/components/analysis-viewer.tsx`:
- Use `'use client'` directive
- Accept props with TypeScript interface
- Use `cn()` for conditional classes
- Use Lucide icons

### Modal Pattern
From `src/components/open-project-modal.tsx`:
- Use focus trap for accessibility
- Handle Escape key to close
- Provide clear cancel/confirm actions

## Dependencies

### Existing (no changes)
- `chokidar`: File watching (already configured)
- `lucide-react`: Icons
- `@/lib/path-utils`: Path validation

### New (none required)
All functionality can be implemented with existing dependencies.

## Testing Strategy

### Unit Tests
- `parseAnalysis()` with multiple files
- Filename timestamp extraction
- Sorting by date

### Integration Tests
- API endpoint save/delete operations
- Path validation rejection

### Manual Testing
- Save analysis from UI
- View history list
- Delete report with confirmation
- Real-time update after save
