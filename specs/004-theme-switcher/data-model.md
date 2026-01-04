# Data Model: Theme Switcher

**Input**: [spec.md](./spec.md), [research.md](./research.md)
**Date**: 2025-12-30

## Entities

### Theme (Union Type)

Represents the user's theme selection.

| Value | Description |
|-------|-------------|
| `'light'` | Light color scheme (light background, dark text) |
| `'dark'` | Dark color scheme (dark background, light text) |
| `'system'` | Follow operating system preference |

**TypeScript Definition**:
```typescript
// src/types/index.ts
export type Theme = 'light' | 'dark' | 'system';
```

### ResolvedTheme (Union Type)

The actual theme applied to the UI (system preference resolved).

| Value | Description |
|-------|-------------|
| `'light'` | Light color scheme applied |
| `'dark'` | Dark color scheme applied |

**TypeScript Definition**:
```typescript
// src/types/index.ts
export type ResolvedTheme = 'light' | 'dark';
```

### ThemeState (Interface)

State shape for theme management in Zustand store.

| Field | Type | Description |
|-------|------|-------------|
| `theme` | `Theme` | User's selected theme preference |
| `resolvedTheme` | `ResolvedTheme` | Actual theme applied (system resolved) |
| `setTheme` | `(theme: Theme) => void` | Action to update theme preference |

**TypeScript Definition**:
```typescript
// src/lib/store.ts
interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}
```

## Storage

### localStorage Schema

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `theme` | `Theme \| null` | `null` | Persisted theme preference |

**Storage Operations**:
```typescript
// Read
const stored = localStorage.getItem('theme') as Theme | null;

// Write
localStorage.setItem('theme', theme);

// Clear (reset to system default)
localStorage.removeItem('theme');
```

## CSS Variables

Theme colors are defined as CSS custom properties on `:root` and `[data-theme="dark"]`.

### Light Theme (Default)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
}
```

## State Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Action    │────▶│  Zustand Store   │────▶│  DOM Update     │
│  (click toggle) │     │  setTheme()      │     │  data-theme     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  localStorage    │
                        │  persist theme   │
                        └──────────────────┘
```

## Initialization Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Page Load      │────▶│  Inline Script   │────▶│  Apply Theme    │
│  (before CSS)   │     │  (in <head>)     │     │  (no FOUC)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌──────────────────┐
        │               │  Read localStorage│
        │               │  or system pref   │
        │               └──────────────────┘
        │
        ▼
┌─────────────────┐     ┌──────────────────┐
│  React Hydrate  │────▶│  Sync Store      │
│                 │     │  with DOM state  │
└─────────────────┘     └──────────────────┘
```

## Validation Rules

| Rule | Constraint |
|------|------------|
| Theme value | Must be one of: `'light'`, `'dark'`, `'system'` |
| Invalid localStorage | Treat as `null`, default to `'system'` |
| Missing matchMedia | Default to `'light'` when resolving system |
