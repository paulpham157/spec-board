# Project Index - SpecBoard

## Project Overview

**Name:** SpecBoard
**Type:** Next.js Web Application
**Description:** Visual dashboard for spec-kit task management - a Kanban board for tracking feature development through specification stages.

**Tech Stack:**
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript 5.9.3
- **UI:** React 19.2.3, Tailwind CSS 4.1.18
- **State Management:** Zustand 5.0.9
- **Charts:** Recharts 3.6.0
- **Icons:** Lucide React 0.562.0
- **File Watching:** Chokidar 5.0.0
- **Markdown Parsing:** gray-matter 4.0.3, remark 15.0.1
- **Package Manager:** pnpm 10.26.0

---

## Quick Navigation

| Category | Location |
|----------|----------|
| **Entry Point** | `specboard/src/app/page.tsx` |
| **Project Dashboard** | `specboard/src/app/projects/[name]/page.tsx` |
| **API Routes** | `specboard/src/app/api/` |
| **Components** | `specboard/src/components/` |
| **Core Logic** | `specboard/src/lib/` |
| **Types** | `specboard/src/types/index.ts` |
| **Database** | `specboard/src/lib/prisma.ts` |
| **Tests** | `specboard/src/**/*.test.ts` |
| **Config** | `specboard/package.json`, `specboard/vitest.config.ts` |
| **SoupSpec Framework** | `.claude/` |

---

## Directory Structure

```
spec-board/
├── specboard/                    # Next.js Dashboard Application
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── page.tsx          # Home page (project list)
│   │   │   ├── layout.tsx        # Root layout with CSS
│   │   │   ├── globals.css       # Global styles & CSS variables
│   │   │   ├── projects/[name]/  # Project dashboard pages
│   │   │   │   ├── page.tsx      # Project dashboard with Kanban
│   │   │   │   └── features/[featureId]/ # Feature detail pages
│   │   │   └── api/              # API routes
│   │   │       ├── project/      # Load project spec files
│   │   │       ├── projects/     # CRUD for project records (Prisma)
│   │   │       ├── browse/       # File browser for project selection
│   │   │       └── watch/        # SSE file watcher for real-time updates
│   │   ├── components/           # React UI components
│   │   │   ├── kanban-board.tsx      # Feature pipeline board
│   │   │   ├── dashboard-metrics.tsx # Metrics with charts
│   │   │   ├── feature-detail.tsx    # Feature modal view
│   │   │   ├── project-selector.tsx  # Project picker UI
│   │   │   ├── constitution-panel.tsx# Constitution viewer
│   │   │   └── clarity-history.tsx   # Q&A history panel
│   │   ├── lib/                  # Core utilities
│   │   │   ├── parser.ts         # Markdown spec file parser
│   │   │   ├── parser.test.ts    # Parser unit tests
│   │   │   ├── prisma.ts         # Prisma client singleton
│   │   │   ├── store.ts          # Zustand state management
│   │   │   ├── utils.ts          # Helper functions (cn, colors, isPrismaError)
│   │   │   └── utils.test.ts     # Utils unit tests
│   │   └── types/
│   │       └── index.ts          # TypeScript type definitions
│   ├── prisma/                   # Prisma schema and migrations
│   │   └── schema.prisma         # Database schema
│   ├── specs/                    # Feature Specifications (spec-kit)
│   │   └── 003-full-speckit-integration/
│   │       ├── spec.md           # Feature specification (5 user stories)
│   │       ├── plan.md           # Technical implementation plan
│   │       └── tasks.md          # 51 tasks across 8 phases
│   ├── vitest.config.ts          # Test configuration
│   ├── next.config.ts            # Next.js configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json              # Dependencies and scripts
│
└── .claude/                      # SoupSpec Framework
    ├── CLAUDE.md                 # Main project instructions
    ├── agents/                   # 22 specialized agent definitions
    ├── commands/                 # 20 slash command definitions
    ├── modes/                    # 7 behavioral mode configs
    ├── skills/                   # 40+ skills by category
    ├── workflows/                # Development workflow definitions
    ├── hooks/                    # Event-driven automation
    └── mcp/                      # MCP server configurations
```

---

## Key Files

### SpecBoard Application

| File | Purpose |
|------|---------|
| `specboard/src/app/page.tsx` | Home page with project list and creation |
| `specboard/src/app/projects/[name]/page.tsx` | Project dashboard with Kanban board, metrics, SSE connection |
| `specboard/src/lib/parser.ts` | Parses spec.md, plan.md, tasks.md, constitution.md files |
| `specboard/src/lib/prisma.ts` | Prisma client singleton for database access |
| `specboard/src/lib/store.ts` | Zustand store for project state, metrics calculation |
| `specboard/src/lib/utils.ts` | Helper functions: `cn()`, `getStageColor()`, `isPrismaError()` |
| `specboard/src/types/index.ts` | All TypeScript interfaces (Feature, Task, Project, etc.) |
| `specboard/src/app/api/projects/route.ts` | REST endpoint: GET (list), POST (create) projects |
| `specboard/src/app/api/projects/[name]/route.ts` | REST endpoint: GET, PUT, DELETE project by name |
| `specboard/src/app/api/watch/route.ts` | SSE endpoint with chokidar file watching |
| `specboard/src/app/api/project/route.ts` | REST endpoint to load and parse project spec files |
| `specboard/src/app/api/browse/route.ts` | File browser for project selection |
| `specboard/src/components/kanban-board.tsx` | 3-column Kanban board (Backlog, In Progress, Done) |
| `specboard/src/components/dashboard-metrics.tsx` | Metrics cards and Recharts visualizations |

### Feature Specifications (spec-kit)

