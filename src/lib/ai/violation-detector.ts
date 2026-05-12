import * as fs from 'fs/promises';
import * as path from 'path';
import { isPathSafe } from '../path-utils';
import type { CodeFile, CodeSource, LocalCodeSource, GitHubCodeSource } from './types';

const DEFAULT_EXCLUDE = ['node_modules', 'dist', '.next', '.git', 'coverage', '__pycache__', '.env'];
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.php', '.vue', '.svelte', '.css', '.scss', '.html', '.sql', '.prisma'];
const MAX_FILE_SIZE = 100_000;
const MAX_FILES = 50;

export async function readLocalCode(source: LocalCodeSource): Promise<CodeFile[]> {
  const pathCheck = isPathSafe(source.path);
  if (!pathCheck.safe) {
    throw new Error(`Path "${source.path}" is not allowed`);
  }

  const exclude = source.exclude || DEFAULT_EXCLUDE;
  const files: CodeFile[] = [];

  async function walk(dir: string) {
    if (files.length >= MAX_FILES) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(source.path, fullPath);

      if (exclude.some(e => relativePath.includes(e))) continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!CODE_EXTENSIONS.includes(ext)) continue;
        if (source.include?.length && !source.include.some(p => relativePath.includes(p))) continue;

        const stat = await fs.stat(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;

        const content = await fs.readFile(fullPath, 'utf-8');
        files.push({ path: relativePath, content });
      }
    }
  }

  await walk(source.path);
  return files;
}

export async function readGitHubCode(source: GitHubCodeSource): Promise<CodeFile[]> {
  const { owner, repo, branch = 'main', path: subPath, token } = source;
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    const err = await treeRes.text();
    throw new Error(`GitHub API error (${treeRes.status}): ${err}`);
  }

  const tree = await treeRes.json() as { tree: { path: string; type: string; size?: number }[] };
  const exclude = DEFAULT_EXCLUDE;

  const candidates = tree.tree.filter(f => {
    if (f.type !== 'blob') return false;
    if (subPath && !f.path.startsWith(subPath)) return false;
    if (exclude.some(e => f.path.includes(e))) return false;
    const ext = path.extname(f.path).toLowerCase();
    if (!CODE_EXTENSIONS.includes(ext)) return false;
    if (f.size && f.size > MAX_FILE_SIZE) return false;
    return true;
  }).slice(0, MAX_FILES);

  const files: CodeFile[] = [];
  for (const candidate of candidates) {
    const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${candidate.path}?ref=${branch}`;
    const contentRes = await fetch(contentUrl, { headers });
    if (!contentRes.ok) continue;

    const data = await contentRes.json() as { content?: string; encoding?: string };
    if (data.content && data.encoding === 'base64') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      files.push({ path: candidate.path, content });
    }
  }

  return files;
}

export async function readCode(source: CodeSource): Promise<CodeFile[]> {
  if (source.type === 'local') return readLocalCode(source);
  return readGitHubCode(source);
}
