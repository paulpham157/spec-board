import { describe, it, expect } from 'vitest';
import {
  parseTaskLine,
  parseTasksFile,
  determineFeatureStage,
  parseClarifications,
  parseConstitution,
  parseUserStories,
  parseTechnicalContext,
  groupTasksByUserStory,
  parseChecklistCompletion,
} from './parser';

describe('parseTaskLine', () => {
  describe('basic task parsing', () => {
    it('should parse an incomplete task', () => {
      const result = parseTaskLine('- [ ] T001 Implement feature');
      expect(result).toEqual({
        id: 'T001',
        description: 'Implement feature',
        completed: false,
        parallel: false,
        userStory: undefined,
        filePath: undefined,
      });
    });

    it('should parse a completed task with lowercase x', () => {
      const result = parseTaskLine('- [x] T002 Fix bug');
      expect(result).toEqual({
        id: 'T002',
        description: 'Fix bug',
        completed: true,
        parallel: false,
        userStory: undefined,
        filePath: undefined,
      });
    });

    it('should parse a completed task with uppercase X', () => {
      const result = parseTaskLine('- [X] T003 Update docs');
      expect(result).toEqual({
        id: 'T003',
        description: 'Update docs',
        completed: true,
        parallel: false,
        userStory: undefined,
        filePath: undefined,
      });
    });
  });

  describe('parallel marker [P]', () => {
    it('should parse task with parallel marker', () => {
      const result = parseTaskLine('- [ ] T004 [P] Parallel task');
      expect(result).toEqual({
        id: 'T004',
        description: 'Parallel task',
        completed: false,
        parallel: true,
        userStory: undefined,
        filePath: undefined,
      });
    });

    it('should parse completed task with parallel marker', () => {
      const result = parseTaskLine('- [x] T005 [P] Done parallel task');
      expect(result).toEqual({
        id: 'T005',
        description: 'Done parallel task',
        completed: true,
        parallel: true,
        userStory: undefined,
        filePath: undefined,
      });
    });
  });

  describe('user story marker [USn]', () => {
    it('should parse task with user story reference', () => {
      const result = parseTaskLine('- [ ] T006 [US1] User story task');
      expect(result).toEqual({
        id: 'T006',
        description: 'User story task',
        completed: false,
        parallel: false,
        userStory: 'US1',
        filePath: undefined,
      });
    });

    it('should parse task with both parallel and user story markers', () => {
      const result = parseTaskLine('- [ ] T007 [P] [US2] Combined markers');
      expect(result).toEqual({
        id: 'T007',
        description: 'Combined markers',
        completed: false,
        parallel: true,
        userStory: 'US2',
        filePath: undefined,
      });
    });

    it('should parse multi-digit user story reference', () => {
      const result = parseTaskLine('- [ ] T008 [US15] Multi-digit story');
      expect(result).toEqual({
        id: 'T008',
        description: 'Multi-digit story',
        completed: false,
        parallel: false,
        userStory: 'US15',
        filePath: undefined,
      });
    });
  });

  describe('file path extraction', () => {
    it('should extract file path at end of description', () => {
      const result = parseTaskLine('- [ ] T009 Update component in src/components/Button.tsx');
      expect(result).toEqual({
        id: 'T009',
        description: 'Update component in src/components/Button.tsx',
        completed: false,
        parallel: false,
        userStory: undefined,
        filePath: 'src/components/Button.tsx',
      });
    });

    it('should extract various file extensions', () => {
      const result = parseTaskLine('- [ ] T010 Edit config.json');
      expect(result?.filePath).toBe('config.json');
    });
  });

  describe('edge cases and invalid inputs', () => {
    it('should return null for non-task lines', () => {
      expect(parseTaskLine('## Phase 1: Setup')).toBeNull();
      expect(parseTaskLine('Some random text')).toBeNull();
      expect(parseTaskLine('')).toBeNull();
      expect(parseTaskLine('- Regular list item')).toBeNull();
    });

    it('should return null for task without ID', () => {
      expect(parseTaskLine('- [ ] No task ID here')).toBeNull();
    });

    it('should handle extra whitespace', () => {
      const result = parseTaskLine('-  [ ]  T011   Extra spaces');
      expect(result?.id).toBe('T011');
      expect(result?.description).toBe('Extra spaces');
    });
  });
});

