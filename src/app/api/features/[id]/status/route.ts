import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/features/[id]/status
 * Update feature stage (for Kanban drag-and-drop)
 * Note: status field was removed - now using stage only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stage } = body;

    if (!stage) {
      return NextResponse.json({ error: 'Stage is required' }, { status: 400 });
    }

    // Validate stage (now replaces status)
    const validStages = ['backlog', 'specs', 'plan', 'tasks'];
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    const feature = await prisma.feature.update({
      where: { id },
      data: { stage },
      include: {
        userStories: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error updating feature stage:', error);
    return NextResponse.json({ error: 'Failed to update feature stage' }, { status: 500 });
  }
}
