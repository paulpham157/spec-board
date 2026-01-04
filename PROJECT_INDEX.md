# PROJECT_INDEX.md

> Auto-generated codebase index for SpecBoard
> Last updated: 2026-01-04

## Overview

**SpecBoard** is a real-time dashboard for visualizing spec-kit projects. It provides a Kanban-style interface for tracking feature development through stages (specify → plan → tasks → implement → complete), with live updates via Server-Sent Events (SSE).

**Version:** 1.1.0
**License:** AGPL-3.0 (with commercial licensing available)
**Package Manager:** pnpm 10.26.0

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.1 (App Router) |
| **Language** | TypeScript 5.9.3 (strict mode) |
| **UI** | React 19.2.3, Tailwind CSS v4.1.18, Lucide Icons |
| **Database** | PostgreSQL via Prisma ORM 5.22.0 |
| **State** | Zustand 5.0.9 (client), localStorage persistence |
| **Charts** | Recharts 3.6.0 |
| **Markdown** | remark 15, remark-html 16, DOMPurify 3.3.1 |
| **File Watching** | chokidar 5.0.0 |

## Architecture

```
spec-board/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home - recent projects + open modal
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind + CSS variables
│   │   ├── settings/           # Settings page
│   │   │   └── page.tsx        # Shortcuts + About (README/Changelog)
│   │   ├── api/                # API routes
│   │   │   ├── app-info/       # App metadata (version, readme, changelog)
│   │   │   ├── projects/       # Project CRUD + registration
│   │   │   ├── project/        # Load spec data from filesystem
│   │   │   ├── browse/         # Directory browser
│   │   │   └── watch/          # SSE real-time updates
│   │   └── projects/[name]/    # Project dashboard routes
│   │       ├── page.tsx        # Kanban board view
│   │       └── features/[featureId]/
│   │           ├── page.tsx    # Feature detail
│   │           ├── spec/       # Spec viewer
│   │           └── plan/       # Plan viewer
│   ├── components/             # React UI components (25+ files)
│   │   ├── feature-detail/     # Feature detail modal components
│   │   ├── readme-viewer.tsx   # Beautified README with custom diagrams
│   │   ├── changelog-viewer.tsx # Version timeline with badges
│   │   └── ...
│   ├── lib/                    # Utilities and business logic
│   │   ├── parser.ts           # Markdown parsing (core logic)
│   │   ├── markdown/           # Specialized markdown parsers
│   │   ├── path-utils.ts       # Path validation/security
│   │   ├── prisma.ts           # Database client
│   │   ├── store.ts            # Zustand state management
│   │   ├── settings-store.ts   # Settings persistence
│   │   ├── utils.ts            # General utilities
│   │   └── accessibility/      # A11y utilities
│   └── types/                  # TypeScript definitions
│       └── index.ts            # All shared types
├── prisma/
│   └── schema.prisma           # Database schema (PostgreSQL)
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md # PR template with CLA
├── CLA.md                      # Contributor License Agreement
├── CONTRIBUTING.md             # Development guide
├── LICENSE                     # AGPL-3.0
└── .claude/                    # SoupSpec configuration
```

