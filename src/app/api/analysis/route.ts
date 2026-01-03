import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isPathSafe } from '@/lib/path-utils';

const MAX_CONTENT_SIZE = 1048576; // 1MB

/**
 * Generate timestamped analysis filename (T008)
 * Format: YYYY-MM-DD-HH-mm-analysis.md
 */
function generateAnalysisFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}-${minute}-analysis.md`;
}

/**
 * POST /api/analysis - Save a new analysis report (T007-T012)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featurePath, content } = body;

    // Validate featurePath (T009)
    if (!featurePath || typeof featurePath !== 'string') {
      return NextResponse.json(
        { error: 'Feature path is required' },
        { status: 400 }
      );
    }

    // Validate content (T010)
    if (content === undefined || content === null) {
      return NextResponse.json(
        { error: 'Analysis content is required' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Analysis content cannot be empty' },
        { status: 400 }
      );
    }

    // Check content size
    const contentSize = Buffer.byteLength(content, 'utf-8');
    if (contentSize > MAX_CONTENT_SIZE) {
      return NextResponse.json(
        { error: 'Analysis content exceeds maximum size (1MB)' },
        { status: 400 }
      );
    }

    // Validate path safety (T009)
    const { safe, resolvedPath } = isPathSafe(featurePath);
    if (!safe) {
      return NextResponse.json(
        { error: 'Access denied: Path is outside allowed directories' },
        { status: 403 }
      );
    }

    // Check feature directory exists
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
      return NextResponse.json(
        { error: 'Feature directory not found' },
        { status: 404 }
      );
    }

    // Create analysis directory if not exists (T011)
    const analysisDir = path.join(resolvedPath, 'analysis');
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }

    // Generate filename and write file (T012)
    const filename = generateAnalysisFilename();
    const filePath = path.join(analysisDir, filename);

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (writeError) {
      console.error('Failed to write analysis file:', writeError);
      return NextResponse.json(
        { error: `Failed to save analysis: ${writeError instanceof Error ? writeError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        filename,
        path: filePath,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analysis - Delete an analysis report (T027-T029)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    // Validate path parameter (T028)
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Validate path safety (T028)
    const { safe, resolvedPath } = isPathSafe(filePath);
    if (!safe) {
      return NextResponse.json(
        { error: 'Access denied: Path is outside allowed directories' },
        { status: 403 }
      );
    }

    // Check file exists (T029)
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: 'Analysis file not found' },
        { status: 404 }
      );
    }

    // Verify it's an analysis file (security check)
    const filename = path.basename(resolvedPath);
    if (!filename.endsWith('-analysis.md') && filename !== 'analysis.md') {
      return NextResponse.json(
        { error: 'Invalid analysis file' },
        { status: 400 }
      );
    }

    // Delete file (T029)
    try {
      fs.unlinkSync(resolvedPath);
    } catch (deleteError) {
      console.error('Failed to delete analysis file:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete analysis: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: resolvedPath,
    });
  } catch (error) {
    console.error('Error in DELETE /api/analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
