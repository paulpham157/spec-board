import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPathSafe,
  isSpecKitProject,
  isValidDirectoryPath,
  normalizePath,
} from './path-utils';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Mock fs and os modules
vi.mock('fs');
vi.mock('os');

describe('isPathSafe', () => {
  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue('/Users/testuser');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return safe=true for paths within home directory', () => {
    const result = isPathSafe('/Users/testuser/projects');
    expect(result.safe).toBe(true);
    expect(result.resolvedPath).toBe('/Users/testuser/projects');
  });

  it('should return safe=true for paths within /Users', () => {
    const result = isPathSafe('/Users/otheruser/projects');
    expect(result.safe).toBe(true);
  });

  it('should return safe=true for paths within /home', () => {
    const result = isPathSafe('/home/linuxuser/projects');
    expect(result.safe).toBe(true);
  });

  it('should return safe=false for paths outside allowed directories', () => {
    const result = isPathSafe('/etc/passwd');
    expect(result.safe).toBe(false);
  });

  it('should return safe=false for root path', () => {
    const result = isPathSafe('/');
    expect(result.safe).toBe(false);
  });

  it('should return safe=false for /var paths', () => {
    const result = isPathSafe('/var/log');
    expect(result.safe).toBe(false);
  });

  it('should resolve relative paths and check safety', () => {
    // path.resolve will convert relative to absolute based on cwd
    const result = isPathSafe('./projects');
    // The resolved path depends on cwd, but we can check it's resolved
    expect(result.resolvedPath).toBe(path.resolve('./projects'));
  });

  it('should handle path traversal attempts', () => {
    // Attempting to escape via ..
    const result = isPathSafe('/Users/testuser/../../../etc/passwd');
    expect(result.safe).toBe(false);
    expect(result.resolvedPath).toBe('/etc/passwd');
  });
});

describe('isSpecKitProject', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when specs/ directory exists', () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === '/project/specs';
    });

    expect(isSpecKitProject('/project')).toBe(true);
  });

  it('should return true when .specify/ directory exists', () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === '/project/.specify';
    });

    expect(isSpecKitProject('/project')).toBe(true);
  });

  it('should return true when both specs/ and .specify/ exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    expect(isSpecKitProject('/project')).toBe(true);
  });

  it('should return false when neither specs/ nor .specify/ exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(isSpecKitProject('/project')).toBe(false);
  });
});

describe('isValidDirectoryPath', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for existing directory', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);

    expect(isValidDirectoryPath('/some/directory')).toBe(true);
  });

  it('should return false for non-existent path', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(isValidDirectoryPath('/nonexistent')).toBe(false);
  });

  it('should return false for file (not directory)', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);

    expect(isValidDirectoryPath('/some/file.txt')).toBe(false);
  });

  it('should return false when statSync throws', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    expect(isValidDirectoryPath('/protected/path')).toBe(false);
  });
});

describe('normalizePath', () => {
  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue('/Users/testuser');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should expand ~ to home directory', () => {
    expect(normalizePath('~')).toBe('/Users/testuser');
  });

  it('should expand ~/ prefix to home directory', () => {
    expect(normalizePath('~/projects')).toBe('/Users/testuser/projects');
  });

  it('should expand ~/nested/path correctly', () => {
    expect(normalizePath('~/a/b/c')).toBe('/Users/testuser/a/b/c');
  });

  it('should return absolute paths unchanged', () => {
    expect(normalizePath('/absolute/path')).toBe('/absolute/path');
  });

  it('should return relative paths unchanged', () => {
    expect(normalizePath('./relative/path')).toBe('./relative/path');
  });

  it('should not expand ~ in middle of path', () => {
    expect(normalizePath('/some/~/path')).toBe('/some/~/path');
  });
});
