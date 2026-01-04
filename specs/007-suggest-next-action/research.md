# Research: Suggest Next Action

**Feature**: 007-suggest-next-action
**Date**: 2026-01-03

## Technology Decisions

### 1. Extend Existing Infrastructure vs. Build New

**Decision**: Extend existing `getSuggestedCommand()` function and `SuggestedCommandCard` component.

**Rationale**:
- Core suggestion logic already exists and works correctly
- UI component already handles copy-to-clipboard, primary/optional display
- Minimal code changes required for maximum impact
- Follows constitution principle VI (Component Simplicity)

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| New suggestion service | Over-engineering; existing function is sufficient |
| State machine for workflow | Unnecessary complexity; linear workflow is simple |
| Server-side suggestion API | No benefit; all data already available client-side |

### 2. Type Extension Strategy

**Decision**: Add `reason` field to existing `SuggestedCommand` interface.

**Rationale**:
- Backward compatible (optional field)
- Single source of truth for suggestion data
- No breaking changes to existing consumers

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Separate `SuggestionReason` type | Unnecessary indirection |
| Compute reason in component | Duplicates logic, harder to test |

### 3. Kanban Card Indicator

**Decision**: Add small badge/icon to feature cards showing next action.

**Rationale**:
- Provides at-a-glance visibility (FR-007)
- Doesn't clutter existing card design
- Uses existing Lucide icons for consistency

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Full suggestion text on card | Too verbose, clutters UI |
| Tooltip only | Not visible enough at a glance |
| Separate suggestions panel | Breaks spatial relationship with features |

## Existing Code Analysis

### getSuggestedCommand() Function

**Location**: `src/lib/utils.ts:141-249`

**Current Logic Flow**:
```
1. Check hasConstitution → suggest /speckit.constitution
2. Check hasSpec → suggest /speckit.specify
3. Check hasPlan → suggest /speckit.plan (optional: /speckit.clarify)
4. Check hasTasks → suggest /speckit.tasks (optional: /speckit.checklist)
5. Check task completion → suggest /speckit.implement (optional: /speckit.analyze)
6. All complete → suggest /speckit.analyze if missing, else null
```

**Strengths**:
- Covers full workflow
- Handles optional suggestions
- Uses Feature type directly

**Gaps**:
- No explanation of WHY each suggestion is made
- No handling of blocked/unknown states
- No indication of what's missing (e.g., "spec.md not found")

### SuggestedCommandCard Component

**Location**: `src/components/feature-detail/suggested-command-card.tsx`

**Current Features**:
- Displays primary and optional commands
- Copy-to-clipboard functionality
- Collapsible optional section
- "Feature Complete" state

**Gaps**:
- No display of explanation/reason
- No visual indicator for blocked state

### Feature Type

**Location**: `src/types/index.ts:118-150`

**Relevant Fields**:
```typescript
interface Feature {
  stage: FeatureStage;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  totalTasks: number;
  completedTasks: number;
  hasChecklists: boolean;
  totalChecklistItems: number;
  completedChecklistItems: number;
  analysis: FeatureAnalysis | null;
}
```

All fields needed for suggestion logic are already available.

## Implementation Approach

### Phase 1: Type Enhancement

1. Add `reason` field to `SuggestedCommand`:
   ```typescript
   export interface SuggestedCommand {
     command: string;
     title: string;
     description: string;
     reason: string;  // NEW: Why this action is suggested
     isOptional: boolean;
   }
   ```

### Phase 2: Logic Enhancement

1. Update `getSuggestedCommand()` to include reasons:
   - "No spec.md found - define requirements first"
   - "Spec complete, ready for technical planning"
   - "Plan complete, break down into tasks"
   - "3 of 10 tasks remaining"
   - etc.

2. Add blocked state detection:
   - Check for missing files that should exist
   - Check for inconsistent states

### Phase 3: UI Enhancement

1. Update `SuggestedCommandCard` to display reason
2. Add suggestion indicator to Kanban cards

### Phase 4: Testing

1. Unit tests for `getSuggestedCommand()` covering all states
2. Edge case tests for blocked/unknown states
