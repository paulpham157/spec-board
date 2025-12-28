'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FeatureDetail } from '@/components/feature-detail';
import { ArrowLeft } from 'lucide-react';
import type { Project, Feature } from '@/types';

export default function FeaturePage() {
  const params = useParams();
  const router = useRouter();
  const projectName = params.name as string;
  const featureId = params.featureId as string;

  const [feature, setFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);

  const loadFeature = useCallback(async () => {
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

      // Find the specific feature
      const foundFeature = data.features.find(f => f.id === featureId);
      if (!foundFeature) {
        throw new Error(`Feature "${featureId}" not found`);
      }
      setFeature(foundFeature);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectName, featureId]);

  // Load feature on mount
  useEffect(() => {
    loadFeature();
  }, [loadFeature]);

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
          const updatedFeature = message.data.features.find(
            (f: Feature) => f.id === featureId
          );
          if (updatedFeature) {
            setFeature(updatedFeature);
          }
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
  }, [projectPath, featureId]);

  const handleClose = () => {
    router.push(`/projects/${projectName}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading feature...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push(`/projects/${projectName}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--secondary)]/80 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  if (!feature) {
    return null;
  }

  // Render the feature detail as a full page (not modal)
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <FeatureDetail
        feature={feature}
        onClose={handleClose}
      />
    </div>
  );
}
