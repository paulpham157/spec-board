import { create } from 'zustand';
import type { Project, Feature, FeatureStage } from '@/types';

// Recent project with full metadata for the new UI
export interface RecentProject {
  path: string;
  name: string;
  slug?: string; // URL-safe slug for routing (from database)
  lastOpened: string; // ISO date string
  summary: string | null; // From constitution.md or README
  featureCount: number;
  completionPercentage: number;
  stageBreakdown: Record<FeatureStage, number>;
}

interface ProjectStore {
  // State
  project: Project | null;
  selectedFeature: Feature | null;
  isLoading: boolean;
  error: string | null;
  projectPath: string | null;
  recentProjects: RecentProject[];

  // Actions
  setProject: (project: Project | null) => void;
  setSelectedFeature: (feature: Feature | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectPath: (path: string | null) => void;
  addRecentProject: (project: Project, slug?: string) => void;
  loadRecentProjects: () => void;
}

const RECENT_PROJECTS_KEY = 'specboard-recent-projects';

function loadRecentProjectsFromStorage(): RecentProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentProjectsToStorage(projects: RecentProject[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
}

// Extract summary from constitution or first feature's spec
function extractSummary(project: Project): string | null {
  if (project.constitution?.rawContent) {
    // Get first non-empty line after title
    const lines = project.constitution.rawContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        return trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : '');
      }
    }
  }
  return null;
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

  addRecentProject: (project: Project, slug?: string) => {
    const { recentProjects } = get();

    // Calculate stage breakdown
    const stageBreakdown: Record<FeatureStage, number> = {
      specify: 0,
      plan: 0,
      tasks: 0,
      implement: 0,
      complete: 0,
    };

    let totalTasks = 0;
    let completedTasks = 0;

    for (const feature of project.features) {
      stageBreakdown[feature.stage]++;
      totalTasks += feature.totalTasks;
      completedTasks += feature.completedTasks;
    }

    const newRecentProject: RecentProject = {
      path: project.path,
      name: project.name,
      slug, // Store the database slug for URL routing
      lastOpened: new Date().toISOString(),
      summary: extractSummary(project),
      featureCount: project.features.length,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      stageBreakdown,
    };

    // Remove existing entry for this path and add new one at the front
    const filtered = recentProjects.filter((p) => p.path !== project.path);
    const updated = [newRecentProject, ...filtered].slice(0, 10);
    saveRecentProjectsToStorage(updated);
    set({ recentProjects: updated });
  },

  loadRecentProjects: () => {
    const projects = loadRecentProjectsFromStorage();
    set({ recentProjects: projects });
  },
}));
