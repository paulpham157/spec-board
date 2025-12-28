import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isPrismaError } from '@/lib/utils';

// Disable Next.js route caching - always read fresh data from database
export const dynamic = 'force-dynamic';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, filePath } = body;

    if (!name || !displayName || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, filePath' },
        { status: 400 }
      );
    }

    // Validate name format (URL-safe slug)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(name)) {
      return NextResponse.json(
        { error: 'Name must be a URL-safe slug (lowercase letters, numbers, hyphens)' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        displayName,
        filePath,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating project:', error);

    // Handle unique constraint violation
    if (isPrismaError(error, 'P2002')) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