## Key Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Home Page (src/app/page.tsx)                                   │
│  - Recent projects list (from localStorage + Zustand)           │
│  - Open project modal (filesystem browser)                      │
│  - Auto-registers project → gets slug → navigates               │
└─────────────────────────────────────────────────────────────────┘
                                │
                    POST /api/projects/register
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Project Registration (src/app/api/projects/register/route.ts)  │
│  - Validates path exists and is spec-kit project                │
│  - Returns existing project or creates new with unique slug     │
│  - Slug generated from folder name (e.g., "my-todolist")        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    Navigate to /projects/{slug}
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Project Page (src/app/projects/[name]/page.tsx)                │
│  1. GET /api/projects/{slug} → get filePath from database       │
│  2. GET /api/project?path={filePath} → parse spec-kit files     │
│  3. SSE /api/watch?path={filePath} → real-time updates          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parser (src/lib/parser.ts)                                     │
│  - parseProject() → Project with features, constitution         │
│  - parseFeature() → Feature with tasks, phases, user stories    │
│  - parseTasksFile() → Tasks with [P], [USx] markers             │
│  - parseClarifications() → Q&A history from spec.md             │
│  - parseUserStories() → User stories from spec.md               │
│  - parseTechnicalContext() → Tech context from plan.md          │
└─────────────────────────────────────────────────────────────────┘
```

## URL Routing

| Route | Purpose |
|-------|---------|
| `/` | Home - recent projects, open project modal |
| `/settings` | Settings - keyboard shortcuts, about (README/Changelog) |
| `/projects/{slug}` | Project dashboard with Kanban board |
| `/projects/{slug}/features/{featureId}` | Feature detail modal |
| `/projects/{slug}/features/{featureId}/spec` | Full-page spec viewer |
| `/projects/{slug}/features/{featureId}/plan` | Full-page plan viewer |

**Note:** URLs use database slugs (e.g., `todolist`) not filesystem paths.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects` | GET | List all registered projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/register` | POST | Auto-register project from path |
| `/api/projects/{slug}` | GET | Get project by slug |
| `/api/projects/{slug}` | PUT | Update project |
| `/api/projects/{slug}` | DELETE | Delete project |
| `/api/project?path=...` | GET | Parse spec-kit project from filesystem |
| `/api/browse?path=...` | GET | List directory contents |
| `/api/watch?path=...` | GET | SSE stream for file changes |
| `/api/app-info` | GET | App metadata (version, readme, changelog) |

## Core Types

```typescript
// Feature stages (Kanban columns)
type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';

// Main domain types
interface Project {
  path: string;
  name: string;
  features: Feature[];
  constitution: Constitution | null;
  hasConstitution: boolean;
}

