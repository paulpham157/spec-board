# Quickstart: Checklists Interaction

**Feature**: 009-checklists-interaction
**Date**: 2026-01-03

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`pnpm install`)
- Existing spec-board development environment
- At least one feature with checklists in `specs/<feature>/checklists/`

## Setup Steps

### 1. Verify Existing Checklist Files

Ensure you have checklist files to test with:

```bash
# List existing checklists
find specs -name "*.md" -path "*/checklists/*" | head -5
```

Expected output:
```
specs/001-kanban-board/checklists/requirements.md
specs/002-sse-file-tracking/checklists/requirements.md
...
```

### 2. Create Test Checklist (if needed)

If no checklists exist, create a test file:

```bash
mkdir -p specs/001-kanban-board/checklists
```

Then create `specs/001-kanban-board/checklists/test.md`:
```markdown
# Test Checklist

## Items

- [ ] First unchecked item
- [x] Already checked item
- [ ] Another unchecked item
```

### 3. Start Development Server

```bash
pnpm dev
```

### 4. Open a Project with Checklists

1. Navigate to `http://localhost:3000`
2. Open a project that has features with checklists
3. Click on a feature card to open the detail view
4. Navigate to the "Checklists" tab

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm test` | Run all tests |
| `pnpm test src/lib/checklist-utils.test.ts` | Run checklist-specific tests |
| `pnpm lint` | Run linter |
| `pnpm build` | Production build |

## Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/checklist/route.ts` | CREATE | PATCH endpoint for toggling |
| `src/lib/checklist-utils.ts` | CREATE | Toggle logic, markdown manipulation |
| `src/components/checklist-viewer.tsx` | MODIFY | Add click handlers, loading states |
| `src/types/index.ts` | MODIFY | Add ChecklistToggleRequest type |
| `tests/lib/checklist-utils.test.ts` | CREATE | Unit tests for toggle logic |

## Verification Checklist

After implementation, verify:

- [ ] Clicking a checkbox toggles its visual state immediately
- [ ] The underlying markdown file is updated within 2 seconds
- [ ] Progress indicators update when items are toggled
- [ ] Keyboard navigation works (Tab to focus, Space/Enter to toggle)
- [ ] Error messages appear when save fails
- [ ] Rapid clicks are debounced (only one API call per 300ms)
- [ ] Screen reader announces checkbox state changes

## Testing the API

Test the PATCH endpoint directly:

```bash
# Toggle an item (replace with actual path and line number)
curl -X PATCH http://localhost:3000/api/checklist \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/path/to/specs/001-feature/checklists/requirements.md",
    "lineIndex": 8,
    "expectedState": false
  }'
```

Expected response:
```json
{
  "success": true,
  "newState": true,
  "content": "# Checklist\n\n- [x] Toggled item\n..."
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Toggle doesn't persist | Check file permissions, verify API response |
| UI doesn't update | Check browser console for errors |
| Conflict errors | File was modified externally; refresh the page |
| 404 on API call | Ensure `/api/checklist/route.ts` exists |
| Type errors | Run `pnpm tsc` to check TypeScript compilation |
