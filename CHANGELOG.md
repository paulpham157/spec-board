# Changelog

All notable changes to SpecBoard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
- **Open Project Modal** - Streamlined project search experience:
  - Searchbox with path autocomplete
  - Keyboard navigation (↑↓ navigate, Tab accept, Esc close)
  - Spec-kit project detection with visual badge
  - Preview card showing project stats before opening
- **Path-based URL Routing** - Projects accessible via encoded filesystem paths
- **Share Button** - Copy project URL to clipboard from header

### Changed
- Home page redesigned from project registration to quick-access interface
- Project URLs now use encoded paths instead of database slugs
- Recent projects stored in localStorage with rich metadata
- Next.js config updated with `output: "standalone"` for Docker

### Fixed
- HTML validation error: nested `<button>` elements in recent projects list

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
