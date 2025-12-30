import { NextRequest, NextResponse } from 'next/server';
import { parseProject } from '@/lib/parser';
import { isPathSafe } from '@/lib/path-utils';

// Disable Next.js route caching - always read fresh data from filesystem
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectPath = searchParams.get('path');

  if (!projectPath) {
    return NextResponse.json(
      { error: 'Project path is required' },
      { status: 400 }
    );
  }

  // Validate path is safe to access (prevent path traversal attacks)
  const { safe, resolvedPath } = isPathSafe(projectPath);
  if (!safe) {
    return NextResponse.json(
      { error: 'Access denied: Path is outside allowed directories' },
      { status: 403 }
    );
  }

  try {
    const project = await parseProject(resolvedPath);

    if (!project) {
      return NextResponse.json(
        { error: 'Failed to parse project' },
        { status: 500 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error loading project:', error);
    return NextResponse.json(
      { error: 'Failed to load project' },
      { status: 500 }
    );
  }
}
