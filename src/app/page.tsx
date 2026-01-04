'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Github } from 'lucide-react';
import Image from 'next/image';
import { useProjectStore, type RecentProject } from '@/lib/store';
import { RecentProjectsList } from '@/components/recent-projects-list';
import { OpenProjectModal } from '@/components/open-project-modal';
import type { Project } from '@/types';

// Database project type returned from registration API
interface DbProject {
  id: string;
  name: string; // This is the slug used in URLs
  displayName: string;
  filePath: string;
}

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { recentProjects, loadRecentProjects, addRecentProject } = useProjectStore();

  // Load recent projects from localStorage on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  // Register project in database and get slug for URL
  const registerProject = useCallback(async (filePath: string): Promise<DbProject | null> => {
    try {
      const response = await fetch('/api/projects/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      if (response.ok) {
        return await response.json();
      }
      console.error('Failed to register project:', await response.text());
      return null;
    } catch (error) {
      console.error('Error registering project:', error);
      return null;
    }
  }, []);

  // Handle opening a project from the modal
  const handleOpenProject = useCallback(async (project: Project) => {
    // Register project to get slug
    const dbProject = await registerProject(project.path);
    if (dbProject) {
      addRecentProject(project, dbProject.name);
      router.push(`/projects/${dbProject.name}`);
    } else {
      // Fallback to path-based URL if registration fails
      addRecentProject(project);
      router.push(`/projects/${encodeURIComponent(project.path)}`);
    }
  }, [addRecentProject, registerProject, router]);

  // Handle selecting a recent project
  const handleSelectRecent = useCallback(async (recentProject: RecentProject) => {
    // If we have a slug, use it directly
    if (recentProject.slug) {
      router.push(`/projects/${recentProject.slug}`);
      return;
    }

    // Otherwise, register to get slug
    const dbProject = await registerProject(recentProject.path);
    if (dbProject) {
      // Update recent project with slug
      const { recentProjects } = useProjectStore.getState();
      const updated = recentProjects.map(p =>
        p.path === recentProject.path ? { ...p, slug: dbProject.name } : p
      );
      localStorage.setItem('specboard-recent-projects', JSON.stringify(updated));
      useProjectStore.setState({ recentProjects: updated });
      router.push(`/projects/${dbProject.name}`);
    } else {
      // Fallback to path-based URL
      router.push(`/projects/${encodeURIComponent(recentProject.path)}`);
    }
  }, [registerProject, router]);

  // Handle removing a recent project
  const handleRemoveRecent = useCallback((path: string) => {
    const { recentProjects } = useProjectStore.getState();
    const filtered = recentProjects.filter(p => p.path !== path);
    // Update localStorage directly
    localStorage.setItem('specboard-recent-projects', JSON.stringify(filtered));
    useProjectStore.setState({ recentProjects: filtered });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/specboard-logo.svg"
                alt="SpecBoard Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <div>
                <h1 className="text-xl font-bold">
                  <span className="text-blue-500">Spec</span>
                  <span>Board</span>
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Visual dashboard for spec-kit projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/paulpham157/spec-board"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Split view */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left side - Recent Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <span className="text-sm text-[var(--muted-foreground)]">
                {recentProjects.length} project{recentProjects.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="min-h-[400px]">
              <RecentProjectsList
                projects={recentProjects}
                onSelect={handleSelectRecent}
                onRemove={handleRemoveRecent}
              />
            </div>
          </div>

          {/* Right side - Open Project */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)]"
              >
                <Plus className="w-5 h-5" />
                Open Project
              </button>
              <p className="text-xs text-[var(--muted-foreground)] text-center">
                Browse or search for a spec-kit project folder
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Open Project Modal */}
      <OpenProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpen={handleOpenProject}
      />
    </div>
  );
}
