# Research: Enhanced Contracts Viewer

**Feature**: 008-contracts
**Date**: 2026-01-03

## Technology Decisions

### 1. Syntax Highlighting Library

**Decision**: Use `prism-react-renderer`

**Rationale**:
- Lightweight bundle (~15KB gzipped) compared to Shiki (~200KB+)
- Native React integration via render props pattern
- Built-in VSCode-inspired themes (dracula, vsDark, vsLight, etc.)
- TypeScript support out of the box
- No async loading required - synchronous highlighting
- Well-maintained by Formidable Labs

**Alternatives Considered**:

| Library | Reason Not Chosen |
|---------|-------------------|
| Shiki | Larger bundle size, async loading complexity, overkill for this use case |
| highlight.js | No native React integration, requires unsafe HTML injection |
| react-syntax-highlighter | Heavier bundle, wraps Prism/highlight.js with extra overhead |

**Implementation Pattern**:

The library uses a render props pattern that returns safe React elements directly - no HTML string injection needed. Each token is rendered as a proper React span element with styles applied via props.

### 2. Theme Strategy for Light/Dark Mode

**Decision**: Use theme switching based on system/user preference

**Rationale**:
- Project already has dark mode support via CSS variables
- prism-react-renderer provides matching light/dark themes
- Can detect theme via existing theme context or CSS media query

**Implementation**:
- Light mode: `themes.vsLight` or `themes.github`
- Dark mode: `themes.vsDark` or `themes.dracula`
- Theme selection via React context or `useTheme()` hook if available

### 3. Contract Metadata Parsing

**Decision**: Parse YAML-style metadata from markdown header

**Rationale**:
- Existing contracts use consistent format: `**Field**: Value`
- No need for full YAML parser - simple regex extraction
- Matches existing parser patterns in `src/lib/markdown/`

**Fields to Extract**:
- Feature (string)
- Date (string)
- Type (string) - "React Component Interface", "REST API", etc.
- Endpoint (string, optional)
- Base Path (string, optional)

### 4. Section Navigation

**Decision**: Extract H2 headings for mini table of contents

**Rationale**:
- Contracts use H2 (`##`) for major sections
- Consistent with existing markdown structure
- Simple scroll-to-section implementation

**Implementation**:
- Parse H2 headings from markdown
- Generate anchor IDs from heading text
- Render as clickable links that scroll to section

### 5. Copy to Clipboard

**Decision**: Use native Clipboard API with fallback

**Rationale**:
- Modern browsers support `navigator.clipboard.writeText()`
- No external library needed
- Fallback to `document.execCommand('copy')` for older browsers

## Dependencies

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| prism-react-renderer | ^2.x | Syntax highlighting for code blocks |

### Existing Dependencies (No Changes)

- DOMPurify - Already used for sanitization
- remark/remark-gfm/remark-html - Already used for markdown parsing
- Lucide React - Already used for icons (Copy, Check icons)

## Security Considerations

1. **XSS Prevention**: All rendered content passes through DOMPurify (existing pattern)
2. **Code Block Content**: prism-react-renderer renders safe React elements, not HTML strings
3. **Clipboard Access**: Uses standard browser API, no elevated permissions

## Accessibility Considerations

1. **Copy Button**: Include `aria-label="Copy code to clipboard"`
2. **Copy Confirmation**: Use `aria-live="polite"` for "Copied!" announcement
3. **Section Navigation**: Use proper heading hierarchy and skip links
4. **Keyboard Navigation**: Copy button focusable and activatable via Enter/Space

## Performance Considerations

1. **Lazy Highlighting**: Only highlight expanded contracts (existing expand/collapse)
2. **Memoization**: Memoize parsed metadata and highlighted code
3. **Bundle Size**: prism-react-renderer adds ~15KB gzipped (acceptable)