describe('parseTasksFile', () => {
  it('should parse a simple tasks file', () => {
    const content = `# Tasks

- [ ] T001 First task
- [x] T002 Second task
- [ ] T003 Third task
`;
    const result = parseTasksFile(content);

    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].id).toBe('T001');
    expect(result.tasks[1].completed).toBe(true);
    expect(result.phases).toHaveLength(0);
  });

  it('should parse tasks organized by phases', () => {
    const content = `# Tasks

## Phase 1: Setup
- [ ] T001 Initialize project
- [x] T002 Configure tools

## Phase 2: Implementation
- [ ] T003 Build feature
- [ ] T004 Add tests
`;
    const result = parseTasksFile(content);

    expect(result.tasks).toHaveLength(4);
    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].name).toBe('Setup');
    expect(result.phases[0].tasks).toHaveLength(2);
    expect(result.phases[1].name).toBe('Implementation');
    expect(result.phases[1].tasks).toHaveLength(2);
  });

  it('should handle empty content', () => {
    const result = parseTasksFile('');
    expect(result.tasks).toHaveLength(0);
    expect(result.phases).toHaveLength(0);
  });

  it('should handle content with no tasks', () => {
    const content = `# Tasks

This file has no actual tasks yet.

## Notes
Some planning notes here.
`;
    const result = parseTasksFile(content);
    expect(result.tasks).toHaveLength(0);
    expect(result.phases).toHaveLength(0);
  });

  it('should handle phase with colon separator', () => {
    const content = `## Phase 1: Core Features
- [ ] T001 Task one
`;
    const result = parseTasksFile(content);
    expect(result.phases[0].name).toBe('Core Features');
  });

  it('should skip empty phases', () => {
    const content = `## Phase 1: Empty Phase

## Phase 2: Has Tasks
- [ ] T001 A task
`;
    const result = parseTasksFile(content);
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].name).toBe('Has Tasks');
  });

  it('should extract user story from phase name and assign to tasks', () => {
    const content = `## Phase 1: Setup
- [ ] T001 Initialize project
- [x] T002 Configure tools

## Phase 2: US1 – Create Tasks
- [ ] T003 Create task model
- [x] T004 Implement task service

## Phase 3: US2 - Edit Tasks
- [ ] T005 Add edit functionality
`;
    const result = parseTasksFile(content);

    expect(result.tasks).toHaveLength(5);
    // Setup phase tasks should not have userStory
    expect(result.tasks[0].userStory).toBeUndefined();
    expect(result.tasks[1].userStory).toBeUndefined();
    // US1 phase tasks should inherit US1
    expect(result.tasks[2].userStory).toBe('US1');
    expect(result.tasks[3].userStory).toBe('US1');
    expect(result.tasks[3].completed).toBe(true);
    // US2 phase tasks should inherit US2
    expect(result.tasks[4].userStory).toBe('US2');
  });

  it('should not override explicit [USx] markers with phase name', () => {
    const content = `## Phase 1: US1 – Create Tasks
- [ ] T001 [US2] Task with explicit marker
- [ ] T002 Task without marker
`;
    const result = parseTasksFile(content);

    expect(result.tasks).toHaveLength(2);
    // Explicit marker should be preserved
    expect(result.tasks[0].userStory).toBe('US2');
    // Task without marker should inherit from phase
    expect(result.tasks[1].userStory).toBe('US1');
  });
});

