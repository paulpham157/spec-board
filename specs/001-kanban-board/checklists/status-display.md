# Checklist: Status Display Requirements

**Feature**: 001-kanban-board
**Date**: 2025-12-29
**Topic**: Which statuses appear on the Kanban board

## Overview

This checklist validates the status display requirements for the Kanban board. Features are categorized into columns based on their workflow state.

## Column Statuses

The Kanban board displays **4 columns** (statuses):

| Column | Display Label | Description |
|--------|---------------|-------------|
| `backlog` | Backlog | Features being specified |
| `planning` | Planning | Features with plan, awaiting tasks |
| `in_progress` | In Progress | Features being worked on |
| `done` | Done | Fully completed features |

## Status Assignment Rules

### Backlog Status
- [x] Features with NO spec.md file → Backlog
- [x] Features with spec.md but NO plan.md → Backlog
- [x] Label displays as "Backlog"
- [x] Empty state hint: "Features being specified"

### Planning Status
- [x] Features with plan.md but NO tasks.md → Planning
- [x] Label displays as "Planning"
- [x] Empty state hint: "Features with plan, awaiting tasks"

### In Progress Status
- [x] Features with tasks.md and incomplete tasks → In Progress
- [x] Features with all tasks complete BUT incomplete checklists → In Progress
- [x] Label displays as "In Progress"
- [x] Empty state hint: "Features being worked on"

### Done Status
- [x] Features with ALL tasks complete AND ALL checklists complete → Done
- [x] Features with all tasks complete and NO checklists → Done
- [x] Label displays as "Done"
- [x] Empty state hint: "Fully completed features"

## Visual Indicators

### Progress Colors by Status
- [x] 0% or no tasks: Gray (`--muted-foreground`)
- [x] 1-79% complete: Yellow/Warning (`--color-warning`)
- [x] 80-99% complete: Neon/Highlight (`--color-neon`)
- [x] 100% complete: Green/Success (`--color-success`)

### Progress Bar
- [x] Always visible on feature cards
- [x] Shows task completion percentage
- [x] Color matches progress tier above

### Checklist Progress
- [x] Displayed separately from task progress
- [x] Format: "X/Y checklists"
- [x] Only shown when checklists exist

## Implementation Verification

### Source Files
- [x] Column type defined in `src/lib/utils.ts:49`
- [x] Assignment logic in `getFeatureKanbanColumn()` at `src/lib/utils.ts:75-106`
- [x] Label mapping in `getKanbanColumnLabel()` at `src/lib/utils.ts:108`
- [x] Color logic in `getProgressColorStyle()` at `src/components/kanban-board.tsx:13-25`

### Test Coverage
- [x] Unit tests exist at `src/lib/utils.test.ts`
- [x] Tests cover all column assignment scenarios
- [x] Run tests: `pnpm test src/lib/utils.test.ts`

## Edge Cases

- [x] Feature with spec but empty plan.md → Backlog (plan exists but no content)
- [x] Feature with 0 tasks in tasks.md → In Progress (file exists)
- [x] Feature with all tasks done, 0/5 checklists → In Progress
- [x] Feature with no tasks file, no checklists → follows spec/plan rules

## Summary

| Condition | Status |
|-----------|--------|
| No spec | Backlog |
| Spec, no plan | Backlog |
| Plan, no tasks | Planning |
| Tasks incomplete | In Progress |
| Tasks complete, checklists incomplete | In Progress |
| Tasks complete, no checklists | Done |
| Tasks complete, checklists complete | Done |

---

**Checklist Status**: ✅ All items verified against existing implementation
