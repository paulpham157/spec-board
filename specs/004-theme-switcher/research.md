# Research: Theme Switcher

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)
**Date**: 2025-12-30
**Status**: Complete

## Technology Decisions

### 1. Theme Storage Mechanism

**Decision**: localStorage

**Alternatives Considered**:
| Option | Pros | Cons |
|--------|------|------|
| localStorage | Simple, synchronous, persists across sessions | Not available in SSR, 5MB limit |
| Cookies | Available in SSR, sent with requests | Overhead on every request, complex API |
| IndexedDB | Large storage, async | Overkill for single string value |
| URL parameter | Shareable, bookmarkable | Pollutes URLs, not persistent |

**Rationale**: localStorage is the standard approach for client-side preferences. It's synchronous (important for FOUC prevention), simple to use, and persists indefinitely. The 5MB limit is irrelevant for storing a single theme string.

### 2. CSS Theming Approach

**Decision**: CSS Variables with `data-theme` attribute on `<html>`

**Alternatives Considered**:
| Option | Pros | Cons |
|--------|------|------|
| CSS Variables + data attribute | Native CSS, no runtime overhead, works with Tailwind | Requires variable definitions |
| Tailwind `dark:` classes | Built-in Tailwind support | Requires class changes on every element |
| CSS-in-JS (styled-components) | Component-scoped | Runtime overhead, bundle size |
| Separate CSS files | Complete isolation | Flash on load, duplicate styles |

**Rationale**: CSS variables provide the best balance of performance and maintainability. Setting `data-theme="dark"` on `<html>` allows all components to inherit theme colors without prop drilling. Tailwind CSS 4.x integrates well with CSS variables.

### 3. System Theme Detection

**Decision**: `prefers-color-scheme` media query with `matchMedia` listener

**Implementation**:
```typescript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', handleSystemThemeChange);
```

**Browser Support**: All modern browsers (Chrome 76+, Firefox 67+, Safari 12.1+, Edge 79+)

**Fallback**: If `matchMedia` is unavailable, default to light theme and hide "System" option.

### 4. FOUC Prevention Strategy

**Decision**: Inline script in `<head>` before any CSS loads

**Approach**:
```html
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  })();
</script>
```

**Why inline**: External scripts are render-blocking but may load after initial paint. Inline scripts in `<head>` execute synchronously before any content renders.

### 5. State Management

**Decision**: Extend existing Zustand store

**Alternatives Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Zustand (existing) | Already in project, simple API | Adds to existing store |
| React Context | Built-in, no dependencies | Requires provider, re-renders |
| Jotai/Recoil | Atomic state | New dependency |
| Component state | Simplest | Can't share across components |

**Rationale**: The project already uses Zustand 5.x. Adding theme state to the existing store maintains consistency and avoids new dependencies.

## Implementation Notes

### Theme Toggle Component

The toggle will cycle through three states: Light → Dark → System → Light...

A dropdown or segmented control provides better UX than a simple toggle for three options, but a cycling button is simpler to implement and sufficient for MVP.

### Transition Animation

CSS transitions on `background-color` and `color` properties provide smooth theme changes:

```css
* {
  transition: background-color 150ms ease-in-out, color 150ms ease-in-out;
}
```

**Consideration**: Disable transitions on initial load to prevent animation when applying saved theme.

### Accessibility

- Theme toggle must have `aria-label` describing current state
- Both themes must meet WCAG 2.1 AA contrast ratios (4.5:1 normal text, 3:1 large text)
- Theme changes should not trigger motion for users with `prefers-reduced-motion`

## Open Questions (Resolved)

All questions from spec.md edge cases have been resolved:

1. **Browser doesn't support system theme detection?** → Default to light, hide "System" option
2. **localStorage unavailable?** → Function normally, default to system preference each visit
3. **Initial visit with no preference?** → Use system preference if detectable, else light

## References

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Josh Comeau: The Quest for the Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/)
