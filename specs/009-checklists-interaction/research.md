# Research: Checklists Interaction

**Feature**: 009-checklists-interaction
**Date**: 2026-01-03

## Research Tasks

### 1. Markdown Checkbox Toggle Pattern

**Decision**: Use regex-based line replacement to toggle checkbox state

**Rationale**:
- Checklist items follow a consistent format: `- [ ] text` or `- [x] text`
- Line-by-line replacement is safe and predictable
- Preserves all other content (tags, formatting, special characters)
- No need for full markdown AST parsing

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Full markdown parser (remark) | Overkill for simple checkbox toggle; may alter formatting |
| String replace on entire file | Risk of unintended replacements if text contains checkbox patterns |
| Character position replacement | Fragile if file is modified externally |

**Implementation Pattern**:
```typescript
// Toggle pattern: find line by index, replace checkbox marker
const toggleCheckbox = (content: string, lineIndex: number): string => {
  const lines = content.split('\n');
  const line = lines[lineIndex];

  // Match: - [ ] or - [x] or - [X]
  const uncheckedPattern = /^(\s*-\s*)\[ \](.*)$/;
  const checkedPattern = /^(\s*-\s*)\[[xX]\](.*)$/;

  if (uncheckedPattern.test(line)) {
    lines[lineIndex] = line.replace(uncheckedPattern, '$1[x]$2');
  } else if (checkedPattern.test(line)) {
    lines[lineIndex] = line.replace(checkedPattern, '$1[ ]$2');
  }

  return lines.join('\n');
};
```

---

### 2. API Design for File Updates

**Decision**: PATCH endpoint at `/api/checklist` with path validation

**Rationale**:
- PATCH is semantically correct for partial updates
- Follows existing API patterns in the codebase
- Reuses `isPathSafe()` from `path-utils.ts` for security
- Returns updated content for UI sync

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| PUT (full replacement) | Semantically incorrect; we're updating one line |
| WebSocket | Overkill for single-user scenario; adds complexity |
| Direct file write from client | Security risk; bypasses server validation |

**API Contract**:
```typescript
// Request
PATCH /api/checklist
{
  filePath: string;      // Absolute path to checklist file
  lineIndex: number;     // 0-based line number to toggle
  expectedState: boolean; // Current state (for conflict detection)
}

// Response (success)
{
  success: true;
  newState: boolean;
  content: string;       // Updated file content
}

// Response (conflict)
{
  success: false;
  error: 'conflict';
  message: string;
  currentState: boolean;
}
```

---

### 3. Optimistic UI Update Strategy

**Decision**: Immediate local state update with rollback on failure

**Rationale**:
- Provides instant feedback (<100ms perceived latency)
- React state update is synchronous
- Rollback is straightforward (restore previous state)
- Matches user expectation for checkbox interactions

**Implementation Pattern**:
```typescript
const handleToggle = async (itemIndex: number, sectionIndex: number) => {
  // 1. Capture current state for rollback
  const previousState = items[sectionIndex][itemIndex].checked;

  // 2. Optimistic update
  setItems(prev => {
    const next = [...prev];
    next[sectionIndex][itemIndex].checked = !previousState;
    return next;
  });

  // 3. Persist to server
  try {
    await toggleChecklistItem(filePath, lineIndex, previousState);
  } catch (error) {
    // 4. Rollback on failure
    setItems(prev => {
      const next = [...prev];
      next[sectionIndex][itemIndex].checked = previousState;
      return next;
    });
    showError('Failed to save. Please try again.');
  }
};
```

---

### 4. Debouncing Strategy

**Decision**: Per-item debounce with 300ms delay

**Rationale**:
- Prevents rapid-fire API calls from double-clicks
- 300ms is fast enough to feel responsive
- Per-item tracking allows concurrent toggles on different items
- Uses `Map<string, NodeJS.Timeout>` for tracking

**Implementation Pattern**:
```typescript
const debounceMap = useRef(new Map<string, NodeJS.Timeout>());

const debouncedToggle = (itemKey: string, toggleFn: () => Promise<void>) => {
  // Clear existing timeout for this item
  const existing = debounceMap.current.get(itemKey);
  if (existing) clearTimeout(existing);

  // Set new timeout
  const timeout = setTimeout(() => {
    toggleFn();
    debounceMap.current.delete(itemKey);
  }, 300);

  debounceMap.current.set(itemKey, timeout);
};
```

---

### 5. Accessibility Implementation

**Decision**: Use native checkbox semantics with ARIA enhancements

**Rationale**:
- `role="checkbox"` with `aria-checked` provides screen reader support
- `tabIndex={0}` enables keyboard focus
- Space/Enter handlers match native checkbox behavior
- Follows existing accessibility patterns in the codebase (see `useFocusTrap`)

**Implementation Pattern**:
```typescript
<div
  role="checkbox"
  aria-checked={item.checked}
  aria-label={`${item.text}, ${item.checked ? 'checked' : 'unchecked'}`}
  tabIndex={0}
  onClick={() => handleToggle(index)}
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle(index);
    }
  }}
  className={cn(
    'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]',
    isLoading && 'opacity-50 pointer-events-none'
  )}
>
  {/* Checkbox icon and text */}
</div>
```

---

### 6. Line Index Tracking

**Decision**: Track line numbers during parsing, pass through component tree

**Rationale**:
- Parser already processes line-by-line
- Adding `lineIndex` to `ChecklistItem` interface is minimal change
- Enables precise file updates without re-parsing
- No performance impact (single pass during parse)

**Implementation**:
```typescript
interface ChecklistItem {
  text: string;
  checked: boolean;
  tag?: string;
  lineIndex: number;  // NEW: 0-based line number in source file
}

// In parseChecklistContent():
const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.+)$/);
if (checkboxMatch && currentSection) {
  currentSection.items.push({
    text: text,
    checked: checked,
    tag: tag,
    lineIndex: lineNumber  // Track during parsing
  });
}
```

---

## Summary

All research tasks resolved. No NEEDS CLARIFICATION items remain.

| Task | Decision | Confidence |
|------|----------|------------|
| Markdown toggle | Regex line replacement | High |
| API design | PATCH /api/checklist | High |
| Optimistic UI | Local state + rollback | High |
| Debouncing | Per-item 300ms | High |
| Accessibility | role="checkbox" + ARIA | High |
| Line tracking | Parse-time lineIndex | High |
