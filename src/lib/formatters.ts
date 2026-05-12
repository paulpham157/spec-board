import type { GeneratedSpec, GeneratedTasks, AnalysisResult } from '@/lib/ai/types';

export function generateSpecMarkdown(spec: GeneratedSpec, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# ${featureName}\n\n`;
  content += `> **Input**: User description\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Specify\n\n`;

  content += `## User Stories\n\n`;
  for (const story of spec.userStories || []) {
    content += `### ${story.id}: ${story.title} (Priority: ${story.priority})\n\n`;
    content += `${story.description}\n\n`;
    if (story.acceptanceCriteria?.length) {
      content += `#### Acceptance Criteria\n\n`;
      for (const criteria of story.acceptanceCriteria) {
        content += `- [ ] ${criteria}\n`;
      }
      content += `\n`;
    }
  }

  if (spec.edgeCases?.length) {
    content += `## Edge Cases\n\n`;
    for (const edge of spec.edgeCases) content += `- ${edge}\n`;
    content += `\n`;
  }

  if (spec.functionalRequirements?.length) {
    content += `## Requirements\n\n`;
    for (const req of spec.functionalRequirements) content += `${req}\n`;
    content += `\n`;
  }

  if (spec.successCriteria?.length) {
    content += `## Success Criteria\n\n`;
    for (const sc of spec.successCriteria) content += `- ${sc}\n`;
    content += `\n`;
  }

  return content;
}

export function generateClarificationsMarkdown(questions: { question: string; context?: string; answer?: string }[]): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Clarifications\n\n`;
  content += `**Date**: ${date}\n\n`;

  content += `## Questions & Answers\n\n`;
  for (const item of questions) {
    const contextSuffix = item.context ? `\n_${item.context}_` : '';
    content += `### Q: ${item.question}${contextSuffix}\n\n`;
    if (item.answer) {
      content += `**A**: ${item.answer}\n\n`;
    } else {
      content += `**A**: _Pending_\n\n`;
    }
  }

  return content;
}

export function generatePlanMarkdown(plan: any, featureName: string, featureId?: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Implementation Plan: ${featureName}\n\n`;
  content += `> **Date**: ${date}\n`;
  if (featureId) content += `> **Feature**: ${featureId}\n`;
  content += `\n`;

  if (plan.summary) {
    content += `## Summary\n\n${plan.summary}\n\n`;
  }

  if (plan.technicalContext) {
    content += `## Technical Context\n\n`;
    const tc = plan.technicalContext;
    if (tc.language) content += `- **Language**: ${tc.language}${tc.version ? ` ${tc.version}` : ''}\n`;
    if (tc.dependencies?.length) content += `- **Dependencies**: ${tc.dependencies.join(', ')}\n`;
    if (tc.storage) content += `- **Storage**: ${tc.storage}\n`;
    if (tc.testing) content += `- **Testing**: ${tc.testing}\n`;
    if (tc.platform) content += `- **Platform**: ${tc.platform}\n`;
    if (tc.performanceGoals) content += `- **Performance Goals**: ${tc.performanceGoals}\n`;
    if (tc.constraints) content += `- **Constraints**: ${tc.constraints}\n`;
    content += `\n`;
  }

  if (plan.projectStructure) {
    content += `## Project Structure\n\n`;
    if (plan.projectStructure.decision) {
      content += `**Decision**: ${plan.projectStructure.decision}\n\n`;
    }
    if (plan.projectStructure.structure) {
      content += `\`\`\`\n${plan.projectStructure.structure}\n\`\`\`\n\n`;
    }
  }

  if (plan.complexityViolations?.length) {
    content += `## Complexity Violations\n\n`;
    for (const v of plan.complexityViolations) {
      content += `- **${v.violation}**: ${v.reason}\n`;
      content += `  - Rejected: ${v.rejectedAlternative}\n`;
    }
    content += `\n`;
  }

  return content;
}

