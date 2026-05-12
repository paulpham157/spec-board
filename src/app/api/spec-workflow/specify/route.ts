import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSpec, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/specify - Generate spec and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, name, description } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const provider = await getProvider();
    const spec = await generateSpec({
      featureName: name,
      description: description || name,
      projectContext: ''
    });

    const specContent = generateSpecMarkdown(spec, name);

    // Get latest constitution version for this project
    const latestConstitution = await prisma.constitution.findUnique({
      where: { projectId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    const constitutionVersionId = latestConstitution?.versions[0]?.id || null;

    let feature;

    // If featureId is provided, update existing feature (transition from backlog to specs)
    if (featureId) {
      feature = await prisma.feature.update({
        where: { id: featureId },
        data: {
          name,
          description: description || null,
          stage: 'specs', // Move to specs stage
          specContent, // Save spec markdown to database
          constitutionVersionId // Track which constitution version was active
        }
      });

      // Delete existing user stories and create new ones
      await prisma.userStory.deleteMany({ where: { featureId: feature.id } });

      // Create user stories in database
      if (spec.userStories?.length) {
        await prisma.userStory.createMany({
          data: spec.userStories.map((story: any, index: number) => ({
            featureId: feature.id,
            storyId: story.id || `US${index + 1}`,
            title: story.title,
            description: story.description || null,
            status: 'pending',
            order: index,
          }))
        });
      }
    } else {
      // Create new feature (legacy behavior for direct spec creation)
      const featureCount = await prisma.feature.count({ where: { projectId } });
      const newFeatureId = `${String(featureCount + 1).padStart(3, '0')}-${name.toLowerCase().replace(/\s+/g, '-')}`;

      feature = await prisma.feature.create({
        data: {
          projectId,
          featureId: newFeatureId,
          name,
          description: description || null,
          stage: 'specs',
          order: featureCount,
          specContent, // Save spec markdown to database
          constitutionVersionId // Track which constitution version was active
        }
      });

      // Create user stories in database
      if (spec.userStories?.length) {
        await prisma.userStory.createMany({
          data: spec.userStories.map((story: any, index: number) => ({
            featureId: feature.id,
            storyId: story.id || `US${index + 1}`,
            title: story.title,
            description: story.description || null,
            status: 'pending',
            order: index,
          }))
        });
      }
    }

    return NextResponse.json({
      step: 'specify',
      spec,
      content: specContent,
      featureId: feature.id,
      featureIdDb: feature.featureId,
      provider
    });
  } catch (error) {
    console.error('Error in specify:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate spec';
    const status = message.includes('API key') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function generateSpecMarkdown(spec: any, featureName: string): string {
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
