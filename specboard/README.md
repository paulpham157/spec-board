# SpecBoard

Visual dashboard for spec-kit task management with shareable links and real-time updates.

## Features

- **Kanban Board** - Linear-style 3-column board (Backlog, In Progress, Done)
- **Shareable Links** - Register projects with URL slugs for team sharing
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

### Register a Project

1. Open SpecBoard at `http://localhost:3000`
2. Browse to your spec-kit project folder
3. Enter a URL slug (e.g., `my-project`)
4. Click "Register Project"

### Share with Teammates

Once registered, share the URL:
```
http://your-domain.com/projects/my-project
```

### Deep Link to Features

Link directly to a specific feature:
```
http://your-domain.com/projects/my-project/features/feature-name
```

## URL Structure

| Route | Description |
|-------|-------------|
| `/` | Home - project list and registration |
| `/projects/:name` | Project board view |
| `/projects/:name/features/:id` | Feature detail view |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

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
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   ├── lib/               # Utilities, parser, path-utils, and store
│   └── types/             # TypeScript types
└── docs/
    └── API.md             # API documentation
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

1. Set up PostgreSQL database
2. Configure `DATABASE_URL` environment variable
3. Run `pnpm prisma migrate deploy`
4. Deploy to Vercel, Railway, or your preferred platform

## License

MIT
