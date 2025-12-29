# SpecBoard

Visual dashboard for spec-kit task management with shareable links and real-time updates.

## Features

- **Kanban Board** - Linear-style 3-column board (Backlog, In Progress, Done)
- **Quick Project Access** - Open any spec-kit project by path with autocomplete
- **Recent Projects** - Track recently opened projects with full context (stats, completion %)
- **Shareable Links** - Path-based URLs for easy sharing
- **Deep Linking** - Link directly to specific features
- **Real-time Updates** - Live file watching with Server-Sent Events
- **Unified Dashboard** - ComposedChart with task metrics, stage distribution, and cumulative progress
- **Tab Status Indicators** - Visual workflow progress (✓ complete, ⟳ in-progress, ○ pending)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended)

### Installation

```bash
# Clone and install
cd specboard
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev --name init

# Start development server
pnpm dev
```

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/specboard"
```

## Usage

### Open a Project

1. Open SpecBoard at `http://localhost:3000`
2. Click **"Open Project"** button
3. Type or paste the path to your spec-kit project
4. Select from autocomplete suggestions (spec-kit projects show a badge)
5. Review the preview card with project stats
6. Click **"Open Project"** to view the dashboard

### Recent Projects

Recently opened projects appear on the home page with:
- Project name and path
- Last opened time
- Feature count and completion percentage
- Stage breakdown (specifying, planning, implementing, etc.)

Click any recent project to open it directly.

### Share with Teammates

Share the URL directly - paths are encoded in the URL:
```
http://your-domain.com/projects/%2Fpath%2Fto%2Fproject
```

Or use the **Share** button in the project header to copy the link.

### Deep Link to Features

Link directly to a specific feature:
```
http://your-domain.com/projects/%2Fpath%2Fto%2Fproject/features/feature-name
```

## URL Structure

| Route | Description |
|-------|-------------|
| `/` | Home - recent projects and "Open Project" button |
| `/projects/:encodedPath` | Project board view (path is URL-encoded) |
| `/projects/:encodedPath/features/:id` | Feature detail view |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Accessibility**: WCAG 2.2 AA compliant

## Accessibility

SpecBoard is built with WCAG 2.2 AA compliance in mind:

### Keyboard Navigation
- **Kanban Board**: Tab through cards, Enter to open details
- **Feature Modal**: Escape to close, 1-8 for tabs, Arrow keys for tab navigation
- **Project Selector**: Arrow keys to navigate directories, Enter to select

### Screen Reader Support
- ARIA roles and labels on all interactive elements
- Live regions for dynamic content announcements
- Semantic HTML structure with proper headings

### Visual Accessibility
- Focus indicators on all interactive elements
- Sufficient color contrast ratios
- No reliance on color alone for information

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

## Project Structure

```
specboard/
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
│   │   └── page.tsx       # Home page (recent projects + open button)
│   ├── components/        # React components
│   │   ├── kanban-board.tsx        # Feature pipeline board
│   │   ├── feature-detail.tsx      # Feature modal with tabs
│   │   ├── dashboard-metrics.tsx   # Project metrics panel
│   │   ├── recent-projects-list.tsx # Recent projects display
│   │   ├── open-project-modal.tsx  # Project search modal
│   │   └── ...
│   ├── lib/               # Utilities and business logic
│   │   ├── parser.ts      # Markdown file parser
│   │   ├── store.ts       # Zustand state (with recent projects)
│   │   ├── path-utils.ts  # Path validation and security
│   │   └── utils.ts       # General utilities
│   └── types/             # TypeScript types
└── docs/
    ├── API.md             # API documentation
    ├── ACCESSIBILITY.md   # Accessibility guide
    └── ...
```

## API Reference

See [docs/API.md](docs/API.md) for full API documentation.

### Quick Reference

```bash
# List projects
GET /api/projects

# Create project
POST /api/projects
{ "name": "slug", "displayName": "Name", "filePath": "/path" }

# Get project
GET /api/projects/:name

# Update project
PUT /api/projects/:name
{ "displayName": "New Name", "filePath": "/new/path" }

# Delete project
DELETE /api/projects/:name

# Load spec data
GET /api/project?path=/path/to/project

# Browse directories
GET /api/browse?path=/path/to/dir

# Real-time updates (SSE)
GET /api/watch?path=/path/to/project
```

### Security Features

- **Path Traversal Protection**: Browse API restricts access to user directories only
- **Input Validation**: Project names validated against URL-safe slug pattern
- **File Path Validation**: PUT endpoint verifies directory existence
- **XSS Prevention**: Markdown content sanitized with DOMPurify

## Development

```bash
# Run development server
pnpm dev

# Run tests
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # With coverage

# Type check
pnpm tsc --noEmit

# Database commands
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate   # Run migrations
pnpm prisma generate  # Regenerate client
```

## Deployment

### Docker (Recommended)

The easiest way to run SpecBoard in production:

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
# .env
POSTGRES_USER=specboard
POSTGRES_PASSWORD=specboard
POSTGRES_DB=specboard
POSTGRES_PORT=5432
APP_PORT=3000
```

**Volume Mounts**: The app container mounts your home directory read-only to access spec-kit projects.

### PM2 (Process Manager)

For running without Docker:

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
