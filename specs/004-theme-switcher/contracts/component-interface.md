# Component Interface: Theme Switcher

**Input**: [spec.md](../spec.md), [data-model.md](../data-model.md)
**Date**: 2025-12-30

## Components

### ThemeToggle

A button component that cycles through theme options (Light → Dark → System).

**Location**: `src/components/theme-toggle.tsx`

#### Props

```typescript
interface ThemeToggleProps {
  /** Optional CSS class name for styling */
  className?: string;
}
```

#### Usage

```tsx
import { ThemeToggle } from '@/components/theme-toggle';

// Basic usage
<ThemeToggle />

// With custom styling
<ThemeToggle className="absolute top-4 right-4" />
```

#### Behavior

| Action | Result |
|--------|--------|
| Click when Light | Switch to Dark |
| Click when Dark | Switch to System |
| Click when System | Switch to Light |
| Keyboard Enter/Space | Same as click |

#### Accessibility

| Attribute | Value |
|-----------|-------|
| `role` | `button` |
| `aria-label` | Dynamic: "Switch to dark theme", "Switch to light theme", "Switch to system theme" |
| `tabIndex` | `0` |

#### Visual States

| Theme | Icon | Label (sr-only) |
|-------|------|-----------------|
| Light | Sun icon | "Light mode active" |
| Dark | Moon icon | "Dark mode active" |
| System | Monitor icon | "System mode active" |

---

## Utility Functions

### Location: `src/lib/theme.ts`

#### getTheme

Returns the current theme preference from localStorage.

```typescript
function getTheme(): Theme;
```

**Returns**: `'light' | 'dark' | 'system'` (defaults to `'system'` if not set)

#### setTheme

Persists theme preference and applies it to the DOM.

```typescript
function setTheme(theme: Theme): void;
```

**Side Effects**:
- Updates `localStorage.theme`
- Sets `data-theme` attribute on `<html>`
- Dispatches custom event `theme-change`

#### getSystemTheme

Detects the operating system's theme preference.

```typescript
function getSystemTheme(): ResolvedTheme;
```

**Returns**: `'light' | 'dark'` based on `prefers-color-scheme` media query

#### resolveTheme

Resolves the actual theme to apply (handles 'system' option).

```typescript
function resolveTheme(theme: Theme): ResolvedTheme;
```

**Logic**:
- If `theme === 'system'`, returns `getSystemTheme()`
- Otherwise returns `theme` as-is

---

## Store Extension

### Location: `src/lib/store.ts`

Extend the existing Zustand store with theme state.

```typescript
interface StoreState {
  // ... existing state

  // Theme state
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}
```

#### Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `setTheme` | `theme: Theme` | Updates theme preference, persists to localStorage, applies to DOM |

#### Selectors

```typescript
// Get current theme preference
const theme = useStore((state) => state.theme);

// Get resolved theme (actual applied theme)
const resolvedTheme = useStore((state) => state.resolvedTheme);

// Get theme setter
const setTheme = useStore((state) => state.setTheme);
```

---

## FOUC Prevention Script

### Location: `src/app/layout.tsx`

The FOUC prevention script must be placed in `<head>` before any stylesheets. Use Next.js Script component with `beforeInteractive` strategy or a separate script file.

**Script Logic** (place in `public/theme-init.js` or inline via Script component):

```typescript
// Theme initialization - runs before page render
(function() {
  try {
    const theme = localStorage.getItem('theme') || 'system';
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
```

**Implementation Options**:
1. Use Next.js `<Script strategy="beforeInteractive" src="/theme-init.js" />`
2. Use a custom `_document.tsx` with inline script (requires careful handling)

---

## Event Handling

### System Theme Change Listener

```typescript
// In ThemeToggle or a useEffect in layout
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    const { theme, setTheme } = useStore.getState();
    if (theme === 'system') {
      // Re-apply to update resolvedTheme
      setTheme('system');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);
```

---

## Integration Points

### Layout Integration

```tsx
// src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script strategy="beforeInteractive" src="/theme-init.js" />
      </head>
      <body>
        <ThemeToggle className="fixed top-4 right-4 z-50" />
        {children}
      </body>
    </html>
  );
}
```

### CSS Variable Usage

Components use CSS variables that automatically update with theme:

```tsx
// Example component using theme-aware colors
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    Content
  </Card>
</div>
```
