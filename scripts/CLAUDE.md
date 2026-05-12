# Scripts Directory

## Purpose
Utility scripts for database migrations, settings checks, testing, and automation.

## Key Files

| File | Purpose |
|------|---------|
| `migrate-stages.ts` | Migration script for workflow stage changes |
| `check-settings.ts` | Check and validate AI/app settings in database |
| `screenshots.ts` | Automated screenshot generation (Playwright) |
| `test-browser.ts` | Browser testing utility |
| `e2b-run-tests.js` | Run tests in E2B sandbox |
| `prisma-generate.sh` | Prisma client generation (shell) |
| `prisma-generate.mjs` | Prisma client generation (ESM) |
| `prisma-generate.js` | Prisma client generation (CJS) |
| `create-ai-provider-configs.sql` | SQL to seed AI provider configurations |

## Usage

```bash
# Run stage migration when workflow stages change
pnpm tsx scripts/migrate-stages.ts

# Check AI settings
pnpm tsx scripts/check-settings.ts

# Generate screenshots
pnpm tsx scripts/screenshots.ts

# Seed AI provider configs
psql $DATABASE_URL < scripts/create-ai-provider-configs.sql
```

## Patterns & Conventions

- TypeScript scripts run via `tsx` (dev dependency)
- Scripts import from `@/lib/` using path aliases
- Database access through Prisma client

## Dependencies

- **Internal**: `@/lib/prisma`, `@/lib/ai/settings`
- **External**: tsx, prisma, playwright
