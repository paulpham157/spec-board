import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePriority, generateBatchPriority, getProvider } from '@/lib/ai';
import type { FeaturePriority } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/spec-workflow/prioritize
 * 
 * Single feature: { featureId: string }
 * Batch: { projectId: string, featureIds?: string[] }
 * 
 * Returns priority labels with reasons
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, projectId, featureIds } = body;

    // Ensure AI is configured
    await getProvider();

    // Single feature prioritization
    if (featureId && !projectId) {
      return handleSingleFeature(featureId);
    }

    // Batch prioritization
    if (projectId) {
      return handleBatchPrioritize(projectId, featureIds);
    }

    return NextResponse.json(
      { error: 'Either featureId or projectId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Prioritize] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Handle single feature prioritization
 */
async function handleSingleFeature(featureId: string) {
  // Fetch feature with project context
  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    include: {
      project: {
        include: {
          constitution: true,
          features: {
            where: { id: { not: featureId } },
            select: { name: true, description: true, priority: true }
          }
        }
      }
    }
  });

  if (!feature) {
    return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
  }

  // Generate priority using AI
  const result = await generatePriority({
    featureName: feature.name,
    featureDescription: feature.description || undefined,
    specContent: feature.specContent || undefined,
    projectDescription: feature.project.description || undefined,
    constitution: feature.project.constitution?.content || undefined,
    existingFeatures: feature.project.features.map(f => ({
      name: f.name,
      description: f.description || undefined,
      priority: f.priority || undefined
    }))
  });

  // Update feature in database
  const updated = await prisma.feature.update({
    where: { id: featureId },
    data: {
      priority: result.priority,
      priorityReason: result.reason
    }
  });

  // Also update mind map node if linked
  await prisma.mindMapNode.updateMany({
    where: {
      projectId: feature.projectId,
      metadata: { path: ['featureId'], equals: featureId }
    },
    data: { priority: result.priority }
  });

  return NextResponse.json({
    success: true,
    feature: {
      id: updated.id,
      name: updated.name,
      priority: updated.priority as FeaturePriority,
      priorityReason: updated.priorityReason,
      confidence: result.confidence
    }
  });
}

/**
 * Handle batch prioritization for all features in a project
 */
async function handleBatchPrioritize(projectId: string, featureIds?: string[]) {
  // Fetch project with features
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      constitution: true,
      features: featureIds?.length
        ? { where: { id: { in: featureIds } } }
        : true
    }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.features.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No features to prioritize',
      features: []
    });
  }

  // Generate batch priorities using AI
  const result = await generateBatchPriority({
    projectDescription: project.description || undefined,
    constitution: project.constitution?.content || undefined,
    features: project.features.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description || undefined,
      specContent: f.specContent || undefined
    }))
  });

  // Update features in database
  const updatePromises = result.features.map(async (f) => {
    // Update feature
    const updated = await prisma.feature.update({
      where: { id: f.id },
      data: {
        priority: f.priority,
        priorityReason: f.reason
      }
    });

    // Also update mind map node if linked
    await prisma.mindMapNode.updateMany({
      where: {
        projectId,
        metadata: { path: ['featureId'], equals: f.id }
      },
      data: { priority: f.priority }
    });

    return {
      id: updated.id,
      name: updated.name,
      priority: updated.priority as FeaturePriority,
      priorityReason: updated.priorityReason,
      confidence: f.confidence
    };
  });

  const updatedFeatures = await Promise.all(updatePromises);

  return NextResponse.json({
    success: true,
    message: `Prioritized ${updatedFeatures.length} features`,
    features: updatedFeatures
  });
}

/**
 * PATCH /api/spec-workflow/prioritize
 * 
 * Manually set priority for a feature
 * Body: { featureId: string, priority: 'must_have' | 'nice_to_have' | 'no_need', reason?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, priority, reason } = body;

    if (!featureId) {
      return NextResponse.json({ error: 'featureId is required' }, { status: 400 });
    }

    if (!['must_have', 'nice_to_have', 'no_need'].includes(priority)) {
      return NextResponse.json(
        { error: 'priority must be must_have, nice_to_have, or no_need' },
        { status: 400 }
      );
    }

    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const updated = await prisma.feature.update({
      where: { id: featureId },
      data: {
        priority,
        priorityReason: reason || 'Manually set by user'
      }
    });

    // Also update mind map node if linked
    await prisma.mindMapNode.updateMany({
      where: {
        projectId: feature.projectId,
        metadata: { path: ['featureId'], equals: featureId }
      },
      data: { priority }
    });

    return NextResponse.json({
      success: true,
      feature: {
        id: updated.id,
        name: updated.name,
        priority: updated.priority as FeaturePriority,
        priorityReason: updated.priorityReason
      }
    });
  } catch (error) {
    console.error('[Prioritize PATCH] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/spec-workflow/prioritize
 * 
 * Clear priority for a feature
 * Body: { featureId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId } = body;

    if (!featureId) {
      return NextResponse.json({ error: 'featureId is required' }, { status: 400 });
    }

    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const updated = await prisma.feature.update({
      where: { id: featureId },
      data: {
        priority: null,
        priorityReason: null
      }
    });

    // Also clear mind map node priority
    await prisma.mindMapNode.updateMany({
      where: {
        projectId: feature.projectId,
        metadata: { path: ['featureId'], equals: featureId }
      },
      data: { priority: null }
    });

    return NextResponse.json({
      success: true,
      feature: {
        id: updated.id,
        name: updated.name,
        priority: null,
        priorityReason: null
      }
    });
  } catch (error) {
    console.error('[Prioritize DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