describe('determineFeatureStage', () => {
  it('should return "specify" when no spec exists', () => {
    expect(determineFeatureStage(false, false, false, 0, 0)).toBe('specify');
    expect(determineFeatureStage(false, true, true, 5, 10)).toBe('specify');
  });

  it('should return "plan" when spec exists but no plan', () => {
    expect(determineFeatureStage(true, false, false, 0, 0)).toBe('plan');
    expect(determineFeatureStage(true, false, true, 0, 0)).toBe('plan');
  });

  it('should return "tasks" when plan exists but no tasks file', () => {
    expect(determineFeatureStage(true, true, false, 0, 0)).toBe('tasks');
  });

  it('should return "tasks" when tasks file exists but no tasks completed', () => {
    expect(determineFeatureStage(true, true, true, 0, 5)).toBe('tasks');
    expect(determineFeatureStage(true, true, true, 0, 0)).toBe('tasks');
  });

  it('should return "implement" when some tasks are completed', () => {
    expect(determineFeatureStage(true, true, true, 3, 10)).toBe('implement');
    expect(determineFeatureStage(true, true, true, 1, 5)).toBe('implement');
  });

  it('should return "complete" when all tasks are completed', () => {
    expect(determineFeatureStage(true, true, true, 10, 10)).toBe('complete');
    expect(determineFeatureStage(true, true, true, 1, 1)).toBe('complete');
  });

  it('should handle edge case of zero total tasks with tasks file', () => {
    // When tasks file exists but is empty, should stay in tasks stage
    expect(determineFeatureStage(true, true, true, 0, 0)).toBe('tasks');
  });
});

describe('parseClarifications', () => {
  it('should parse clarifications from spec content', () => {
    const content = `# Feature Spec

## User Stories
Some content here.

## Clarifications

### Session 2025-12-22

- Q: How should warnings be triggered? → A: Fixed threshold count per window.
- Q: How are warnings delivered? → A: Through Telegram bot.

## Requirements
More content.
`;
    const result = parseClarifications(content);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-12-22');
    expect(result[0].clarifications).toHaveLength(2);
    expect(result[0].clarifications[0].question).toBe('How should warnings be triggered?');
    expect(result[0].clarifications[0].answer).toBe('Fixed threshold count per window.');
    expect(result[0].clarifications[1].question).toBe('How are warnings delivered?');
    expect(result[0].clarifications[1].answer).toBe('Through Telegram bot.');
  });

  it('should parse multiple sessions', () => {
    const content = `## Clarifications

### Session 2025-12-22

- Q: First question? → A: First answer.

### Session 2025-12-23

- Q: Second question? → A: Second answer.
- Q: Third question? → A: Third answer.
`;
    const result = parseClarifications(content);

    expect(result).toHaveLength(2);
    // Sessions should be sorted newest first
    expect(result[0].date).toBe('2025-12-23');
    expect(result[0].clarifications).toHaveLength(2);
    expect(result[1].date).toBe('2025-12-22');
    expect(result[1].clarifications).toHaveLength(1);
  });

  it('should handle ASCII arrow notation (->)', () => {
    const content = `## Clarifications

### Session 2025-12-22

- Q: Question with ASCII arrow? -> A: Answer with ASCII arrow.
`;
    const result = parseClarifications(content);

    expect(result).toHaveLength(1);
    expect(result[0].clarifications[0].question).toBe('Question with ASCII arrow?');
    expect(result[0].clarifications[0].answer).toBe('Answer with ASCII arrow.');
  });

  it('should return empty array when no clarifications section', () => {
    const content = `# Feature Spec

## User Stories
Some content here.

## Requirements
More content.
`;
    const result = parseClarifications(content);
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty content', () => {
    const result = parseClarifications('');
    expect(result).toHaveLength(0);
  });

  it('should handle clarifications section with no sessions', () => {
    const content = `## Clarifications

No sessions yet.
`;
    const result = parseClarifications(content);
    expect(result).toHaveLength(0);
  });
});

