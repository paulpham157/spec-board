import { create } from 'zustand';
import type { Project, Feature, DashboardMetrics, FeatureStage } from '@/types';

interface ProjectStore {
  // State
  project: Project | null;
  selectedFeature: Feature | null;
  isLoading: boolean;
  error: string | null;
  projectPath: string | null;
  recentProjects: string[];

  // Actions
  setProject: (project: Project | null) => void;
  setSelectedFeature: (feature: Feature | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectPath: (path: string | null) => void;
  addRecentProject: (path: string) => void;
  getMetrics: () => DashboardMetrics;
}

const RECENT_PROJECTS_KEY = 'specboard-recent-projects';

function loadRecentProjects(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentProjects(projects: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  selectedFeature: null,
  isLoading: false,
  error: null,
  projectPath: null,
  recentProjects: [],

  setProject: (project) => set({ project, error: null }),

  setSelectedFeature: (feature) => set({ selectedFeature: feature }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setProjectPath: (projectPath) => set({ projectPath }),

  addRecentProject: (path) => {
    const { recentProjects } = get();
    const filtered = recentProjects.filter((p) => p !== path);
    const updated = [path, ...filtered].slice(0, 10);
    saveRecentProjects(updated);
    set({ recentProjects: updated });
  },

  getMetrics: (): DashboardMetrics => {
    const { project } = get();
    if (!project) {
      return {
        totalFeatures: 0,
        featuresByStage: { specify: 0, plan: 0, tasks: 0, implement: 0, complete: 0 },
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        completionPercentage: 0,
        tasksByPhase: {},
        totalClarifications: 0,
        clarificationsByFeature: {},
      };
    }

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
  },
}));
