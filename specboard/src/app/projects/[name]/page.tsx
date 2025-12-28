'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban-board';
import { DashboardMetricsPanel } from '@/components/dashboard-metrics';
import { FeatureDetail } from '@/components/feature-detail';
import { ConstitutionPanel } from '@/components/constitution-panel';
import { ClarityHistoryPanel } from '@/components/clarity-history';
import { FolderOpen, RefreshCw, Wifi, Home, Link as LinkIcon } from 'lucide-react';
import type { Project, Feature, DashboardMetrics, FeatureStage } from '@/types';

function calculateMetrics(project: Project): DashboardMetrics {
  const featuresByStage: Record<FeatureStage, number> = {
    specify: 0,
    plan: 0,
    tasks: 0,
    implement: 0,
    complete: 0,
  };

  let totalTasks = 0;
  let completedTasks = 0;
  let totalClarifications = 0;
  const tasksByPhase: Record<string, number> = {};
  const clarificationsByFeature: Record<string, number> = {};

  for (const feature of project.features) {
    featuresByStage[feature.stage]++;
    totalTasks += feature.totalTasks;
    completedTasks += feature.completedTasks;
    totalClarifications += feature.totalClarifications;
    clarificationsByFeature[feature.id] = feature.totalClarifications;

    for (const phase of feature.phases) {
      const phaseName = phase.name.split('(')[0].trim();
      tasksByPhase[phaseName] = (tasksByPhase[phaseName] || 0) + phase.tasks.length;
    }
  }

  const pendingTasks = totalTasks - completedTasks;
  const inProgressTasks = project.features.reduce((sum, f) => sum + f.inProgressTasks, 0);

  return {
    totalFeatures: project.features.length,
    featuresByStage,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    tasksByPhase,
    totalClarifications,
    clarificationsByFeature,
  };
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectName = params.name as string;

  const [project, setProject] = useState<Project | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First, get the project path from the database
      const projectRes = await fetch(`/api/projects/${projectName}`, { cache: 'no-store' });
      if (!projectRes.ok) {
        if (projectRes.status === 404) {
          throw new Error(`Project "${projectName}" not found`);
        }
        throw new Error('Failed to load project');
      }
      const projectData = await projectRes.json();
      setProjectPath(projectData.filePath);

      // Then load the actual project data
      const response = await fetch(`/api/project?path=${encodeURIComponent(projectData.filePath)}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load project files');
      }
      const data: Project = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectName]);

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Set up SSE for real-time updates
  useEffect(() => {
    if (!projectPath) return;

    const eventSource = new EventSource(
      `/api/watch?path=${encodeURIComponent(projectPath)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'update' && message.data) {
          setProject(message.data);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
    };

    return () => {
      eventSource.close();
    };
  }, [projectPath]);

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    // Update URL without full navigation
    window.history.pushState({}, '', `/projects/${projectName}/features/${feature.id}`);
  };

  const handleCloseFeature = () => {
    setSelectedFeature(null);
    window.history.pushState({}, '', `/projects/${projectName}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metrics = project ? calculateMetrics(project) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading project...</div>
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

  if (!project || !metrics) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="Home"
              >
                <Home className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold">SpecBoard</h1>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <FolderOpen className="w-4 h-4" />
                <span>{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1 text-sm px-3 py-1.5 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="Copy link"
              >
                <LinkIcon className="w-3 h-3" />
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={loadProject}
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Dashboard metrics */}
          <DashboardMetricsPanel metrics={metrics} />

          {/* Constitution and Clarity History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ConstitutionPanel
              constitution={project.constitution}
              hasConstitution={project.hasConstitution}
            />
            <ClarityHistoryPanel
              features={project.features}
              totalClarifications={metrics.totalClarifications}
            />
          </div>

          {/* Kanban board */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Feature Pipeline</h2>
            <KanbanBoard
              features={project.features}
              onFeatureClick={handleFeatureClick}
            />
          </div>
        </div>
      </main>

      {/* Feature detail modal */}
      {selectedFeature && (
        <FeatureDetail
          feature={selectedFeature}
          onClose={handleCloseFeature}
        />
      )}
    </div>
  );
}
