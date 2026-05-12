# MCP Directory

## Purpose
Model Context Protocol (MCP) server for AI agent integration with SpecBoard.

## Overview
Provides 28+ MCP tools via stdio transport, allowing AI agents (Claude, Cursor, Devin, etc.) to read/write SpecBoard data, run AI pipelines, and detect spec violations. Uses `@modelcontextprotocol/sdk`.

## Key Files

| File | Purpose |
|------|---------|
| `server.ts` | MCP server with all tool definitions (607 lines) |

## Tool Categories

### Read Tools (11)
| Tool | Purpose |
|------|---------|
| `list_projects` | List all projects with feature counts |
| `get_project` | Project overview with stage breakdown |
| `get_feature` | Feature details (summary or full content) |
| `get_spec` | Get spec content |
| `get_plan` | Get plan content |
| `get_tasks` | Get tasks content |
| `get_constitution` | Get project constitution |
| `get_context` | Stage-aware context for AI consumption |
| `search_features` | Full-text search across features |
| `get_features_by_stage` | List features in a specific stage |
| `get_project_context` | Complete project context in one call |

### Write Tools (7)
| Tool | Purpose |
|------|---------|
| `create_feature` | Create feature in backlog |
| `update_feature_content` | Update spec/plan/tasks (full replace or diff patch) |
| `update_task_status` | Mark task complete/incomplete |
| `advance_feature` | Move to next pipeline stage |
| `update_feature_stage` | Set specific stage (including backwards) |
| `propose_spec_change` | Preview diff-based change (read-only) |
| `report_implementation` | Record what was actually built |

### Pipeline Tools (6)
| Tool | Purpose |
|------|---------|
| `generate_spec` | AI-generate spec from description |
| `generate_plan` | AI-generate plan from spec |
| `generate_tasks` | AI-generate tasks from spec+plan |
| `analyze` | AI-analyze consistency |
| `run_pipeline` | Full pipeline: spec -> plan -> tasks -> analyze |
| `orchestrate` | Orchestrated pipeline with parallel stages |

### Violation Tools (2)
| Tool | Purpose |
|------|---------|
| `detect_violations` | Compare spec against local code |
| `detect_violations_github` | Compare spec against GitHub repo |

## Running

```bash
pnpm mcp  # tsx src/mcp/server.ts
```

## Patterns & Conventions

- All tools use Zod schemas for input validation
- Tools delegate to `src/lib/core.ts` for business logic
- AI tools delegate to `src/lib/ai/` for generation
- Formatters in `src/lib/formatters.ts` convert AI output to markdown
- Uses stdio transport (StdioServerTransport)

## Dependencies

- **Internal**: `@/lib/core`, `@/lib/ai`, `@/lib/formatters`, `@/lib/prisma`
- **External**: `@modelcontextprotocol/sdk`, `zod`
