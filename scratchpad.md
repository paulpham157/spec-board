# Lessons

## User Specified Lessons

### Business Analysis

#### Usecase 1 - Spec Workflow
- As a user, I can create a new project and manage features through a Kanban board
- As a user, I can generate specs, plans, tasks using AI through a 4-stage pipeline: backlog -> specs -> plan -> tasks
- As a user, I can analyze consistency across documents and detect spec violations

#### Usecase 2 - Mind Map Brainstorming
- As a user, I can create mind maps for brainstorming feature ideas
- As a user, I can convert mind map nodes to features

#### Usecase 3 - MCP/CLI Integration
- As a developer, I can interact with SpecBoard via MCP tools (28+ tools)
- As a developer, I can manage specs from the terminal via CLI

### Project structures

#### Technical
- Backend: Next.js 16 App Router (API Routes) + PostgreSQL (Prisma ORM)
- Frontend: React 19, Tailwind CSS v4, shadcn/ui, Zustand, Lucide icons
- AI: AIService class supporting OpenAI-compatible APIs (multi-provider load balancing)
- Code Execution: E2B sandbox
- MCP: @modelcontextprotocol/sdk (28+ tools)
- CLI: Commander.js
- Testing: Vitest + Playwright (e2e)
- Package Manager: pnpm

#### Database Models
- Project -> Feature -> UserStory -> Task
- Project -> Constitution -> ConstitutionVersion
- Project -> MindMapNode, MindMapEdge
- AppSettings (singleton)
- AIProviderConfig (multi-provider)

#### Workflow
- 4-stage pipeline: backlog -> specs -> plan -> tasks
- SPECS stage merges old Specify + Clarify
- PLAN stage includes checklist generation
- Analysis runs automatically during tasks stage
- Orchestrator supports parallel stages: (spec+clarify) -> plan -> (tasks+checklist) -> analyze

## You have learned in the past

### Database-First Architecture
- All project content stored in PostgreSQL, NOT filesystem
- parser.ts is legacy code - not used for main data flow
- Content fields: specContent, planContent, tasksContent, clarificationsContent, etc.

### Feature Detail V2
- ALWAYS use FeatureDetailV2 (src/components/feature-detail-v2/)
- Never use legacy feature-detail component

### AI Service
- ALWAYS use real AI via AIService - never mock data
- Use getAISettings() to retrieve API keys from database
- Multi-provider load balancing with priority-based fallback
- Supports OpenAI, Anthropic, and any OpenAI-compatible API

### Path Aliases
- Use @/ for imports (e.g., @/lib/store)
- kebab-case for file naming

### Completion Verification
- Before claiming a task is complete, re-read `scratchpad.md` and verify all relevant checklist items match the actual repo state.
- `git diff --stat` does not show untracked files; use `git status --short --untracked-files=all` when newly created files are expected.

### Bug Scan Findings
- Next.js 16 CLI no longer supports `next lint`; current `pnpm lint` script fails by treating `lint` as a project directory.
- `isPathSafe()` returns `{ safe, resolvedPath }`; callers must check `.safe`, not the object itself.
- Current `isPathSafe()` prefix check treats `/UsersX` and `/homebad` as safe because it uses raw `startsWith(root)`.
- `BacklogModal` sends an existing `featureId` to `/api/spec-workflow/specify`, but the route ignores it and creates a new feature.
- Analysis markdown score calculation needs explicit parentheses around each score before summing.

### Bug Fixes Completed (2026-05-11)
1. **Critical Security - detect_violations bypass**: Fixed `violation-detector.ts` to check `pathCheck.safe` instead of object truthiness
2. **Critical Security - isPathSafe prefix bypass**: Fixed `path-utils.ts` to use proper path boundary check with `path.sep`
3. **Critical Workflow - specify duplicate feature**: Fixed `specify/route.ts` to accept and update existing `featureId` instead of always creating new
4. **High UI - Plan modal missing button**: Added "Generate Plan" button to empty state in `plan-modal.tsx`
5. **High Workflow - ai-create not persisting content**: Fixed `ai-create/route.ts` to save specContent, planContent, tasksContent to database
6. **High Reporting - score operator precedence**: Fixed parentheses in analyze route and formatters.ts for correct average calculation
7. **Medium Reporting - wrong issue field**: Fixed analyze route to use `issue.message` instead of `issue.description`
8. **Medium API - old stage validation**: Fixed status route to validate current stages: backlog, specs, plan, tasks
9. **Medium Dev/Test - broken lint script**: Changed `pnpm lint` to use `pnpm exec tsc --noEmit` (Next.js 16 compatibility)
10. **Medium E2E - Playwright port mismatch**: Fixed playwright.config.ts to use port 3000 instead of 3002

