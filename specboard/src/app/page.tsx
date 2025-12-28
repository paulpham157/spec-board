'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectSelector } from '@/components/project-selector';
import { FolderOpen, Plus, Trash2, ExternalLink } from 'lucide-react';

interface RegisteredProject {
  id: string;
  name: string;
  displayName: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const router = useRouter();
  const [registeredProjects, setRegisteredProjects] = useState<RegisteredProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects', { cache: 'no-store' });
      if (response.ok) {
        const projects = await response.json();
        setRegisteredProjects(projects);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handlePathSelect = (path: string) => {
    setSelectedPath(path);
    // Auto-generate slug from path
    const pathParts = path.split('/');
    const folderName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    const slug = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setProjectName(slug);
    setDisplayName(folderName);
    setShowRegisterForm(true);
  };

  const handleRegister = async () => {
    if (!selectedPath || !projectName || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          displayName,
          filePath: selectedPath,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register project');
      }

      // Navigate to the new project
      router.push(`/projects/${projectName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return;

    try {
      const response = await fetch(`/api/projects/${name}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadProjects();
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const cancelRegistration = () => {
    setShowRegisterForm(false);
    setSelectedPath(null);
    setProjectName('');
    setDisplayName('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">SpecBoard</h1>
          <p className="text-[var(--muted-foreground)]">
            Visual dashboard for spec-kit task management
          </p>
        </div>

        {/* Registered Projects */}
        {!showRegisterForm && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
            {isLoading ? (
              <div className="text-[var(--muted-foreground)] text-center py-8">
                Loading projects...
              </div>
            ) : registeredProjects.length === 0 ? (
              <div className="text-[var(--muted-foreground)] text-center py-8 border-2 border-dashed border-[var(--border)] rounded-lg">
                <p className="mb-2">No projects registered yet</p>
                <p className="text-sm">Select a folder below to register your first project</p>
              </div>
            ) : (
              <div className="space-y-2">
                {registeredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
                  >
                    <button
                      onClick={() => router.push(`/projects/${project.name}`)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <FolderOpen className="w-5 h-5 text-[var(--muted-foreground)]" />
                      <div>
                        <div className="font-medium">{project.displayName}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          /{project.name}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/projects/${project.name}`)}
                        className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                        title="Open project"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.name)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Remove project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registration Form */}
        {showRegisterForm && selectedPath && (
          <div className="mb-8 p-6 bg-[var(--card)] border border-[var(--border)] rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Register Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Project Path
                </label>
                <div className="text-sm bg-[var(--secondary)] p-2 rounded truncate">
                  {selectedPath}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  URL Slug (lowercase, hyphens only)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full p-2 bg-[var(--secondary)] border border-[var(--border)] rounded text-sm"
                  placeholder="my-project"
                />
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  URL: /projects/{projectName || 'my-project'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2 bg-[var(--secondary)] border border-[var(--border)] rounded text-sm"
                  placeholder="My Project"
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isRegistering ? 'Registering...' : 'Register Project'}
                </button>
                <button
                  onClick={cancelRegistration}
                  className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Selector */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {showRegisterForm ? 'Select a Different Folder' : 'Add New Project'}
          </h2>
          <div className="h-[400px]">
            <ProjectSelector
              onSelect={handlePathSelect}
              recentProjects={[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