export function generateTasksMarkdown(tasks: GeneratedTasks, featureName: string): string {
  let content = `# Tasks: ${featureName}\n\n`;
  content += `**Input**: Design documents from spec and plan\n`;
  content += `**Prerequisites**: plan.md (required), spec.md (required for user stories)\n\n`;

  content += `## Format: \`[ID] [P?] [Story] Description\`\n\n`;
  content += `- **[P]**: Can run in parallel (different files, no dependencies)\n`;
  content += `- **[Story]**: Which user story this task belongs to (e.g., US1, US2)\n`;
  content += `- Include exact file paths in descriptions\n\n`;

  const phases = tasks.phases || [];

  for (const phase of phases) {
    content += `---\n\n`;
    content += `## ${phase.name}\n\n`;

    if (phase.purpose) {
      content += `**Purpose**: ${phase.purpose}\n\n`;
    }

    if ((phase as any).goal) {
      content += `**Goal**: ${(phase as any).goal}\n\n`;
    }

    if ((phase as any).independentTest) {
      content += `**Independent Test**: ${(phase as any).independentTest}\n\n`;
    }

    if (phase.checkpoint) {
      content += `> **Checkpoint**: ${phase.checkpoint}\n\n`;
    }

    for (const task of phase.tasks || []) {
      const usRef = task.userStory ? ` [${task.userStory}]` : '';
      const parallel = task.parallel ? ' [P]' : '';
      content += `- [ ] ${task.id}${parallel}${usRef} ${task.description}\n`;
    }
    content += `\n`;
  }

  content += `---\n\n`;
  content += `## Dependencies & Execution Order\n\n`;
  content += `### Phase Dependencies\n\n`;
  content += `- **Setup**: No dependencies - can start immediately\n`;
  content += `- **Foundational**: Depends on Setup - BLOCKS all user stories\n`;
  content += `- **User Stories**: All depend on Foundational\n`;
  content += `- **Polish**: Depends on all user stories\n\n`;

  content += `## Notes\n\n`;
  content += `- [P] tasks = different files, no dependencies\n`;
  content += `- [Story] label maps task to specific user story\n`;
  content += `- Each user story should be independently testable\n`;
  content += `- Verify tests fail before implementing\n`;
  content += `- Commit after each task or logical group\n\n`;

  return content;
}

export function generateAnalysisMarkdown(analysis: AnalysisResult): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Analysis Report\n\n`;
  content += `**Date**: ${date}\n`;
  content += `**Status**: ${analysis.isValid ? '✅ Valid' : '❌ Issues Found'}\n\n`;

  content += `## Summary\n\n`;
  const avgScore = Math.round(
    ((analysis.specPlanConsistency?.score || 0) +
     (analysis.planTasksConsistency?.score || 0) +
     (analysis.constitutionAlignment?.score || 0)) / 3
  );
  content += `**Overall Score**: ${avgScore}%\n\n`;

  content += `## Spec-Plan Consistency\n\n`;
  content += `**Score**: ${analysis.specPlanConsistency?.score || 0}%\n`;
  content += `**Status**: ${analysis.specPlanConsistency?.isConsistent ? '✅ Consistent' : '⚠️ Inconsistent'}\n\n`;
  if ((analysis.specPlanConsistency as any)?.details) {
    content += `${(analysis.specPlanConsistency as any).details}\n\n`;
  }

  content += `## Plan-Tasks Consistency\n\n`;
  content += `**Score**: ${analysis.planTasksConsistency?.score || 0}%\n`;
  content += `**Status**: ${analysis.planTasksConsistency?.isConsistent ? '✅ Consistent' : '⚠️ Inconsistent'}\n\n`;
  if ((analysis.planTasksConsistency as any)?.details) {
    content += `${(analysis.planTasksConsistency as any).details}\n\n`;
  }

  content += `## Constitution Alignment\n\n`;
  content += `**Score**: ${analysis.constitutionAlignment?.score || 0}%\n`;
  content += `**Status**: ${analysis.constitutionAlignment?.isConsistent ? '✅ Aligned' : '⚠️ Misaligned'}\n\n`;
  if ((analysis.constitutionAlignment as any)?.details) {
    content += `${(analysis.constitutionAlignment as any).details}\n\n`;
  }

  if (analysis.issues?.length > 0) {
    content += `## Issues\n\n`;
    for (const issue of analysis.issues) {
      const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      content += `${icon} **${issue.severity.toUpperCase()}**: ${issue.message}\n`;
      if (issue.location) {
        content += `   *Location*: ${issue.location}\n`;
      }
      if ((issue as any).suggestion) {
        content += `   *Suggestion*: ${(issue as any).suggestion}\n`;
      }
      content += '\n';
    }
  }

  return content;
}
