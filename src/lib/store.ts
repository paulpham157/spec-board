import { create } from 'zustand';
import type { Project, Feature, FeatureStage, FocusState } from '@/types';

// Active feature status for dynamic project description
export interface ActiveFeatureStatus {
  stage: FeatureStage;
  featureName: string;
}

// Recent project with full metadata for the new UI
export interface RecentProject {
  path: string;
  name: string;
  slug?: string; // URL-safe slug for routing (from database)
  lastOpened: string; // ISO date string
  summary: string | null; // From constitution.md or README (cleaned)
  activeFeature: ActiveFeatureStatus | null; // Current focus feature
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
  // Keyboard navigation focus state (FR-008)
  focusState: FocusState;

  // Actions
  setProject: (project: Project | null) => void;
  setSelectedFeature: (feature: Feature | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectPath: (path: string | null) => void;
  addRecentProject: (project: Project, slug?: string) => void;
  loadRecentProjects: () => void;
  // Focus state actions
  setFocusState: (state: Partial<FocusState>) => void;
  clearFocusState: () => void;
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

// Check if a line is meaningful content (not markdown artifacts)
function isMeaningfulLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Skip headings
  if (trimmed.startsWith('#')) return false;

  // Skip HTML comments (<!-- ... -->)
  if (trimmed.startsWith('<!--') || trimmed.startsWith('-->')) return false;
  if (trimmed.includes('<!--') && !trimmed.includes('-->')) return false;

  // Skip frontmatter markers
  if (trimmed === '---') return false;

  // Skip code fence markers
  if (trimmed.startsWith('```')) return false;

  // Skip horizontal rules
  if (/^[-*_]{3,}$/.test(trimmed)) return false;

  // Skip lines that are just markdown syntax
  if (/^[>\-*+\d.]+$/.test(trimmed)) return false;

  // Must have at least some alphabetic content
  if (!/[a-zA-Z]{3,}/.test(trimmed)) return false;

  return true;
}

// Extract summary from constitution (with proper filtering)
function extractSummary(project: Project): string | null {
  if (project.constitution?.rawContent) {
    const lines = project.constitution.rawContent.split('\n');
    let inComment = false;
    let inFrontmatter = false;
    let frontmatterCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track frontmatter (between --- markers)
      if (trimmed === '---') {
        frontmatterCount++;
        inFrontmatter = frontmatterCount === 1;
        if (frontmatterCount === 2) inFrontmatter = false;
        continue;
      }
      if (inFrontmatter) continue;

      // Track multi-line HTML comments
      if (trimmed.includes('<!--') && !trimmed.includes('-->')) {
        inComment = true;
        continue;
      }
      if (inComment) {
        if (trimmed.includes('-->')) inComment = false;
        continue;
      }

      // Check if this is meaningful content
      if (isMeaningfulLine(trimmed)) {
        // Clean up the line (remove leading list markers, etc.)
        const cleaned = trimmed
          .replace(/^[>\-*+]\s*/, '')  // Remove blockquote/list markers
          .replace(/^\d+\.\s*/, '')     // Remove numbered list markers
          .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
          .replace(/\*([^*]+)\*/g, '$1')      // Remove italic
          .trim();

        if (cleaned.length > 10) {
          return cleaned.slice(0, 100) + (cleaned.length > 100 ? '...' : '');
        }
      }
    }
  }
  return null;
}

// Get the most relevant active feature (prioritize implement > tasks > plan > specify)
function getActiveFeature(project: Project): ActiveFeatureStatus | null {
  const stagePriority: FeatureStage[] = ['implement', 'tasks', 'plan', 'specify'];

  for (const stage of stagePriority) {
    const feature = project.features.find(f => f.stage === stage);
    if (feature) {
      return {
        stage: feature.stage,
        featureName: feature.name,
      };
    }
  }

  // All complete
  if (project.features.length > 0 && project.features.every(f => f.stage === 'complete')) {
    return {
      stage: 'complete',
      featureName: `${project.features.length} feature${project.features.length > 1 ? 's' : ''}`,
    };
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
  // Initial focus state (no focus)
  focusState: {
    column: null,
    cardIndex: null,
    featureId: null,
  },

  setProject: (project) => set({ project, error: null }),

  setSelectedFeature: (feature) => set({ selectedFeature: feature }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setProjectPath: (projectPath) => set({ projectPath }),

  // Focus state actions (FR-008)
  setFocusState: (state) =>
    set((prev) => ({
      focusState: { ...prev.focusState, ...state },
    })),

  clearFocusState: () =>
    set({
      focusState: {
        column: null,
        cardIndex: null,
        featureId: null,
      },
    }),

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
      activeFeature: getActiveFeature(project),
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
