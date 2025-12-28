/**
 * Server-side path utilities for filesystem operations.
 * These functions use Node.js APIs and should only be imported in server-side code.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface PathSafetyResult {
  safe: boolean;
  resolvedPath: string;
}

/**
 * Validates that a path is safe to browse.
 * Prevents path traversal attacks by ensuring the resolved path
 * is within allowed directories (user home, /Users, /home).
 *
 * @param requestedPath - The path to validate
 * @returns Object with safety status and resolved absolute path
 */
export function isPathSafe(requestedPath: string): PathSafetyResult {
  const homeDir = os.homedir();

  // Resolve to absolute path (handles .., symlinks, etc.)
  const resolvedPath = path.resolve(requestedPath);

  // Allow browsing within home directory and common project locations
  const allowedRoots = [
    homeDir,
    '/Users', // macOS user directories
    '/home',  // Linux user directories
  ];

  const safe = allowedRoots.some(root => resolvedPath.startsWith(root));

  return { safe, resolvedPath };
}

/**
 * Checks if a directory is a spec-kit project.
 * A spec-kit project has either a `specs/` or `.specify/` directory.
 *
 * @param dirPath - The directory path to check
 * @returns True if the directory is a spec-kit project
 */
export function isSpecKitProject(dirPath: string): boolean {
  const specsDir = path.join(dirPath, 'specs');
  const specifyDir = path.join(dirPath, '.specify');
  return fs.existsSync(specsDir) || fs.existsSync(specifyDir);
}

/**
 * Validates that a file path exists and is a directory.
 *
 * @param filePath - The path to validate
 * @returns True if the path exists and is a directory
 */
export function isValidDirectoryPath(filePath: string): boolean {
  try {
    const resolvedPath = path.resolve(filePath);
    return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Normalizes a path, expanding ~ to the user's home directory.
 *
 * @param inputPath - The path to normalize
 * @returns The normalized absolute path
 */
export function normalizePath(inputPath: string): string {
  if (inputPath === '~') {
    return os.homedir();
  }
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}
