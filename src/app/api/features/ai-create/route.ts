import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isPathSafe } from '@/lib/path-utils';
import { generateSpecKit, generateUserStories, getProvider } from '@/lib/ai';

// Disable Next.js route caching - always process fresh data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, description, projectPath } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }

    // Get project from database to find the filesystem path
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Determine the specs directory
    let specsDir: string | null = null;
    let featureDir: string | null = null;

    if (project.filePath) {
      // Validate project path is safe to access
      const { safe, resolvedPath } = isPathSafe(project.filePath);
      if (safe) {
        const projectSpecsDir = path.join(resolvedPath, 'specs');
        const altSpecsDir = path.join(resolvedPath, '.specify', 'specs');

        const specsExist = await fs.access(projectSpecsDir).then(() => true).catch(() => false);
        const altSpecsDirExist = await fs.access(altSpecsDir).then(() => true).catch(() => false);

        if (specsExist) {
          specsDir = projectSpecsDir;
        } else if (altSpecsDirExist) {
          specsDir = altSpecsDir;
        }
      }
    }

    // Generate feature ID (001-feature-name)
    let featureId: string;
    let featureNumber: number = 1;

    if (specsDir) {
      // Get next feature number from filesystem
      try {
        const entries = await fs.readdir(specsDir, { withFileTypes: true });
        const featureDirs = entries.filter(e => e.isDirectory());

        let maxNum = 0;
        for (const dir of featureDirs) {
          const match = dir.name.match(/^(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        featureNumber = maxNum + 1;
      } catch {
        featureNumber = 1;
      }

      featureId = `${String(featureNumber).padStart(3, '0')}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    } else {
      // Use simple ID if no filesystem
      const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
      featureId = words.length >= 2
        ? words.map((w: string) => w[0]).join('').substring(0, 4)
        : name.substring(0, 4).toLowerCase().replace(/\s/g, '');
    }

    // Generate spec-kit using AI
    let specContent = '';
    let planContent = '';
    let tasksContent = '';

    try {
      const specKit = await generateSpecKit({
        prdContent: description || name,
        featureName: name,
        projectContext: project.filePath || ''
      });

      // Generate markdown content
      specContent = generateSpecMarkdown(specKit.spec, name);
      planContent = generatePlanMarkdown(specKit.plan, name);
      tasksContent = generateTasksMarkdown(specKit.tasks);

      // Create feature directory and write files if specsDir exists
      if (specsDir) {
        featureDir = path.join(specsDir, featureId);
        await fs.mkdir(featureDir, { recursive: true });

        await fs.writeFile(path.join(featureDir, 'spec.md'), specContent);
        await fs.writeFile(path.join(featureDir, 'plan.md'), planContent);
        await fs.writeFile(path.join(featureDir, 'tasks.md'), tasksContent);
      }
    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      // If AI fails, create empty files with placeholder content
      specContent = generateEmptySpec(name);
      planContent = generateEmptyPlan(name);
      tasksContent = generateEmptyTasks(name);

      if (specsDir) {
        featureDir = path.join(specsDir, featureId);
        await fs.mkdir(featureDir, { recursive: true });

        await fs.writeFile(path.join(featureDir, 'spec.md'), specContent);
        await fs.writeFile(path.join(featureDir, 'plan.md'), planContent);
        await fs.writeFile(path.join(featureDir, 'tasks.md'), tasksContent);
      }
    }

    // Get max order for this project
    const maxOrderFeature = await prisma.feature.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });
    const newOrder = (maxOrderFeature?.order ?? -1) + 1;

    // Save feature to database - new feature starts in backlog
    // User will drag to specs to generate clarifications
    const feature = await prisma.feature.create({
      data: {
        projectId,
        featureId,
        name: name.trim(),
        description: description?.trim() || null,
        stage: 'backlog',
        order: newOrder,
        specContent,
        planContent,
        tasksContent,
      },
    });

    return NextResponse.json({
      id: feature.id,
      featureId: feature.featureId,
      name: feature.name,
      description: feature.description,
      stage: feature.stage,
      featurePath: featureDir || null,
      generatedWithAI: true,
      message: 'Feature created with AI-generated spec-kit'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}

// Helper: Generate spec.md content
function generateSpecMarkdown(spec: { userStories?: any[]; clarifications?: any[] }, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${featureName}\n\n`;
  content += `> **Input**: AI Generated\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Specify\n\n`;

  content += `## Overview\n\n`;
  content += `Feature specification for ${featureName}.\n\n`;

  if (spec.userStories && spec.userStories.length > 0) {
    content += `## User Stories\n\n`;
    for (const story of spec.userStories) {
      content += `### ${story.id}: ${story.title}\n\n`;
      content += `**Priority**: ${story.priority || 'P2'}\n\n`;
      content += `${story.description || ''}\n\n`;

      if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
        content += `#### Acceptance Criteria\n\n`;
        for (const criterion of story.acceptanceCriteria) {
          content += `- [ ] ${criterion}\n`;
        }
        content += `\n`;
      }
    }
  } else {
    content += `## User Stories\n\n`;
    content += `_No user stories generated yet_\n\n`;
  }

  if (spec.clarifications && spec.clarifications.length > 0) {
    content += `## Clarifications\n\n`;
    for (const clar of spec.clarifications) {
      content += `### Q: ${clar.question}\n\n`;
      content += `**A**: ${clar.answer}\n\n`;
    }
  }

  return content;
}

// Helper: Generate plan.md content
function generatePlanMarkdown(plan: { summary?: string; technicalContext?: any }, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${featureName} - Plan\n\n`;
  content += `> **Input**: spec.md\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Plan\n\n`;

  content += `## Summary\n\n${plan.summary || `Implementation plan for ${featureName}.`}\n\n`;

  content += `## Technical Context\n\n`;

  const tech = plan.technicalContext || {};
  content += `| Aspect | Value |\n`;
  content += `|--------|-------|\n`;
  content += `| Language | ${tech.language || 'TBD'} |\n`;
  content += `| Platform | ${tech.platform || 'TBD'} |\n`;
  content += `| Storage | ${tech.storage || 'TBD'} |\n`;
  content += `| Testing | ${tech.testing || 'TBD'} |\n`;
  content += `| Dependencies | ${tech.dependencies?.join(', ') || 'None'} |\n\n`;

  content += `## Approach\n\n`;
  content += `TBD - Add implementation approach details.\n\n`;

  return content;
}

// Helper: Generate tasks.md content
function generateTasksMarkdown(tasks: { phases?: any[] }): string {
  let content = `# Tasks\n\n`;
  content += `> **Input**: plan.md\n`;
  content += `> **Status**: Tasks\n\n`;

  if (tasks.phases && tasks.phases.length > 0) {
    for (const phase of tasks.phases) {
      content += `## ${phase.name}\n\n`;
      for (const task of phase.tasks || []) {
        const usRef = task.userStory ? ` [${task.userStory}]` : '';
        content += `- [ ] ${task.id}${usRef} ${task.description}\n`;
      }
      content += `\n`;
    }
  } else {
    content += `_No tasks generated yet_\n\n`;
  }

  return content;
}

// Helper: Empty spec when AI fails
function generateEmptySpec(featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# ${featureName}

> **Input**: Manual
> **Date**: ${date}
> **Status**: Specify

## Overview

${featureName} feature.

## User Stories

_No user stories defined yet_

## Clarifications

_No clarifications yet_
`;
}

// Helper: Empty plan when AI fails
function generateEmptyPlan(featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# ${featureName} - Plan

> **Input**: spec.md
> **Date**: ${date}
> **Status**: Plan

## Summary

TBD

## Technical Context

| Aspect | Value |
|--------|-------|
| Language | TBD |
| Platform | TBD |
| Storage | TBD |
| Testing | TBD |
| Dependencies | None |

## Approach

TBD - Add implementation approach details.
`;
}

// Helper: Empty tasks when AI fails
function generateEmptyTasks(featureName: string): string {
  return `# Tasks

> **Input**: plan.md
> **Status**: Tasks

_No tasks defined yet_
`;
}