interface Feature {
  id: string;                    // Folder name (e.g., "1-todo-app")
  name: string;                  // Display name
  path: string;                  // Filesystem path
  stage: FeatureStage;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  tasks: Task[];
  phases: TaskPhase[];
  userStories: UserStory[];
  taskGroups: TaskGroup[];
  branch: string | null;         // Git branch from spec/plan
  clarificationSessions: ClarificationSession[];
  specContent: string | null;
  planContent: string | null;
  additionalFiles: SpecKitFile[];
  analysis: FeatureAnalysis | null;
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

## Component Hierarchy

```
App
├── Home Page
│   ├── RecentProjectsList
│   └── OpenProjectModal
│
└── Project Page
    ├── ConstitutionPanel
    ├── ClarityHistoryPanel
    ├── KanbanBoard
    │   └── FeatureCard (per feature)
    └── FeatureDetail (full-screen modal)
        ├── HeaderBar
        ├── NavSidebar
        │   ├── StatusHeader
        │   └── NavItem[] (grouped by phase)
        │       └── SectionIcon
        └── SplitView
            ├── ContentPane (left)
            │   └── [SpecViewer|PlanViewer|TaskGroup|...]
            └── ContentPane (right, optional)
```

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/parser.ts` | Core markdown parsing logic | ~720 |
| `src/app/projects/[name]/page.tsx` | Project dashboard | ~265 |
| `src/components/feature-detail/feature-detail.tsx` | Feature modal with split-view | ~510 |
| `src/components/feature-detail/types.ts` | Feature detail types and constants | ~190 |
| `src/components/kanban-board.tsx` | Kanban board UI | ~240 |
| `src/components/readme-viewer.tsx` | Beautified README with custom diagrams | ~420 |
| `src/components/changelog-viewer.tsx` | Version timeline with badges | ~180 |
| `src/app/settings/page.tsx` | Settings page (shortcuts + about) | ~400 |
| `src/types/index.ts` | All TypeScript types | ~160 |
| `src/lib/store.ts` | Zustand state management | ~225 |
| `src/app/api/projects/register/route.ts` | Auto-registration API | ~125 |
| `CLA.md` | Contributor License Agreement | ~70 |
| `CONTRIBUTING.md` | Development guide and PR guidelines | ~400 |

## Spec-Kit File Structure

SpecBoard expects projects with this structure:

```
project/
├── specs/                      # Feature specifications
│   └── {feature-name}/
│       ├── spec.md             # Feature specification
│       ├── plan.md             # Implementation plan
│       ├── tasks.md            # Task list with checkboxes
│       ├── research.md         # (optional) Research notes
│       ├── data-model.md       # (optional) Data model docs
│       ├── quickstart.md       # (optional) Quick start guide
│       ├── contracts/          # (optional) API contracts
│       ├── checklists/         # (optional) Checklists
│       └── analysis/           # (optional) Spec alignment
│           ├── analysis.json
│           └── analysis.md
└── .specify/
    └── memory/
        └── constitution.md     # Project principles
```

## Task Format

Tasks in `tasks.md` follow this format:

```markdown
## Phase 1: Setup

- [ ] T001 [P] [US1] Create project structure
- [x] T002 [US1] Initialize database
- [ ] T003 [P] Add authentication

## Phase 2: US2 – Edit Tasks

- [ ] T004 [US2] Implement edit form
```

Markers:
- `[P]` - Parallel task (can run concurrently)
- `[USx]` - User story association
- Phase names with `USx –` auto-assign user story to tasks

## Security Features

- Path traversal protection via `isPathSafe()`
- Input validation on all API endpoints
- Slug pattern validation for project names
- DOMPurify for markdown HTML sanitization
- No hardcoded secrets (env vars only)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation (arrow keys, number shortcuts)
- Focus trapping in modals
- Screen reader announcements
- High contrast CSS variables

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Build for production
pnpm build
```

## Database

PostgreSQL database managed by Prisma:

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String   @unique  // URL slug
  displayName String
  filePath    String              // Filesystem path
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Recent Changes

- **Settings Page Redesign**: Merged Overview into README tab, removed scroll limits for full content display
- **Beautified README Viewer**: ASCII diagrams replaced with styled React components (FeaturesGrid, HowItWorksFlow, TechStackDisplay)
- **Changelog Viewer**: Version timeline with color-coded badges for change types
- **AGPL-3.0 + CLA**: Added dual-license notice, Contributor License Agreement, and PR template with CLA requirements
- **Feature Detail Modal Redesign**: Full-screen modal with split-view, 5-phase navigation (OVERVIEW, PLANNING, CODING, QA, QC), drag-to-split functionality, and comprehensive keyboard shortcuts
- **Semantic Icons**: Section icons that convey document meaning (existence, clarifications count, analysis severity)
- **Group Counts**: Tasks show User Story count, Checklists show checklist file count
- **Split View Highlighting**: Both panes highlighted in nav when split view is active
- **Database slug routing**: URLs now use clean slugs (`/projects/todolist`) instead of encoded paths
- **Auto-registration**: Projects auto-register when opened, generating unique slugs
- **Analysis viewer**: Tab for spec alignment tracking with JSON/markdown support
- **Checklist viewer**: Support for checklist files in feature directories

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, and contribution guidelines.

**License:** Available under [AGPL-3.0](LICENSE) or commercial license. Contributors must agree to the [CLA](CLA.md).

## Generated CLAUDE.md Files

The following directories have CLAUDE.md files for context:
- `src/CLAUDE.md` - Source directory overview
- `src/app/CLAUDE.md` - App Router pages and API routes
- `src/app/api/CLAUDE.md` - API routes documentation
- `src/components/CLAUDE.md` - UI components
- `src/components/feature-detail/CLAUDE.md` - Feature modal components
- `src/lib/CLAUDE.md` - Utilities and helpers
- `src/lib/markdown/CLAUDE.md` - AST-based markdown parsers
- `src/lib/shortcuts/CLAUDE.md` - Keyboard shortcuts system
- `src/lib/accessibility/CLAUDE.md` - Accessibility utilities
- `src/types/CLAUDE.md` - Type definitions
- `prisma/CLAUDE.md` - Database schema
