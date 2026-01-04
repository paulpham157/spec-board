# Quickstart: Theme Switcher

**Input**: [plan.md](./plan.md), [contracts/component-interface.md](./contracts/component-interface.md)
**Date**: 2025-12-30

## Overview

This guide covers implementing the Theme Switcher feature, which provides Light, Dark, and System theme options with localStorage persistence and FOUC prevention.

## Prerequisites

- Node.js 18+
- pnpm installed
- Existing Next.js 16.x project with Tailwind CSS 4.x and Zustand 5.x

## Implementation Steps

### Step 1: Add Theme Types

Add the theme types to your types file:

```typescript
// src/types/index.ts

/** User's theme preference */
export type Theme = 'light' | 'dark' | 'system';

/** Resolved theme applied to UI */
export type ResolvedTheme = 'light' | 'dark';
```

### Step 2: Create Theme Utilities

Create the theme utility functions:

```typescript
// src/lib/theme.ts
import type { Theme, ResolvedTheme } from '@/types';

const STORAGE_KEY = 'theme';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

export function setTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}
```

### Step 3: Extend Zustand Store

Add theme state to your existing store:

```typescript
// src/lib/store.ts
import { create } from 'zustand';
import type { Theme, ResolvedTheme } from '@/types';
import { getTheme, setTheme as applyTheme, resolveTheme } from './theme';

interface StoreState {
  // ... existing state
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const useStore = create<StoreState>((set) => ({
  // ... existing state
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme, resolvedTheme: resolveTheme(theme) });
  },
}));
```

### Step 4: Create ThemeToggle Component

```typescript
// src/components/theme-toggle.tsx
'use client';

import { useStore } from '@/lib/store';
import type { Theme } from '@/types';

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];

const THEME_ICONS: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  system: '💻',
};

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useStore();

  const nextTheme = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % 3];

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={className}
      aria-label={`Current theme: ${THEME_LABELS[theme]}. Click to switch to ${THEME_LABELS[nextTheme]}`}
    >
      <span aria-hidden="true">{THEME_ICONS[theme]}</span>
      <span className="sr-only">{THEME_LABELS[theme]} mode</span>
    </button>
  );
}
```

### Step 5: Add FOUC Prevention Script

Create the initialization script:

```javascript
// public/theme-init.js
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
```

### Step 6: Update Layout

Add the script and component to your layout:

```tsx
// src/app/layout.tsx
import Script from 'next/script';
import { ThemeToggle } from '@/components/theme-toggle';

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

### Step 7: Add CSS Variables

Add theme CSS variables to your global styles:

```css
/* src/app/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  /* ... other variables */
}

[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  /* ... other variables */
}
```

## Testing

### Manual Testing

1. **Theme switching**: Click the toggle and verify UI updates immediately
2. **Persistence**: Select a theme, refresh the page, verify theme persists
3. **System preference**: Select "System", change OS theme, verify app updates
4. **No FOUC**: Refresh page and verify no flash of wrong theme

### Automated Testing

```typescript
// src/lib/theme.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTheme, getTheme } from './theme';

describe('theme utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resolves light theme', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  it('resolves dark theme', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('defaults to system when no preference stored', () => {
    expect(getTheme()).toBe('system');
  });
});
```

Run tests:

```bash
pnpm test src/lib/theme.test.ts
```

## Verification Checklist

- [ ] Three theme options available (Light, Dark, System)
- [ ] Theme changes apply immediately without page reload
- [ ] Theme preference persists across browser sessions
- [ ] System theme option follows OS preference
- [ ] No flash of incorrect theme on page load
- [ ] Theme toggle is keyboard accessible
- [ ] Both themes meet WCAG 2.1 AA contrast ratios
