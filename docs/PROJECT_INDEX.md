# Project Index - SpecBoard

> Visual dashboard for spec-kit task management with shareable links and real-time updates.

## Quick Navigation

| Category | Location |
|----------|----------|
| **Entry Point** | `src/app/page.tsx` |
| **API Routes** | `src/app/api/` |
| **Components** | `src/components/` |
| **Business Logic** | `src/lib/` |
| **Types** | `src/types/index.ts` |
| **Database Schema** | `prisma/schema.prisma` |
| **Configuration** | `package.json`, `tsconfig.json`, `next.config.ts` |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.9 |
| **Database** | PostgreSQL + Prisma ORM |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Testing** | Vitest |
| **Package Manager** | pnpm |

## Directory Structure

```
spec-board/
├── prisma/
│   ├── schema.prisma          # Database schema (Project model)
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── browse/        # File browser API
│   │   │   ├── project/       # Spec data loading
│   │   │   ├── projects/      # Project CRUD
│   │   │   └── watch/         # SSE real-time updates
│   │   ├── projects/          # Project pages
│   │   │   └── [name]/        # Dynamic project routes
│   │   │       └── features/  # Feature detail pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components (18 files)
│   │   ├── kanban-board.tsx   # Feature pipeline board
│   │   ├── feature-detail.tsx # Feature modal with tabs
│   │   ├── dashboard-metrics.tsx
│   │   ├── recent-projects-list.tsx
│   │   ├── open-project-modal.tsx
│   │   └── ...
│   ├── lib/                   # Utilities and business logic
│   │   ├── parser.ts          # Markdown file parser (core)
│   │   ├── store.ts           # Zustand state management
│   │   ├── path-utils.ts      # Path validation/security
│   │   ├── utils.ts           # General utilities
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── accessibility/     # A11y utilities
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── agent-includes/
│   └── specs/                 # Specification documents
├── coverage/                  # Test coverage reports
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── ecosystem.config.cjs       # PM2 configuration
└── vitest.config.ts           # Test configuration
```

## Key Files

### Entry Points

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page - recent projects + open project button |
| `src/app/layout.tsx` | Root layout with metadata |
| `src/app/projects/[name]/page.tsx` | Project dashboard view |

### API Routes

| Route | File | Purpose |
|-------|------|---------|
| `GET /api/projects` | `src/app/api/projects/route.ts` | List all projects |
| `POST /api/projects` | `src/app/api/projects/route.ts` | Create project |
| `GET /api/projects/:name` | `src/app/api/projects/[name]/route.ts` | Get project |
| `PUT /api/projects/:name` | `src/app/api/projects/[name]/route.ts` | Update project |
| `DELETE /api/projects/:name` | `src/app/api/projects/[name]/route.ts` | Delete project |
| `GET /api/project` | `src/app/api/project/route.ts` | Load spec data |
| `GET /api/browse` | `src/app/api/browse/route.ts` | Browse directories |
| `GET /api/watch` | `src/app/api/watch/route.ts` | SSE real-time updates |

### Core Business Logic

| File | Purpose |
|------|---------|
| `src/lib/parser.ts` | Parse spec-kit markdown files (tasks, specs, plans, constitution) |
| `src/lib/store.ts` | Zustand store for client state + recent projects |
| `src/lib/path-utils.ts` | Path validation and security utilities |
| `src/lib/utils.ts` | General utilities (cn, colors, stage helpers) |

### Components (by category)

**Home Page:**
- `recent-projects-list.tsx` - Recent projects with metadata
- `open-project-modal.tsx` - Project search modal

**Project Dashboard:**
- `kanban-board.tsx` - 3-column Kanban board
- `dashboard-metrics.tsx` - Stats cards and charts
- `constitution-panel.tsx` - Project principles display

**Feature Display:**
- `feature-detail.tsx` - Modal with tabbed feature details
- `task-group.tsx` - Tasks grouped by user story
- `spec-viewer.tsx`, `plan-viewer.tsx` - Content viewers

**Utilities:**
- `markdown-renderer.tsx` - Safe markdown-to-HTML
- `tooltip.tsx` - Tooltip component
- `priority-badge.tsx` - P1/P2/P3 badges

## Database Schema

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String   @unique  // URL slug
  displayName String
  filePath    String   // Local path to spec files
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Dependencies

### Production
- `next` - React framework
- `react`, `react-dom` - UI library
- `@prisma/client` - Database ORM
- `zustand` - State management
- `recharts` - Charts
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `gray-matter` - Markdown frontmatter
- `remark`, `remark-html` - Markdown processing
- `dompurify` - XSS prevention
- `chokidar` - File watching
- `ws` - WebSocket support

### Development
- `vitest` - Testing
- `prisma` - Database tooling
- `typescript` - Type checking

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests (watch mode)
pnpm test:run     # Run tests once
pnpm test:coverage # Run tests with coverage
pnpm lint         # Run ESLint
```

## Generated CLAUDE.md Files

- `src/components/CLAUDE.md` - Components documentation
- `src/lib/CLAUDE.md` - Library documentation
- `src/app/CLAUDE.md` - App router documentation
- `src/app/api/CLAUDE.md` - API routes documentation
- `src/types/CLAUDE.md` - Types documentation
- `src/lib/accessibility/CLAUDE.md` - Accessibility utilities documentation

---

*Generated by /codebase command on 2025-12-29*
