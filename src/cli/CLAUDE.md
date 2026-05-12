# CLI Directory

## Purpose
Command-line interface for managing SpecBoard projects from the terminal.

## Overview
Provides a `specboard` CLI tool using Commander.js. All commands delegate to `src/lib/core.ts` for database operations.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | CLI entry point with all commands (161 lines) |

## Commands

| Command | Args | Purpose |
|---------|------|---------|
| `list` | - | List all projects |
| `get` | `<project> [feature] [type]` | Get project, feature, or content |
| `context` | `<project> <feature> [-s stage]` | Stage-aware context for AI agents |
| `create` | `<project> <name> <description>` | Create feature in backlog |
| `constitution` | `<project>` | Get project constitution |
| `search` | `<project> <query> [-s stage]` | Search features by text |
| `stage` | `<project> [stage]` | Show stage breakdown or list features |
| `advance` | `<project> <feature>` | Move to next pipeline stage |

## Running

```bash
pnpm cli <command>  # tsx src/cli/index.ts <command>
```

## Patterns & Conventions

- Uses Commander.js for argument parsing
- All commands are async with `.action(async () => ...)`
- Content types validated: spec, plan, tasks, clarifications, analysis
- Stage validated: backlog, specs, plan, tasks
- Output is plain text to stdout

## Dependencies

- **Internal**: `@/lib/core` (CRUD, stage management), `@/lib/utils` (formatRelativeTime)
- **External**: `commander`
