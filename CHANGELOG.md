# Changelog

All notable changes to SpecBoard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Semantic Section Icons** - Navigation icons that convey document meaning:
  - Icons indicate document existence via color (green if exists, muted otherwise)
  - Spec section shows clarifications count badge
  - Analysis section shows severity-based icons (warning/success/search)
- **Group Counts in Navigation** - Additional context for sections:
  - Tasks section shows User Story count (e.g., "5 US")
  - Checklists section shows checklist file count (e.g., "3 checklists")
- **Split View Dual Highlighting** - Both left and right pane sections highlighted in nav when split view is active

### Changed
- **Navigation Phase Structure** - Reorganized from 3 phases to 5 phases:
  - OVERVIEW: Overview, Spec
  - PLANNING: Plan, Research, Data Model
  - CODING: Tasks
  - QA: Analysis
  - QC: Checklists
- Moved Spec section from EXECUTE to OVERVIEW phase
- Renamed EXECUTE phase to CODING

### Fixed
- Navigation highlight sync issue where Overview stayed highlighted after clicking other sections
- `selectedNavIndex` now syncs with `activeSection` on click

## [0.3.0] - 2024-12-30

### Added
- **Feature Detail Modal Redesign** - Full-screen modal with enhanced navigation:
  - Split-view support with drag-to-split and resizable divider
  - Left navigation sidebar grouped by workflow phase
  - Status header with progress bar and "Next Action" display
  - Comprehensive keyboard shortcuts (1-9 for sections, Ctrl+\ for split, Tab to switch panes)
  - Drag navigation items to content area to open in split view
  - Memoized section configs for performance optimization
  - Full accessibility support with focus trap and screen reader announcements
- **Database Slug Routing** - Clean, shareable URLs using database slugs:
  - New `/api/projects/register` endpoint for auto-registration
  - Generates URL-safe slugs from folder names (e.g., `my-todolist`)
  - Handles slug conflicts with numeric suffixes (`my-todolist-2`)
  - Returns existing project if path already registered
- **Analysis Viewer Tab** - View spec alignment tracking data:
  - Displays analysis.json and analysis.md from feature's analysis/ directory
  - Shows spec alignment score and requirement status
- **Checklist Viewer Tab** - Display checklist files from feature directories
- **Docker Support** - Full containerization for production deployment:
  - Multi-stage Dockerfile with pnpm and Prisma support
  - `docker-compose.yml` for full stack (app + PostgreSQL)
  - `docker-compose.db.yml` for database-only (use with PM2)
  - `docker-entrypoint.sh` for automatic database migrations
- **PM2 Process Manager** - `ecosystem.config.cjs` with:
  - Production and development environment configs
  - Log file management
  - Graceful shutdown handling
  - Memory limit auto-restart
- **New Home Page UI** - Split view layout with recent projects and "Open Project" button
- **Recent Projects List** - Track recently opened projects with full context:
  - Project name and path
  - Last opened timestamp with relative time formatting
  - Feature count and completion percentage
  - Stage breakdown (specifying, planning, implementing, complete)
  - Auto-generated summary from constitution.md
  - Cached slug for faster navigation
- **Open Project Modal** - Streamlined project search experience:
  - Searchbox with path autocomplete
  - Keyboard navigation (↑↓ navigate, Tab accept, Esc close)
  - Spec-kit project detection with visual badge
  - Preview card showing project stats before opening
- **Share Button** - Copy project URL to clipboard from header

### Changed
- **URL Structure** - Projects now use clean slugs instead of encoded paths:
  - Old: `/projects/%2FUsers%2Fpaul%2Fmy-project`
  - New: `/projects/my-project`
- Home page auto-registers projects via `/api/projects/register` before navigation
- All project pages lookup filesystem path from database using slug
- Recent projects stored in localStorage with rich metadata including slug
- Next.js config updated with `output: "standalone"` for Docker

### Fixed
- HTML validation error: nested `<button>` elements in recent projects list
- URL double encoding issue (`%252F`) with filesystem paths

## [0.2.0] - 2024-12-28

### Added
- Path input with autocomplete suggestions in ProjectSelector
- Dynamic port configuration with dotenv-cli

## [0.1.1] - 2024-12-27

### Added
- WCAG 2.2 AA accessibility support
- Focus trapping for modals
- Screen reader announcements
- Keyboard navigation throughout

## [0.1.0] - 2024-12-26

### Added
- Initial release
- Kanban board with 3 columns (Backlog, In Progress, Done)
- Project registration with URL slugs
- Real-time file watching with SSE
- Feature detail modal with tabs
- Dashboard metrics panel
- Constitution and clarity history panels
