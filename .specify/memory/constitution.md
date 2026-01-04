<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 0.0.0 → 1.0.0 (MAJOR - initial constitution)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (6 principles)
  - Technical Standards
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section exists)
  - .specify/templates/spec-template.md ✅ (aligned with user story structure)
  - .specify/templates/tasks-template.md ✅ (aligned with phase structure)
Follow-up TODOs: None
================================================================================
-->

# SpecBoard Constitution

## Core Principles

### I. Spec-Driven Visualization

SpecBoard exists to visualize spec-kit projects through a Kanban-style interface.
All features MUST support the core workflow: specify → plan → tasks → implement → complete.

- Features are parsed from filesystem markdown files (spec.md, plan.md, tasks.md)
- The parser (`src/lib/parser.ts`) is the single source of truth for data extraction
- Real-time updates via SSE ensure the dashboard reflects current file state
- Database stores project metadata only; spec content is always read from filesystem

**Rationale**: Spec-kit projects are the domain model. The dashboard is a read-only
visualization layer that MUST NOT modify source files.

### II. Type Safety (NON-NEGOTIABLE)

All code MUST be written in TypeScript with strict mode enabled.

- No `any` types permitted
- All function parameters and return types MUST be explicitly typed
- Use interfaces for object shapes, type unions for enums
- All types defined in `src/types/index.ts` for single-source imports

**Rationale**: Type safety prevents runtime errors and enables confident refactoring.
The strict mode requirement is enforced by tsconfig.json.

### III. Security First

All user inputs and filesystem operations MUST be validated and sanitized.

- Path traversal protection via `isPathSafe()` in `src/lib/path-utils.ts`
- Input validation on all API endpoints (slug patterns, path existence)
- DOMPurify for all markdown-to-HTML rendering
- No hardcoded secrets; environment variables only
- No runtime code generation from strings (Function constructor, etc.)

**Rationale**: SpecBoard reads from the filesystem and renders user-provided markdown.
Both attack surfaces require defense-in-depth.

### IV. Accessibility

All UI components MUST be accessible to users with disabilities.

- ARIA labels on all interactive elements
- Keyboard navigation for all features (arrow keys, number shortcuts)
- Focus trapping in modals (`useFocusTrap`)
- Screen reader announcements via `announce()`
- High contrast support via CSS variables

**Rationale**: Accessibility is a core requirement, not an afterthought. The feature
detail modal demonstrates comprehensive keyboard and screen reader support.

### V. Clean URL Architecture

URLs MUST use database slugs, not filesystem paths.

- Projects are auto-registered via `/api/projects/register`
- Slugs are generated from folder names (e.g., `my-todolist`)
- Slug conflicts resolved by appending numbers (`my-todolist-2`)
- Recent projects cache slugs in localStorage for direct navigation

**Rationale**: Clean URLs improve shareability, bookmarking, and security by not
exposing filesystem structure.

### VI. Component Simplicity

UI components MUST follow the principle of single responsibility.

- One component per file
- Client components use `'use client'` directive
- Styling via Tailwind CSS with `cn()` utility
- CSS variables for theming (dark mode support)
- Lucide React for icons

**Rationale**: Simple, focused components are easier to test, maintain, and reuse.
The flat component structure in `src/components/` reflects this principle.

## Technical Standards

### Stack Requirements

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript (strict) | 5.9.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL via Prisma | 5.22.x |
| State | Zustand | 5.x |
| Icons | Lucide React | latest |

### Code Conventions

| Type | Convention |
|------|------------|
| Files | `kebab-case.ts` / `kebab-case.tsx` |
| Functions | `camelCase` |
| Components | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |
| Types/Interfaces | `PascalCase` |

### Testing Requirements

- Minimum coverage: 80%
- Critical paths (parser, path-utils): 95%
- Test command: `pnpm test`

## Development Workflow

### API Design

All API routes follow RESTful conventions:

- `GET /api/projects` - List all projects
- `POST /api/projects/register` - Auto-register from path
- `GET /api/projects/:slug` - Get project by slug
- `GET /api/project?path=...` - Parse spec-kit files
- `GET /api/watch?path=...` - SSE for real-time updates

### Data Flow

1. User opens project from home page
2. Home page calls `POST /api/projects/register` with filesystem path
3. API validates path, returns project with slug
4. Navigate to `/projects/{slug}`
5. Project page fetches spec data and establishes SSE connection

### Git Conventions

- Branch naming: `feature/[description]`, `fix/[description]`
- Commit format: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- All PRs require CLA agreement (see CLA.md)

## Governance

This constitution supersedes all other development practices for SpecBoard.

### Amendment Process

1. Propose change with rationale
2. Document impact on existing code
3. Update constitution version (semantic versioning)
4. Update dependent templates if principles change

### Compliance

- All PRs MUST verify compliance with these principles
- Code review MUST check for type safety, security, and accessibility
- Complexity MUST be justified against the simplicity principle

### Version Policy

- MAJOR: Principle removal or incompatible redefinition
- MINOR: New principle or section added
- PATCH: Clarifications, wording improvements

**Version**: 1.0.0 | **Ratified**: 2025-12-29 | **Last Amended**: 2025-12-29
