import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isPathSafe } from '@/lib/path-utils';
import {
  isValidCheckboxLine,
  getCheckboxState,
  toggleCheckboxInContent,
} from '@/lib/checklist-utils';
import type { ChecklistToggleResponse } from '@/types';

/**
 * PATCH /api/checklist - Toggle a checklist item
 *
 * Request body:
 * - filePath: Absolute path to checklist markdown file
 * - lineIndex: 0-based line number to toggle
 * - expectedState: Current state for conflict detection
 *
 * Response:
 * - success: Whether the operation succeeded
 * - newState: New checked state (if success)
 * - content: Updated file content (if success)
 * - error: Error code (if failure)
 * - message: Human-readable error message
 * - currentState: Actual state (if conflict)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, lineIndex, expectedState } = body;

    // Validate filePath
    if (!filePath || typeof filePath !== 'string') {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_path',
        message: 'File path is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate lineIndex
    if (typeof lineIndex !== 'number' || lineIndex < 0) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_line',
        message: 'Line index must be a non-negative number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate expectedState
    if (typeof expectedState !== 'boolean') {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_line',
        message: 'Expected state must be a boolean',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate path safety
    const { safe, resolvedPath } = isPathSafe(filePath);
    if (!safe) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_path',
        message: 'Access denied: Path is outside allowed directories',
      };
      return NextResponse.json(response, { status: 403 });
    }

    // Check file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'file_not_found',
        message: 'Checklist file not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Verify it's a markdown file in a checklists directory (security check)
    // Use path utilities for cross-platform compatibility
    const isMarkdownFile = path.extname(resolvedPath).toLowerCase() === '.md';
    const pathParts = resolvedPath.split(path.sep);
    const isInChecklistsDir = pathParts.includes('checklists');

    if (!isMarkdownFile || !isInChecklistsDir) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_path',
        message: 'Invalid checklist file path',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Read file content
    let content: string;
    try {
      content = await fs.readFile(resolvedPath, 'utf-8');
    } catch (readError) {
      console.error('Failed to read checklist file:', readError);
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'file_not_found',
        message: 'Failed to read checklist file',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Validate line index and get current state
    const lines = content.split('\n');
    if (lineIndex >= lines.length) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_line',
        message: `Line index ${lineIndex} is out of bounds`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const line = lines[lineIndex];
    if (!isValidCheckboxLine(line)) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_line',
        message: `Line ${lineIndex} is not a valid checkbox line`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check for conflict (optimistic concurrency)
    const currentState = getCheckboxState(line);
    if (currentState !== expectedState) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'conflict',
        message: 'File has been modified. Please refresh and try again.',
        currentState: currentState ?? undefined,
      };
      return NextResponse.json(response, { status: 409 });
    }

    // Toggle the checkbox
    const result = toggleCheckboxInContent(content, lineIndex);
    if (!result.success) {
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'invalid_line',
        message: result.error || 'Failed to toggle checkbox',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Write file
    try {
      await fs.writeFile(resolvedPath, result.content, 'utf-8');
    } catch (writeError) {
      console.error('Failed to write checklist file:', writeError);
      const response: ChecklistToggleResponse = {
        success: false,
        error: 'write_failed',
        message: `Failed to save checklist: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ChecklistToggleResponse = {
      success: true,
      newState: result.newState ?? undefined,
      content: result.content,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PATCH /api/checklist:', error);
    const response: ChecklistToggleResponse = {
      success: false,
      error: 'write_failed',
      message: 'Internal server error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