describe('parseConstitution', () => {
  it('should parse constitution with principles', () => {
    const content = `# Project Constitution

## Core Principles

### I. Library-First
Every feature starts as a standalone library.

### II. Test-First
TDD mandatory: Tests written first.

## Governance

Constitution rules here.

**Version**: 2.1.1 | **Ratified**: 2025-06-13 | **Last Amended**: 2025-07-16
`;
    const result = parseConstitution(content);

    expect(result.principles).toHaveLength(2);
    expect(result.principles[0].name).toBe('I. Library-First');
    expect(result.principles[0].description).toBe('Every feature starts as a standalone library.');
    expect(result.principles[1].name).toBe('II. Test-First');
    expect(result.version).toBe('2.1.1');
    expect(result.ratifiedDate).toBe('2025-06-13');
    expect(result.lastAmendedDate).toBe('2025-07-16');
  });

  it('should parse sections outside Core Principles', () => {
    const content = `# Constitution

## Core Principles

### Principle One
Description.

## Governance

Governance rules.

## Additional Constraints

Some constraints.
`;
    const result = parseConstitution(content);

    expect(result.sections).toHaveLength(2);
    expect(result.sections.map(s => s.name)).toContain('Governance');
    expect(result.sections.map(s => s.name)).toContain('Additional Constraints');
  });

  it('should skip template placeholders', () => {
    const content = `# Constitution

## Core Principles

### [PRINCIPLE_1_NAME]
[PRINCIPLE_1_DESCRIPTION]

### Real Principle
Real description.

## [SECTION_NAME]

[SECTION_CONTENT]
`;
    const result = parseConstitution(content);

    expect(result.principles).toHaveLength(1);
    expect(result.principles[0].name).toBe('Real Principle');
    // Template sections should be skipped
    expect(result.sections.every(s => !s.name.startsWith('['))).toBe(true);
  });

  it('should strip HTML comments from content', () => {
    const content = `## Core Principles

### My Principle
<!-- This is a comment -->
Actual description here.
<!-- Another comment -->
`;
    const result = parseConstitution(content);

    expect(result.principles[0].description).toBe('Actual description here.');
  });

  it('should handle missing version info', () => {
    const content = `# Constitution

## Core Principles

### Simple Principle
Simple description.
`;
    const result = parseConstitution(content);

    expect(result.version).toBeUndefined();
    expect(result.ratifiedDate).toBeUndefined();
    expect(result.lastAmendedDate).toBeUndefined();
  });

  it('should preserve raw content', () => {
    const content = `# Constitution\n\nSome content here.`;
    const result = parseConstitution(content);

    expect(result.rawContent).toBe(content);
  });
});

describe('parseUserStories (T007)', () => {
  it('should parse user stories from spec.md content', () => {
    const content = `# Feature Spec

### User Story 1 - View Spec Content (Priority: P1)

As a developer, I want to see spec content.

**Acceptance Scenarios**:

1. **Given** a feature has spec.md, **When** I view it, **Then** I see content.

### User Story 2 - View Plan Content (Priority: P2)

As a developer, I want to see plan content.
`;
    const result = parseUserStories(content);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('US1');
    expect(result[0].title).toBe('View Spec Content');
    expect(result[0].priority).toBe('P1');
    expect(result[1].id).toBe('US2');
    expect(result[1].title).toBe('View Plan Content');
    expect(result[1].priority).toBe('P2');
  });

  it('should handle P3 priority', () => {
    const content = `### User Story 5 - Open Files (Priority: P3)

Low priority feature.
`;
    const result = parseUserStories(content);

    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('P3');
  });

  it('should return empty array when no user stories', () => {
    const content = `# Feature Spec

## Requirements
Some requirements here.
`;
    const result = parseUserStories(content);
    expect(result).toHaveLength(0);
  });

  it('should handle en-dash in title separator', () => {
    const content = `### User Story 1 – View Content (Priority: P1)

Description here.
`;
    const result = parseUserStories(content);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('View Content');
  });
});

describe('parseTechnicalContext (T009)', () => {
  it('should parse technical context from plan.md', () => {
    const content = `# Implementation Plan

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: Next.js 16.1.1, React 19.2.3, Zustand 5.0.9
**Storage**: PostgreSQL
**Testing**: Vitest
**Target Platform**: Web browser

## Architecture
More content here.
`;
    const result = parseTechnicalContext(content);

    expect(result).not.toBeNull();
    expect(result!.language).toBe('TypeScript 5.9.3');
    expect(result!.dependencies).toEqual(['Next.js 16.1.1', 'React 19.2.3', 'Zustand 5.0.9']);
    expect(result!.storage).toBe('PostgreSQL');
    expect(result!.testing).toBe('Vitest');
    expect(result!.platform).toBe('Web browser');
  });

  it('should return null when no Technical Context section', () => {
    const content = `# Implementation Plan

## Architecture
Some architecture content.
`;
    const result = parseTechnicalContext(content);
    expect(result).toBeNull();
  });

  it('should handle missing fields gracefully', () => {
    const content = `## Technical Context

**Language/Version**: Python 3.11
`;
    const result = parseTechnicalContext(content);

    expect(result).not.toBeNull();
    expect(result!.language).toBe('Python 3.11');
    expect(result!.dependencies).toEqual([]);
    expect(result!.storage).toBe('');
  });
});

