'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { KanbanSkeleton } from '@/components/skeleton';
import type { Project, Feature } from '@/types';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';
import { ProjectInfoBubble } from '@/components/project-info-panel';
import { FeatureList } from '@/components/feature-list';

export default function ProjectView() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  const setProjectStore = useProjectStore(state => state.setProject);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingConstitution, setIsGeneratingConstitution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('/api/project/' + projectSlug + '/data?view=kanban', {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project "' + projectSlug + '" not found. Please open it from the home page first.');
        }
        throw new Error('Failed to load project');
      }
      const data: Project & { projectId?: string } = await response.json();
      setProject(data);
      setProjectStore(data);

      if (data.projectId) {
        setProjectId(data.projectId);
      }
      if (data.path) {
        setProjectPath(data.path);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. The server may be unavailable.');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [projectSlug]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleFeatureClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id);
  };

  const handleFeatureClarificationsClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id + '?section=clarifications');
  };

  const handleProjectNameChange = useCallback(async (newName: string) => {
    try {
      const response = await fetch('/api/project/' + projectSlug, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName }),
      });
      if (response.ok) {
        setProject(prev => prev ? { ...prev, name: newName } : null);
      }
    } catch (error) {
      console.error('Failed to update project name:', error);
    }
  }, [projectSlug]);

  const handleDescriptionChange = useCallback(async (description: string) => {
    try {
      const response = await fetch('/api/project/' + projectSlug, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (response.ok) {
        setProject(prev => prev ? { ...prev, description } : null);
      }
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  }, [projectSlug]);

  const handleSaveAndGenerateConstitution = useCallback(async (description: string) => {
    if (!projectId) {
      toast.error('Project ID not available');
      return;
    }

    setIsGeneratingConstitution(true);
    try {
      const response = await fetch('/api/spec-workflow/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: project?.name || projectSlug,
          description,
          regenerateWithAI: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error || err.message || 'Failed to generate constitution';
        toast.error(errorMessage);
        return;
      }

      const result = await response.json();

      const apiConst = result.constitution;
      const mappedConstitution = apiConst ? {
        rawContent: apiConst.content || '',
        title: apiConst.title,
        description: result.description || description,
        principles: Array.isArray(apiConst.principles) ? apiConst.principles : [],
        sections: [],
        version: apiConst.version,
        ratifiedDate: apiConst.ratifiedDate,
        lastAmendedDate: apiConst.lastAmendedDate,
        versions: [],
      } : null;

      setProject(prev => prev ? {
        ...prev,
        description: result.description || description,
        constitution: mappedConstitution,
        hasConstitution: !!mappedConstitution,
      } : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate constitution';
      toast.error(message);
    } finally {
      setIsGeneratingConstitution(false);
    }
  }, [projectId, project?.name, projectSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header variant="project" projectName="..." />
        <main className="flex-1 container mx-auto px-4 py-6">
          <KanbanSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--secondary)]/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        variant="project"
        projectName={project?.name}
        projectPath={projectPath || undefined}
        projectSlug={projectSlug}
        projectId={projectId || undefined}
        onProjectNameChange={handleProjectNameChange}
        onRefresh={loadProject}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ProjectInfoBubble
              constitution={project.constitution}
              hasConstitution={project.hasConstitution}
              description={project.description}
              features={project.features}
              totalClarifications={project.features.reduce((sum, f) => sum + f.totalClarifications, 0)}
              onDescriptionChange={handleDescriptionChange}
              onFeatureClick={handleFeatureClarificationsClick}
              onSaveAndGenerateConstitution={handleSaveAndGenerateConstitution}
              isGeneratingConstitution={isGeneratingConstitution}
            />
            {project.description && (
              <p className="text-sm text-[var(--muted-foreground)] pt-2 line-clamp-2 flex-1 min-w-0">
                {project.description}
              </p>
            )}
          </div>

          <div>
            <FeatureList
              features={project.features}
              onFeatureClick={handleFeatureClick}
              projectId={projectId || undefined}
              onRefresh={loadProject}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
