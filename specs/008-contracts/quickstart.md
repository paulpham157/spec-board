# Quickstart: Enhanced Contracts Viewer

**Feature**: 008-contracts
**Date**: 2026-01-03

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Existing spec-board project cloned and set up
- PostgreSQL database running (for existing project functionality)

## Setup Steps

### 1. Install New Dependency

```bash
pnpm add prism-react-renderer
```

### 2. Create Contract Parser

Create the new parser file at `src/lib/markdown/contract-parser.ts`:

```typescript
// Contract metadata and section parsing utilities
// See data-model.md for type definitions
```

### 3. Create CodeBlock Component

Create the new component at `src/components/code-block.tsx`:

```typescript
// Syntax-highlighted code block with copy functionality
// Uses prism-react-renderer for highlighting
```

### 4. Update ContractsViewer Component

Modify `src/components/contracts-viewer.tsx` to:
- Import and use the new CodeBlock component
- Add ContractMetadataHeader component
- Add ContractSectionNav component
- Integrate contract-parser utilities

### 5. Add Types

Add new types to `src/types/index.ts`:
- ContractMetadata
- ContractSection
- CodeBlock
- ParsedContract
- ContractType

## Development Commands

### Run Development Server

```bash
pnpm dev
```

### Run Tests

```bash
pnpm test
```

### Run Type Check

```bash
pnpm tsc --noEmit
```

### Run Linter

```bash
pnpm lint
```

## Verification Checklist

- [ ] prism-react-renderer installed successfully
- [ ] Contract parser extracts metadata correctly
- [ ] Code blocks display with syntax highlighting
- [ ] Copy button appears on hover
- [ ] "Copied!" confirmation displays after copy
- [ ] Light/dark theme switching works for code blocks
- [ ] Section navigation scrolls to correct section
- [ ] Existing expand/collapse behavior preserved
- [ ] All tests pass
- [ ] No TypeScript errors

## Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/markdown/contract-parser.ts` | CREATE | Parse contract metadata and sections |
| `src/components/code-block.tsx` | CREATE | Syntax-highlighted code block |
| `src/components/contracts-viewer.tsx` | MODIFY | Integrate new components |
| `src/types/index.ts` | MODIFY | Add contract types |
| `src/lib/utils.ts` | MODIFY | Add copyToClipboard utility |

## Browser Support

### Clipboard API

- Chrome 66+
- Firefox 63+
- Safari 13.1+
- Edge 79+

Fallback provided for older browsers using `document.execCommand('copy')`.

### Syntax Highlighting

- All modern browsers supported
- No special requirements (pure JavaScript/CSS)