describe('groupTasksByUserStory (T011)', () => {
  const mockUserStories = [
    { id: 'US1', title: 'First Story', priority: 'P1' as const, description: '', acceptanceCriteria: [] },
    { id: 'US2', title: 'Second Story', priority: 'P2' as const, description: '', acceptanceCriteria: [] },
  ];

  it('should group tasks by user story', () => {
    const tasks = [
      { id: 'T001', description: 'Task 1', completed: false, parallel: false, userStory: 'US1' },
      { id: 'T002', description: 'Task 2', completed: true, parallel: false, userStory: 'US1' },
      { id: 'T003', description: 'Task 3', completed: false, parallel: false, userStory: 'US2' },
    ];

    const result = groupTasksByUserStory(tasks, mockUserStories);

    expect(result).toHaveLength(2);
    expect(result[0].storyId).toBe('US1');
    expect(result[0].storyTitle).toBe('First Story');
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].completedCount).toBe(1);
    expect(result[0].totalCount).toBe(2);
    expect(result[1].storyId).toBe('US2');
    expect(result[1].tasks).toHaveLength(1);
  });

  it('should put ungrouped tasks in Other Tasks', () => {
    const tasks = [
      { id: 'T001', description: 'Task 1', completed: false, parallel: false, userStory: 'US1' },
      { id: 'T002', description: 'Task 2', completed: false, parallel: false },
      { id: 'T003', description: 'Task 3', completed: true, parallel: false },
    ];

    const result = groupTasksByUserStory(tasks, mockUserStories);

    expect(result).toHaveLength(2);
    expect(result[1].storyId).toBeNull();
    expect(result[1].storyTitle).toBe('Other Tasks');
    expect(result[1].tasks).toHaveLength(2);
    expect(result[1].completedCount).toBe(1);
  });

  it('should handle empty tasks array', () => {
    const result = groupTasksByUserStory([], mockUserStories);
    expect(result).toHaveLength(0);
  });

  it('should handle tasks with unknown user story in Other Tasks', () => {
    const tasks = [
      { id: 'T001', description: 'Task 1', completed: false, parallel: false, userStory: 'US99' },
    ];

    const result = groupTasksByUserStory(tasks, mockUserStories);

    // Unknown story tasks go to a separate group (not "Other Tasks" since they have a userStory)
    expect(result).toHaveLength(1);
    expect(result[0].storyId).toBe('US99');
    expect(result[0].storyTitle).toBe('US99'); // Uses ID as title when story not found
  });
});

describe('parseChecklistCompletion', () => {
  it('should count unchecked and checked items', () => {
    const content = `# Checklist
- [ ] Item 1
- [x] Item 2
- [ ] Item 3
- [X] Item 4
`;
    const result = parseChecklistCompletion(content);
    expect(result.total).toBe(4);
    expect(result.completed).toBe(2);
  });

  it('should handle all unchecked items', () => {
    const content = `- [ ] Task 1
- [ ] Task 2
- [ ] Task 3`;
    const result = parseChecklistCompletion(content);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(0);
  });

  it('should handle all checked items', () => {
    const content = `- [x] Done 1
- [X] Done 2`;
    const result = parseChecklistCompletion(content);
    expect(result.total).toBe(2);
    expect(result.completed).toBe(2);
  });

  it('should handle empty content', () => {
    const result = parseChecklistCompletion('');
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
  });

  it('should handle content with no checkboxes', () => {
    const content = `# Just a heading
Some regular text
- A bullet point without checkbox`;
    const result = parseChecklistCompletion(content);
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
  });

  it('should handle asterisk bullet points', () => {
    const content = `* [ ] Asterisk unchecked
* [x] Asterisk checked`;
    const result = parseChecklistCompletion(content);
    expect(result.total).toBe(2);
    expect(result.completed).toBe(1);
  });

  it('should handle indented checkboxes', () => {
    const content = `- [ ] Top level
  - [ ] Indented
    - [x] Double indented`;
    const result = parseChecklistCompletion(content);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(1);
  });
});
