import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isPrismaError } from '@/lib/utils';
import { isValidDirectoryPath } from '@/lib/path-utils';

// Disable Next.js route caching - always read fresh data from database
export const dynamic = 'force-dynamic';

// GET /api/projects/[name] - Get a project by name
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const project = await prisma.project.findUnique({
      where: { name },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[name] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { displayName, filePath } = body;

    // Validate filePath if provided
    if (filePath && !isValidDirectoryPath(filePath)) {
      return NextResponse.json(
        { error: 'Invalid file path: directory does not exist' },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { name },
      data: {
        ...(displayName && { displayName }),
        ...(filePath && { filePath }),
      },
    });

    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error('Error updating project:', error);

    if (isPrismaError(error, 'P2025')) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[name] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    await prisma.project.delete({
      where: { name },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting project:', error);

    if (isPrismaError(error, 'P2025')) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
