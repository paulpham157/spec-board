import { NextRequest, NextResponse } from 'next/server';
import { watch } from 'chokidar';
import { parseProject } from '@/lib/parser';
import { isPathSafe } from '@/lib/path-utils';

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

  // Validate path is safe to watch (prevent path traversal attacks)
  const { safe, resolvedPath } = isPathSafe(projectPath);
  if (!safe) {
    return NextResponse.json(
      { error: 'Access denied: Path is outside allowed directories' },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const project = await parseProject(resolvedPath);
      if (project) {
        const data = `data: ${JSON.stringify({ type: 'update', data: project })}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Watch for file changes
      // Using polling to reliably detect changes from all sources (IDE, AI tools, scripts)
      // fs.watch (event-based) can miss in-place file writes on some platforms
      const watcher = watch(resolvedPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 3,
        usePolling: true,  // Enable polling for reliable detection
        interval: 300,     // Poll every 300ms (matches debounce timing)
      });

      const handleChange = async () => {
        try {
          const updatedProject = await parseProject(resolvedPath);
          if (updatedProject) {
            const data = `data: ${JSON.stringify({ type: 'update', data: updatedProject })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error('Error parsing project on change:', error);
        }
      };

      // Debounce changes
      let timeout: NodeJS.Timeout | null = null;
      const debouncedChange = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(handleChange, 300);
      };

      watcher.on('change', debouncedChange);
      watcher.on('add', debouncedChange);
      watcher.on('unlink', debouncedChange);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        watcher.close();
        if (timeout) clearTimeout(timeout);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
