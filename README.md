# SpecBoard

> Visual dashboard for [spec-kit](https://github.com/github/spec-kit) projects

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)

## Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   KANBAN BOARD             SHAREABLE LINKS          REAL-TIME UPDATES       │
│   ─────────────────        ─────────────────        ──────────────────      │
│   4-column pipeline        Clean slug-based         Live file watching      │
│   Backlog → Done           URLs for sharing         via SSE                 │
│                                                                             │
│   DASHBOARD METRICS        DEEP LINKING             ACCESSIBLE              │
│   ─────────────────        ─────────────────        ──────────────────      │
│   Progress charts          Link to specific         WCAG 2.2 AA             │
│   Stage distribution       features directly        Keyboard nav            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## How It Works

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│              │      │              │      │                  │
│  spec-kit    │ ───▶ │  SpecBoard   │ ───▶ │   Kanban Board   │
│  project     │      │  parses      │      │                  │
│              │      │              │      │  ┌──┐┌──┐┌──┐┌──┐│
│  specs/      │      │  spec.md     │      │  │B ││P ││I ││D ││
│  ├─ feature/ │      │  plan.md     │      │  └──┘└──┘└──┘└──┘│
│  │  ├─ spec  │      │  tasks.md    │      │                  │
│  │  ├─ plan  │      │              │      │                  │
│  │  └─ tasks │      │              │      │                  │
└──────────────┘      └──────────────┘      └──────────────────┘

B = Backlog | P = Planning | I = In Progress | D = Done
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
docker compose up -d --build
```

Open http://localhost:3000

### Option 2: Local Development

```bash
pnpm install
cp .env.example .env          # Add DATABASE_URL
pnpm prisma migrate dev
pnpm dev
```

## URL Structure

```
/                                          → Home (recent projects)
/projects/{slug}                           → Project board
/projects/{slug}/features/{id}             → Feature detail
/projects/{slug}/features/{id}/spec        → Spec viewer
/projects/{slug}/features/{id}/plan        → Plan viewer
```

**Note:** URLs use clean database slugs (e.g., `todolist`) generated from folder names, not encoded filesystem paths.

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ Next.js │  │Tailwind │  │ Zustand │  │Recharts │     │
│  │   16    │  │  CSS v4 │  │  State  │  │ Charts  │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
├─────────────────────────────────────────────────────────┤
│  BACKEND                                                │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐                 │
│  │ Next.js │  │ Prisma  │  │PostgreSQL│                 │
│  │   API   │  │   ORM   │  │    DB    │                 │
│  └─────────┘  └─────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Documentation

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](https://github.com/paulpham157/spec-board/blob/main/CONTRIBUTING.md) | Development guide, API reference |
| [CHANGELOG.md](https://github.com/paulpham157/spec-board/blob/main/CHANGELOG.md) | Version history |
| [PROJECT_INDEX.md](https://github.com/paulpham157/spec-board/blob/main/PROJECT_INDEX.md) | Codebase structure |

## License

Available under [AGPL-3.0](https://github.com/paulpham157/spec-board/blob/main/LICENSE) or commercial license. For commercial licensing, contact us at [Email](mailto:paulpham157@gmail.com).

### Contributing

By contributing to this project, you agree to the [Contributor License Agreement (CLA)](https://github.com/paulpham157/spec-board/blob/main/CLA.md). All contributions must be made under the AGPL-3.0 license.
