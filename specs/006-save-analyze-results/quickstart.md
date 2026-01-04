# Quickstart: Save Analyze Results

**Feature**: 006-save-analyze-results
**Date**: 2026-01-03

## Prerequisites

- Node.js 18+ installed
- SpecBoard development environment set up
- Feature branch `006-save-analyze-results` checked out

## Setup Steps

### 1. Verify Branch

```bash
git checkout 006-save-analyze-results
git pull origin 006-save-analyze-results
```

### 2. Install Dependencies

No new dependencies required. All functionality uses existing packages.

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

## Development

### Key Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `AnalysisReport` interface, update `FeatureAnalysis` |
| `src/lib/parser.ts` | Update `parseAnalysis()` for multi-file support |
| `src/app/api/analysis/route.ts` | NEW: Create POST/DELETE endpoints |
| `src/components/analysis-viewer.tsx` | Add history list, save button, delete |
| `src/components/analysis-save-modal.tsx` | NEW: Modal for saving analysis |

### Implementation Order

1. **Types** - Update `FeatureAnalysis` type with `reports` array
2. **Parser** - Modify `parseAnalysis()` to read multiple files
3. **API** - Create `/api/analysis` endpoint
4. **UI** - Update `AnalysisViewer`, create `AnalysisSaveModal`
5. **Tests** - Add unit tests for parser changes

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/lib/parser.test.ts

# Run tests in watch mode
pnpm test --watch
```

## Verification Checklist

- [ ] Types compile without errors (`pnpm tsc --noEmit`)
- [ ] Parser correctly reads multiple analysis files
- [ ] API endpoint saves files with correct timestamp format
- [ ] API endpoint deletes files correctly
- [ ] UI shows analysis history list
- [ ] UI allows selecting different reports
- [ ] Save modal accepts and validates content
- [ ] Delete confirmation works
- [ ] Real-time updates work via SSE
- [ ] Path validation prevents directory traversal

## Key Files Created

After implementation, the following new files will exist:

```text
src/
├── app/api/analysis/route.ts      # API endpoint
└── components/analysis-save-modal.tsx  # Save modal

tests/
└── unit/analysis-parser.test.ts   # Parser tests
```

## Browser Support

### Tested Browsers
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### Required Features
- Fetch API (for API calls)
- EventSource (for SSE updates)
- ES2020+ JavaScript
