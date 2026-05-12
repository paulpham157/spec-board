# Feature Detail V2 Directory

## Purpose
The ONLY supported feature detail UI - Jira-like modal for viewing and managing feature content.

## Overview
This is the primary feature detail component used across the application. It provides a two-panel layout: user stories on the left, document viewer on the right. Users can view/edit all feature content types (spec, plan, tasks, etc.) and trigger AI stage transitions.

**IMPORTANT**: Always use this component. Never use the legacy `feature-detail/` directory.

## Key Files

| File | Purpose |
|------|---------|
| `feature-detail-v2.tsx` | Main modal component (287 lines) |
| `index.tsx` | Re-exports |
| `types.ts` | Props, DocumentType, helper functions (190 lines) |
| `document-panel.tsx` | Right panel: document viewer with tab switching |
| `document-selector.tsx` | Document type dropdown selector |
| `user-story-panel.tsx` | Left panel: user stories list |
| `user-story-card.tsx` | Expandable user story card with tasks |
| `task-row.tsx` | Individual task row with completion toggle |
| `checklist-panel.tsx` | Checklist items display |
| `clarification-form.tsx` | Q&A form for clarifications |

## Subdirectories

### `stages/` - Stage Transition Modals
| File | Purpose |
|------|---------|
| `backlog-modal.tsx` | Backlog -> Specs transition |
| `specs-modal.tsx` | Combined Specify + Clarify modal |
| `specify-modal.tsx` | Generate spec from description |
| `clarify-modal.tsx` | Generate/answer clarification questions |
| `plan-modal.tsx` | Generate implementation plan |
| `checklist-modal.tsx` | Generate quality checklist |
| `tasks-modal.tsx` | Generate task breakdown |
| `analyze-modal.tsx` | Run consistency analysis |
| `placeholder-modal.tsx` | Generic placeholder modal |
| `index.ts` | Exports all modals |

### `base/` - Base Components
| File | Purpose |
|------|---------|
| `base-modal.tsx` | Shared modal wrapper with styling |
| `types.ts` | Base modal types |
| `index.ts` | Exports |

## Component Architecture

```
FeatureDetailV2
├── UserStoryPanel (left side)
│   ├── UserStoryCard (per story)
│   │   └── TaskRow (per task)
│   └── Orphan tasks
├── DocumentPanel (right side)
│   ├── DocumentSelector (tab switcher)
│   ├── MarkdownEditor (editing mode)
│   └── Content viewers (read mode)
└── Stage Modals (triggered by actions)
    ├── BacklogModal / SpecsModal
    ├── PlanModal / ChecklistModal
    ├── TasksModal / AnalyzeModal
    └── ClarifyModal
```

## Document Types

```typescript
type DocumentType = 'spec' | 'plan' | 'clarifications' | 'tasks' | 
  'research' | 'data-model' | 'quickstart' | 'contract' | 
  'checklist' | 'analysis' | 'impact';
```

## Key Types

```typescript
interface FeatureDetailV2Props {
  feature: Feature;
  onClose: () => void;
  onDelete?: () => void;
  onStageChange?: (stage: string) => void;
  initialDocument?: DocumentType;
}
```

## Patterns & Conventions

- Uses `'use client'` directive
- Local state with `useState` for selected document and tasks
- Refreshes feature data from DB after saves via `handleRefreshFeature`
- Uses `useRef` to avoid stale closures in callbacks
- Zustand store for project context (`useProjectStore`)
- All API calls use project slug from store

## Dependencies

- **Internal**: `@/lib/store`, `@/lib/utils`, `@/types`
- **External**: react, lucide-react