### Verification Results
- All 274 tests passed after fixes
- Lint script now functional (though Next.js 16 has framework-level TypeScript errors unrelated to fixes)


# Scratchpad

## Current Task: Mind Map UI/UX Improvements - COMPLETED

### Implemented Changes

[X] 1. Color palette - 10 colors organized by Warm/Cool/Neutral với dropdown picker
[X] 2. Priority borders - border-[3px] + glow shadow effects cho must_have/nice_to_have/no_need
[X] 3. Node sizing - 3 sizes: root (160px), parent (130px), leaf (100px) based on connections
[X] 4. Edge styling - Bezier curves với gradient colors + animated flow dots
[X] 5. Minimap - React Flow MiniMap ở góc phải với node colors
[X] 6. Empty state - Lightbulb illustration + "Start Brainstorming" CTA + tips
[X] 7. Toolbar upgrade - Zoom in/out/fit view + Color picker dropdown
[X] 8. Animations - animate-in fade-in zoom-in-95 cho nodes, hover:scale-105

### Files Modified
- `src/components/mind-map/mind-map-node.tsx` - Priority glow, node sizing, better styling
- `src/components/mind-map/mind-map-edge.tsx` - Bezier curves, gradient, animated dots
- `src/components/mind-map/mind-map-toolbar.tsx` - Color picker dropdown, zoom controls
- `src/components/mind-map/index.tsx` - MiniMap, EmptyState, status indicators

---

## Previous Task: Auto-Labeling Features with AI Priority - COMPLETED

### Requirement (Done)
- AI tự động đánh giá và gắn nhãn priority cho features:
  - "must_have" - Tính năng bắt buộc
  - "nice_to_have" - Tính năng tốt nhưng không bắt buộc  
  - "no_need" - Không cần thiết
- AI cung cấp lý do cho việc đánh giá
- Hiển thị trên: Feature list, Mind map, Feature detail

### Implementation Completed

[X] 1. Database Schema - Thêm fields vào Feature model
    - `priority`: String (must_have, nice_to_have, no_need)
    - `priorityReason`: Text - lý do AI đưa ra
    - `MindMapNode.priority`: cho mind map nodes

[X] 2. TypeScript Types - Cập nhật types
    - `FeaturePriority` type + `PRIORITY_CONFIG` constants
    - Updated `Feature` interface với priority/priorityReason
    - `GeneratePriorityOptions`, `GeneratedPriority`, `BatchPriorityOptions`, `BatchPriorityResult`

[X] 3. AI Service - Thêm methods
    - `generatePriority()` - đánh giá single feature
    - `generateBatchPriority()` - đánh giá nhiều features
    - Smart prompts xem xét user impact, business value, technical necessity

[X] 4. API Route - `/api/spec-workflow/prioritize`
    - POST: Single feature hoặc batch prioritization
    - PATCH: Manually set priority
    - DELETE: Clear priority

[X] 5. UI Components
    - priority-label.tsx: PriorityLabel, PriorityDot, PriorityWithReason
    - feature-list.tsx: Show PriorityDot
    - feature-card-popover.tsx: Priority section với reason
    - mind-map-node.tsx: Border color + icon theo priority
    - header.tsx: "AI Prioritize" button cho batch

[X] 6. Testing & Verification
    - 274 tests passed
    - TypeScript compile OK (only Next.js 16 framework issues)

---
## Previous Tasks (Completed)
[X] Find bugs: inspect project commands and current repo state
[X] Run automated checks: lint, typecheck, tests where practical
[X] Triage failures and trace root causes
[X] Summarize confirmed bugs with file references
[X] Fix all 10 confirmed bugs
[X] Verify fixes with tests (274 passed)
[X] Commit and push fixes to remote (commit f04e427)