| File | Purpose |
|------|---------|
| `specboard/specs/003-full-speckit-integration/spec.md` | Feature spec with 5 user stories (P1-P3 priorities) |
| `specboard/specs/003-full-speckit-integration/plan.md` | Technical design, architecture, component hierarchy |
| `specboard/specs/003-full-speckit-integration/tasks.md` | 51 tasks across 8 phases with dependencies |

### SoupSpec Framework

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Main instructions for Claude Code |
| `.claude/agents/*.md` | Agent definitions (planner, debugger, tester, etc.) |
| `.claude/commands/*.md` | Slash commands (/do, /fix, /review, etc.) |
| `.claude/modes/*.md` | Behavioral modes (brainstorm, implementation, etc.) |
| `.claude/skills/*/SKILL.md` | Skill definitions with references |
| `.claude/workflows/*.md` | Development workflow protocols |

---

## Architecture

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Project Files  │────▶│  Parser (lib/)   │────▶│  Zustand Store  │
│  (specs/*.md)   │     │  parseProject()  │     │  useProjectStore│
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌──────────────────┐             │
│  File Watcher   │────▶│  SSE /api/watch  │─────────────┘
│  (chokidar)     │     │  Real-time push  │
└─────────────────┘     └──────────────────┘
                                                         │
                        ┌──────────────────┐             ▼
                        │   React UI       │◀────────────┘
                        │   Components     │
                        └──────────────────┘
```

### Component Hierarchy

```
page.tsx
├── ProjectSelector (when no project)
└── Dashboard (when project loaded)
    ├── DashboardMetricsPanel
    │   └── MetricCard (internal)
    ├── ConstitutionPanel
    ├── ClarityHistoryPanel
    ├── KanbanBoard
    │   └── KanbanColumn (internal)
    │       └── FeatureCard (internal)
    └── FeatureDetail (modal)
```

### Feature Stages (Kanban Columns)

| Stage | Color | Condition |
|-------|-------|-----------|
| `specify` | Purple | No spec.md |
| `plan` | Blue | Has spec.md, no plan.md |
| `tasks` | Yellow | Has plan.md, no tasks.md or 0 tasks completed |
| `implement` | Orange | Has tasks, some completed |
| `complete` | Green | All tasks completed |

---

## Key Types

```typescript
// Feature stages for Kanban columns
type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';

// Core data structures
interface Project {
  path: string;
  name: string;
  features: Feature[];
  constitution: Constitution | null;
  hasConstitution: boolean;
}

interface Feature {
  id: string;
  name: string;
  stage: FeatureStage;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  tasks: Task[];
  phases: TaskPhase[];
  clarificationSessions: ClarificationSession[];
}

interface Task {
  id: string;           // T001, T002, etc.
  description: string;
  completed: boolean;
  parallel: boolean;    // [P] marker
  userStory?: string;   // [US1] marker
  filePath?: string;
}
```

---

## Dependencies

### SpecBoard (specboard/package.json)

**Runtime:**
- `next` ^16.1.1 - React framework with App Router
- `react` ^19.2.3 - UI library
- `zustand` ^5.0.9 - State management
- `tailwindcss` ^4.1.18 - CSS framework
- `recharts` ^3.6.0 - Chart library
- `lucide-react` ^0.562.0 - Icons
- `chokidar` ^5.0.0 - File watching
- `gray-matter` ^4.0.3 - YAML frontmatter parsing
- `remark` ^15.0.1 - Markdown processing
- `ws` ^8.18.3 - WebSocket support
- `clsx` ^2.1.1 - Class name utility
- `tailwind-merge` ^3.4.0 - Tailwind class merging

**Dev:**
- `vitest` - Test runner
- `typescript` ^5.9.3 - Type checking

### Internal Dependencies

```
types/index.ts ← (base, no dependencies)
    ↑
lib/utils.ts ← types
lib/parser.ts ← types, gray-matter, fs, path
lib/store.ts ← types, zustand
    ↑
components/* ← types, lib/utils, lib/store
    ↑
app/api/* ← lib/parser, chokidar
app/page.tsx ← lib/store, components/*
```

---

## Development Commands

```bash
cd specboard

# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (http://localhost:3000)

# Testing
pnpm exec vitest                        # Run tests
pnpm exec vitest --coverage             # Run with coverage
pnpm exec vitest src/lib/parser.test.ts # Single file

# Production
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

---

## File Patterns

| Pattern | Description |
|---------|-------------|
| `specs/*/spec.md` | Feature specification files |
| `specs/*/plan.md` | Feature implementation plans |
| `specs/*/tasks.md` | Feature task lists |
| `.specify/memory/constitution.md` | Project constitution |

### Task Line Format (in tasks.md)

```markdown
- [ ] T001 [P] [US1] Description with file.ts
- [x] T002 Completed task description
```

- `[ ]` / `[x]` - Completion checkbox
- `T001` - Task ID (required)
- `[P]` - Parallel execution marker (optional)
- `[US1]` - User story reference (optional)

---

## Styling

- **Theme:** Dark mode with CSS custom properties
- **Colors:** Defined in `specboard/src/app/globals.css`
- **Utility:** `cn()` function merges Tailwind classes with clsx + tailwind-merge

### CSS Variables

```css
--background: #0a0a0a
--foreground: #ededed
--card: #141414
--primary: #3b82f6
--secondary: #27272a
--border: #27272a
--muted-foreground: #a1a1aa
```

---

## Generated CLAUDE.md Files

- `specboard/src/CLAUDE.md` - Source directory overview
- `specboard/src/app/CLAUDE.md` - App Router and API routes
- `specboard/src/components/CLAUDE.md` - UI components
- `specboard/src/lib/CLAUDE.md` - Core utilities and parser
- `specboard/src/types/CLAUDE.md` - Type definitions

---

*Generated: 2025-12-28* | *Updated: 2025-12-28*
