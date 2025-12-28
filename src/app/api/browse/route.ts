import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { isPathSafe, isSpecKitProject, normalizePath } from '@/lib/path-utils';

// Disable Next.js route caching - always read fresh data from filesystem
export const dynamic = 'force-dynamic';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSpecKitProject: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let dirPath = searchParams.get('path') || os.homedir();

  // Normalize path (expand ~ to home directory)
  dirPath = normalizePath(dirPath);

  // Validate path is safe to browse
  const { safe, resolvedPath } = isPathSafe(dirPath);
  if (!safe) {
    return NextResponse.json(
      { error: 'Access denied: Path is outside allowed directories' },
      { status: 403 }
    );
  }
  dirPath = resolvedPath;

  try {
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json(
        { error: 'Directory does not exist' },
        { status: 404 }
      );
    }

    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const directories: DirectoryEntry[] = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          isSpecKitProject: isSpecKitProject(fullPath),
        };
      })
      .sort((a, b) => {
        // Sort spec-kit projects first, then alphabetically
        if (a.isSpecKitProject && !b.isSpecKitProject) return -1;
        if (!a.isSpecKitProject && b.isSpecKitProject) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      currentPath: dirPath,
      parentPath: path.dirname(dirPath),
      entries: directories,
      isSpecKitProject: isSpecKitProject(dirPath),
    });
  } catch (error) {
    console.error('Error browsing directory:', error);
    return NextResponse.json(
      { error: 'Failed to browse directory' },
      { status: 500 }
    );
  }
}
