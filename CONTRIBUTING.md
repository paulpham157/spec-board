# Contributing to SpecBoard

This guide covers development setup, architecture, and contribution guidelines.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Deployment](#deployment)
- [Code Style](#code-style)

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended)

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/specboard"
PORT=3000  # Optional, defaults to 3000
```

### Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run tests (watch mode)
pnpm test:run         # Run tests once
pnpm test:coverage    # Run tests with coverage

# Type checking
pnpm tsc --noEmit

# Database
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate dev   # Run migrations
pnpm prisma generate  # Regenerate client
```

## Project Structure

```
spec-board/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── projects/  # Project CRUD API
│   │   │   ├── project/   # Spec data loading
│   │   │   ├── browse/    # File browser
│   │   │   └── watch/     # SSE real-time updates
│   │   ├── projects/
│   │   │   └── [name]/    # Dynamic project routes
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── kanban-board.tsx
│   │   ├── feature-detail.tsx
│   │   ├── dashboard-metrics.tsx
│   │   └── ...
│   ├── lib/               # Utilities and business logic
│   │   ├── parser.ts      # Markdown file parser
│   │   ├── store.ts       # Zustand state
│   │   ├── path-utils.ts  # Path validation
│   │   └── utils.ts       # General utilities
│   └── types/             # TypeScript types
└── docs/                  # Additional documentation
```

## Architecture

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| Parser | `src/lib/parser.ts` | Parse spec-kit markdown files |
| Store | `src/lib/store.ts` | Zustand state management |
| Path Utils | `src/lib/path-utils.ts` | Path validation and security |

### Data Flow

1. User opens project via path
2. `/api/project` loads and parses spec-kit files
3. Zustand store holds project state
4. Components render from store
5. `/api/watch` provides real-time updates via SSE

### URL Structure

| Route | Description |
|-------|-------------|
| `/` | Home - recent projects and "Open Project" button |
| `/projects/:encodedPath` | Project board view (path is URL-encoded) |
| `/projects/:encodedPath/features/:id` | Feature detail view |

## API Reference

### Projects CRUD

```bash
# List all projects
GET /api/projects

# Create project
POST /api/projects
Content-Type: application/json
{ "name": "slug", "displayName": "Name", "filePath": "/path" }

# Get project by slug
GET /api/projects/:name

# Update project
PUT /api/projects/:name
Content-Type: application/json
{ "displayName": "New Name", "filePath": "/new/path" }

# Delete project
DELETE /api/projects/:name
```

### Spec Data

```bash
# Load and parse spec-kit project
GET /api/project?path=/path/to/project
```

**Response:** Full `Project` object with features, tasks, constitution, etc.

### File Browser

```bash
# List directory contents
GET /api/browse?path=/path/to/dir
```

**Response:**
```json
{
  "path": "/path/to/dir",
  "entries": [
    {
      "name": "my-project",
      "path": "/path/to/dir/my-project",
      "isDirectory": true,
      "isSpecKit": true
    }
  ]
}
```

### Real-time Updates

```bash
# Server-Sent Events stream
GET /api/watch?path=/path/to/project
```

**Events:** `update` (project data), `error`, `connected`

### Security Features

- **Path Traversal Protection**: Browse API restricts access to user directories only
- **Input Validation**: Project names validated against URL-safe slug pattern
- **File Path Validation**: PUT endpoint verifies directory existence
- **XSS Prevention**: Markdown content sanitized with DOMPurify

## Accessibility

SpecBoard is built with WCAG 2.2 AA compliance.

### Keyboard Navigation

| Context | Key | Action |
|---------|-----|--------|
| Kanban Board | `Tab` | Navigate cards |
| Kanban Board | `Enter` | Open feature detail |
| Feature Modal | `Escape` | Close modal |
| Feature Modal | `1-8` | Switch tabs |
| Feature Modal | `Arrow keys` | Navigate tabs |
| Project Selector | `Arrow keys` | Navigate directories |
| Project Selector | `Enter` | Select directory |

### Screen Reader Support

- ARIA roles and labels on all interactive elements
- Live regions for dynamic content announcements
- Semantic HTML structure with proper headings

### Accessibility Utilities

Located in `src/lib/accessibility/`:

```typescript
// Focus trapping for modals
import { useFocusTrap } from '@/lib/accessibility';
useFocusTrap(modalRef, isOpen, { initialFocusRef });

// Screen reader announcements
import { announce } from '@/lib/accessibility';
announce('Item selected', 'polite');
```

## Testing

### Running Tests

```bash
pnpm test             # Watch mode
pnpm test:run         # Single run
pnpm test:coverage    # With coverage report
```

### Test Files

Tests are co-located with source files:
- `src/lib/parser.test.ts`
- `src/lib/path-utils.test.ts`
- `src/lib/utils.test.ts`

## Deployment

### Docker (Recommended)

```bash
# Start everything (app + database)
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

**Environment Variables** (optional, defaults shown):

```bash
POSTGRES_USER=specboard
POSTGRES_PASSWORD=specboard
POSTGRES_DB=specboard
POSTGRES_PORT=5432
APP_PORT=3000
```

**Volume Mounts**: The app container mounts your home directory read-only to access spec-kit projects.

### PM2 (Process Manager)

```bash
# Build first
pnpm build

# Start with PM2
pm2 start ecosystem.config.cjs

# View logs
pm2 logs specboard

# Other commands
pm2 status              # Check status
pm2 restart specboard   # Restart
pm2 stop specboard      # Stop
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure `DATABASE_URL` environment variable
3. Run `pnpm prisma migrate deploy`
4. Run `pnpm build && pnpm start`
5. Deploy to Vercel, Railway, or your preferred platform

## Code Style

### Naming Conventions

| Type | Convention |
|------|------------|
| Files | `kebab-case.ts` |
| Components | `kebab-case.tsx` |
| Functions | `camelCase` |
| Types/Interfaces | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |

### Component Structure

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Feature } from '@/types';

interface Props {
  feature: Feature;
  onClose: () => void;
}

export function FeatureDetail({ feature, onClose }: Props) {
  // Implementation
}
```

### Styling

- Use Tailwind CSS with `cn()` utility for conditional classes
- Use CSS variables for theming: `var(--foreground)`, `var(--border)`, etc.
- Icons from `lucide-react`

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit PR with clear description
