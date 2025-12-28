# Project Index - SpecBoard

> Visual dashboard for spec-kit task management

## Quick Navigation

| Category | Location |
|----------|----------|
| Entry Point | `src/app/page.tsx` |
| API Routes | `src/app/api/` |
| Components | `src/components/` |
| Utilities | `src/lib/` |
| Types | `src/types/index.ts` |
| Database | `prisma/schema.prisma` |
| Config | `package.json`, `next.config.ts` |

## Directory Structure

```
spec-board/
├── .claude/                    # SoupSpec framework (agents, commands, skills)
├── prisma/
│   └── schema.prisma           # Database schema (Project model)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── browse/         # File browser API
│   │   │   ├── project/        # Project data API
│   │   │   ├── projects/       # Projects CRUD API
│   │   │   └── watch/          # SSE file watcher
│   │   ├── projects/[name]/    # Dynamic project pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (project selector)
│   │   └── globals.css         # Global styles
│   ├── components/             # React components (15 files)
│   ├── lib/                    # Utilities and business logic
│   │   ├── parser.ts           # Markdown file parsers
│   │   ├── path-utils.ts       # Path validation utilities
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── store.ts            # Zustand state store
│   │   └── utils.ts            # General utilities
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── docs/                       # Documentation
├── coverage/                   # Test coverage reports
├── package.json                # Dependencies and scripts
├── docker-compose.yml          # PostgreSQL container
└── vitest.config.ts            # Test configuration
```

## Key Files

### Entry Points
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page - project registration and selection |
| `src/app/projects/[name]/page.tsx` | Project dashboard with Kanban board |
| `src/app/layout.tsx` | Root layout with metadata |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[name]` | GET, DELETE | Get/delete project by slug |
| `/api/project` | GET | Load project data from filesystem |
| `/api/browse` | GET | Browse filesystem directories |
| `/api/watch` | GET | SSE endpoint for live updates |

### Core Components
| Component | Purpose |
|-----------|---------|
| `kanban-board.tsx` | 3-column Kanban (Backlog, In Progress, Done) |
| `feature-detail.tsx` | Feature detail modal with tabs |
| `dashboard-metrics.tsx` | Project metrics and charts |
| `project-selector.tsx` | Filesystem browser for project selection |
| `task-group.tsx` | Task list grouped by user story |

### Business Logic
| File | Purpose |
|------|---------|
| `lib/parser.ts` | Parse spec.md, plan.md, tasks.md, constitution.md |
| `lib/store.ts` | Zustand store for project state |
| `lib/utils.ts` | UI utilities (cn, stage colors, VS Code integration) |
| `lib/path-utils.ts` | Path validation and security |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| State | Zustand |
| Database | PostgreSQL + Prisma |
| Icons | Lucide React |
| Charts | Recharts |
| Markdown | gray-matter, remark, remark-html |
| Testing | Vitest |
| Package Manager | pnpm |

## Dependencies

### Production
- `next` ^16.1.1 - React framework
- `react` ^19.2.3 - UI library
- `@prisma/client` ^5.22.0 - Database ORM
- `zustand` ^5.0.9 - State management
- `tailwindcss` ^4.1.18 - CSS framework
- `gray-matter` ^4.0.3 - YAML frontmatter parser
- `remark` ^15.0.1 - Markdown processor
- `recharts` ^3.6.0 - Charts library
- `lucide-react` ^0.562.0 - Icons
- `chokidar` ^5.0.0 - File watcher
- `ws` ^8.18.3 - WebSocket support
- `dompurify` ^3.3.1 - HTML sanitization

### Development
- `vitest` ^4.0.16 - Test runner
- `prisma` ^5.22.0 - Database toolkit
- `typescript` ^5.9.3 - Type checking

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests (watch mode)
pnpm test:run     # Run tests once
pnpm test:coverage # Run tests with coverage
```

## Database Setup

```bash
# Start PostgreSQL container
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

## Architecture Overview

SpecBoard is a **spec-driven development dashboard** that visualizes markdown-based project specifications:

1. **Spec-Kit Integration**: Parses `specs/` or `.specify/` directories containing:
   - `spec.md` - User stories, acceptance criteria, clarifications
   - `plan.md` - Technical context (language, dependencies, testing)
   - `tasks.md` - Task lists with phases and user story links
   - `constitution.md` - Project principles and governance

2. **Feature Pipeline**: Maps feature stages to Kanban columns:
   - Backlog: specify, plan stages
   - In Progress: tasks, implement stages
   - Done: complete stage

3. **Real-time Updates**: SSE-based file watching for live dashboard updates

4. **Multi-Project Support**: PostgreSQL-backed project registry with URL slugs

## Generated CLAUDE.md Files

- `src/CLAUDE.md` - Source directory overview
- `src/app/CLAUDE.md` - Next.js App Router structure
- `src/components/CLAUDE.md` - React components guide
- `src/lib/CLAUDE.md` - Utilities and business logic
