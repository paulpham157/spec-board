import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type {
  Feature,
  Task,
  TaskPhase,
  FeatureStage,
  Project,
  Constitution,
  ConstitutionPrinciple,
  ConstitutionSection,
  ClarificationSession,
  Clarification,
  UserStory,
  TechnicalContext,
  TaskGroup,
  SpecKitFile,
  SpecKitFileType,
  FeatureAnalysis,
  AnalysisData
} from '@/types';

/**
 * Parse a task line from tasks.md
 * Format: - [ ] T001 [P] [US1] Description with file path
 * or: - [x] T001 [P] [US1] Description with file path
 */
export function parseTaskLine(line: string): Task | null {
  // Match checkbox format: - [ ] or - [x] or - [X]
  const checkboxMatch = line.match(/^-\s*\[([ xX])\]\s*/);
  if (!checkboxMatch) return null;

  const completed = checkboxMatch[1].toLowerCase() === 'x';
  let remaining = line.slice(checkboxMatch[0].length).trim();

  // Extract task ID (T001, T002, etc.)
  const idMatch = remaining.match(/^(T\d+)\s*/);
  if (!idMatch) return null;

  const id = idMatch[1];
  remaining = remaining.slice(idMatch[0].length).trim();

  // Check for parallel marker [P]
  const parallel = remaining.startsWith('[P]');
  if (parallel) {
    remaining = remaining.slice(3).trim();
  }

  // Check for user story marker [US1], [US2], etc.
  const storyMatch = remaining.match(/^\[(US\d+)\]\s*/);
  let userStory: string | undefined;
  if (storyMatch) {
    userStory = storyMatch[1];
    remaining = remaining.slice(storyMatch[0].length).trim();
  }

  // Extract file path if present (usually at the end after "in" or as a path)
  const pathMatch = remaining.match(/(?:in\s+)?([^\s]+\.[a-z]+)$/i);
  const filePath = pathMatch ? pathMatch[1] : undefined;

  return {
    id,
    description: remaining,
    completed,
    parallel,
    userStory,
    filePath,
  };
}

/**
 * Extract user story ID from phase name if present
 * Matches patterns like "US1 – Create/Complete" or "US2 - Edit Tasks"
 */
function extractUserStoryFromPhaseName(phaseName: string): string | undefined {
  const match = phaseName.match(/^(US\d+)\s*[–\-]/i);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * Parse tasks.md file and extract tasks organized by phases
 */
export function parseTasksFile(content: string): { tasks: Task[]; phases: TaskPhase[] } {
  const lines = content.split('\n');
  const tasks: Task[] = [];
  const phases: TaskPhase[] = [];

  let currentPhase: TaskPhase | null = null;
  let currentPhaseUserStory: string | undefined = undefined;

  for (const line of lines) {
    // Check for phase headers (## Phase N: Name or ## Phase N - Name)
    const phaseMatch = line.match(/^##\s*Phase\s*\d*:?\s*(.+)/i);
    if (phaseMatch) {
      if (currentPhase && currentPhase.tasks.length > 0) {
        phases.push(currentPhase);
      }
      const phaseName = phaseMatch[1].trim();
      currentPhase = {
        name: phaseName,
        tasks: [],
      };
      // Extract user story from phase name for tasks that don't have explicit [USx] markers
      currentPhaseUserStory = extractUserStoryFromPhaseName(phaseName);
      continue;
    }

    // Parse task lines
    const task = parseTaskLine(line);
    if (task) {
      // If task doesn't have explicit userStory marker, inherit from phase name
      if (!task.userStory && currentPhaseUserStory) {
        task.userStory = currentPhaseUserStory;
      }
      tasks.push(task);
      if (currentPhase) {
        currentPhase.tasks.push(task);
      }
    }
  }

  // Push the last phase
  if (currentPhase && currentPhase.tasks.length > 0) {
    phases.push(currentPhase);
  }

  return { tasks, phases };
}

/**
 * Parse clarifications from spec.md content
 * Format: ## Clarifications
 *         ### Session YYYY-MM-DD
 *         - Q: question -> A: answer
 */
export function parseClarifications(content: string): ClarificationSession[] {
  const sessions: ClarificationSession[] = [];

  // Find the Clarifications section
  const clarificationsMatch = content.match(/## Clarifications\s*\n([\s\S]*?)(?=\n## [^#]|$)/i);
  if (!clarificationsMatch) return sessions;

  const clarificationsContent = clarificationsMatch[1];

  // Split by session headers (### Session YYYY-MM-DD)
  const sessionRegex = /### Session (\d{4}-\d{2}-\d{2})\s*\n([\s\S]*?)(?=\n### Session|\n## |$)/gi;
  let sessionMatch;

  while ((sessionMatch = sessionRegex.exec(clarificationsContent)) !== null) {
    const date = sessionMatch[1];
    const sessionContent = sessionMatch[2];
    const clarifications: Clarification[] = [];

    // Parse Q&A lines: - Q: question -> A: answer (using arrow notation)
    const qaRegex = /^-\s*Q:\s*(.+?)\s*(?:→|->)\s*A:\s*(.+)$/gm;
    let qaMatch;

    while ((qaMatch = qaRegex.exec(sessionContent)) !== null) {
      clarifications.push({
        question: qaMatch[1].trim(),
        answer: qaMatch[2].trim(),
      });
    }

    if (clarifications.length > 0) {
      sessions.push({ date, clarifications });
    }
  }

  // Sort sessions by date (newest first)
  sessions.sort((a, b) => b.date.localeCompare(a.date));

  return sessions;
}

/**
 * Parse user stories from spec.md content (T006)
 * Format: ### User Story N - [Title] (Priority: PN)
 */
export function parseUserStories(content: string): UserStory[] {
  const userStories: UserStory[] = [];
  const storyRegex = /###\s*User Story\s*(\d+)\s*[-–]\s*([^(]+)\s*\(Priority:\s*(P[123])\)/gi;
  let match;

  while ((match = storyRegex.exec(content)) !== null) {
    const storyNumber = match[1];
    const title = match[2].trim();
    const priority = match[3].toUpperCase() as 'P1' | 'P2' | 'P3';
    const id = `US${storyNumber}`;

    // Find content between this story and next
    const storyStart = match.index + match[0].length;
    const nextMatch = content.slice(storyStart).match(/\n###\s*User Story|\n##\s+|\n---/);
    const storyEnd = nextMatch ? storyStart + (nextMatch.index ?? content.length) : content.length;
    const storyContent = content.slice(storyStart, storyEnd);

    // Extract description
    const descMatch = storyContent.match(/^([\s\S]*?)(?=\*\*Acceptance|$)/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract acceptance criteria
    const acceptanceCriteria: string[] = [];
    const criteriaRegex = /^\d+\.\s*\*\*Given\*\*[^]*?(?=\n\d+\.\s*\*\*Given\*\*|\n\n---|\n##|$)/gm;
    let criteriaMatch;
    while ((criteriaMatch = criteriaRegex.exec(storyContent)) !== null) {
      acceptanceCriteria.push(criteriaMatch[0].trim());
    }

    userStories.push({ id, title, priority, description, acceptanceCriteria });
  }

  return userStories;
}

/**
 * Parse technical context from plan.md content (T008)
 */
export function parseTechnicalContext(content: string): TechnicalContext | null {
  const contextMatch = content.match(/##\s*Technical Context\s*\n([\s\S]*?)(?=\n##\s+|$)/i);
  if (!contextMatch) return null;

  const ctx = contextMatch[1];
  const langMatch = ctx.match(/\*\*Language(?:\/Version)?\*\*:\s*([^\n]+)/i);
  const depsMatch = ctx.match(/\*\*Primary Dependencies\*\*:\s*([^\n]+)/i);
  const storageMatch = ctx.match(/\*\*Storage\*\*:\s*([^\n]+)/i);
  const testingMatch = ctx.match(/\*\*Testing\*\*:\s*([^\n]+)/i);
  const platformMatch = ctx.match(/\*\*Target Platform\*\*:\s*([^\n]+)/i);

  const depsStr = depsMatch ? depsMatch[1].trim() : '';
  return {
    language: langMatch ? langMatch[1].trim() : '',
    dependencies: depsStr ? depsStr.split(',').map(d => d.trim()).filter(Boolean) : [],
    storage: storageMatch ? storageMatch[1].trim() : '',
    testing: testingMatch ? testingMatch[1].trim() : '',
    platform: platformMatch ? platformMatch[1].trim() : '',
  };
}

/**
 * Parse feature branch name from spec.md or plan.md content
 * Looks for patterns like:
 * - **Feature Branch**: `1-todo-app`
 * - **Branch**: `1-todo-app`
 */
export function parseBranchName(content: string): string | null {
  // Match **Feature Branch**: `branch-name` or **Branch**: `branch-name`
  const branchMatch = content.match(/\*\*(?:Feature\s+)?Branch\*\*:\s*`([^`]+)`/i);
  return branchMatch ? branchMatch[1].trim() : null;
}

/**
 * Parse checklist completion from markdown content.
 * Counts all checkbox items (- [ ] and - [x]) in the content.
 * Returns total and completed counts.
 */
export function parseChecklistCompletion(content: string): { total: number; completed: number } {
  // Match unchecked: - [ ] or * [ ]
  const uncheckedMatches = content.match(/^[\s]*[-*]\s*\[\s\]/gm) || [];
  // Match checked: - [x] or - [X] or * [x] or * [X]
  const checkedMatches = content.match(/^[\s]*[-*]\s*\[[xX]\]/gm) || [];

  const completed = checkedMatches.length;
  const total = uncheckedMatches.length + completed;

  return { total, completed };
}

/**
 * Group tasks by user story marker (T010)
 */
export function groupTasksByUserStory(tasks: Task[], userStories: UserStory[]): TaskGroup[] {
  const groups: Map<string | null, Task[]> = new Map();
  const storyMap = new Map(userStories.map(s => [s.id, s]));

  for (const story of userStories) groups.set(story.id, []);
  groups.set(null, []);

  for (const task of tasks) {
    const storyId = task.userStory || null;
    if (!groups.has(storyId)) groups.set(storyId, []);
    groups.get(storyId)!.push(task);
  }

  const taskGroups: TaskGroup[] = [];

  // Add known user story groups first (in order)
  for (const story of userStories) {
    const storyTasks = groups.get(story.id) || [];
    if (storyTasks.length > 0) {
      taskGroups.push({
        storyId: story.id,
        storyTitle: story.title,
        tasks: storyTasks,
        completedCount: storyTasks.filter(t => t.completed).length,
        totalCount: storyTasks.length,
      });
    }
  }

  // Add unknown user story groups (tasks with userStory not in userStories)
  for (const [storyId, storyTasks] of groups.entries()) {
    if (storyId !== null && !storyMap.has(storyId) && storyTasks.length > 0) {
      taskGroups.push({
        storyId,
        storyTitle: storyId, // Use ID as title when story not found
        tasks: storyTasks,
        completedCount: storyTasks.filter(t => t.completed).length,
        totalCount: storyTasks.length,
      });
    }
  }

  // Add "Other Tasks" group for ungrouped tasks
  const otherTasks = groups.get(null) || [];
  if (otherTasks.length > 0) {
    taskGroups.push({
      storyId: null,
      storyTitle: 'Other Tasks',
      tasks: otherTasks,
      completedCount: otherTasks.filter(t => t.completed).length,
      totalCount: otherTasks.length,
    });
  }

  return taskGroups;
}

/**
 * Parse additional spec-kit files from feature directory (T012)
 * Handles errors gracefully - continues processing other files if one fails
 */
export function parseAdditionalFiles(featurePath: string): SpecKitFile[] {
  const additionalFiles: SpecKitFile[] = [];
  const configs: { name: string; type: SpecKitFileType }[] = [
    { name: 'research.md', type: 'research' },
    { name: 'data-model.md', type: 'data-model' },
    { name: 'quickstart.md', type: 'quickstart' },
  ];

  for (const cfg of configs) {
    const filePath = path.join(featurePath, cfg.name);
    try {
      const exists = fs.existsSync(filePath);
      additionalFiles.push({
        type: cfg.type,
        path: filePath,
        content: exists ? fs.readFileSync(filePath, 'utf-8') : '',
        exists,
      });
    } catch (error) {
      console.error(`Failed to read additional file ${filePath}:`, error);
      additionalFiles.push({
        type: cfg.type,
        path: filePath,
        content: '',
        exists: false,
      });
    }
  }

  const contractsDir = path.join(featurePath, 'contracts');
  try {
    if (fs.existsSync(contractsDir) && fs.statSync(contractsDir).isDirectory()) {
      const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.md'));
      for (const f of contractFiles) {
        const contractPath = path.join(contractsDir, f);
        try {
          additionalFiles.push({
            type: 'contract',
            path: contractPath,
            content: fs.readFileSync(contractPath, 'utf-8'),
            exists: true,
          });
        } catch (error) {
          console.error(`Failed to read contract file ${contractPath}:`, error);
          additionalFiles.push({
            type: 'contract',
            path: contractPath,
            content: '',
            exists: false,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read contracts directory ${contractsDir}:`, error);
  }

  // Parse checklists directory (similar to contracts)
  const checklistsDir = path.join(featurePath, 'checklists');
  try {
    if (fs.existsSync(checklistsDir) && fs.statSync(checklistsDir).isDirectory()) {
      const checklistFiles = fs.readdirSync(checklistsDir).filter(f => f.endsWith('.md'));
      for (const f of checklistFiles) {
        const checklistPath = path.join(checklistsDir, f);
        try {
          additionalFiles.push({
            type: 'checklist',
            path: checklistPath,
            content: fs.readFileSync(checklistPath, 'utf-8'),
            exists: true,
          });
        } catch (error) {
          console.error(`Failed to read checklist file ${checklistPath}:`, error);
          additionalFiles.push({
            type: 'checklist',
            path: checklistPath,
            content: '',
            exists: false,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read checklists directory ${checklistsDir}:`, error);
  }

  return additionalFiles;
}

/**
 * Parse analysis directory for spec alignment data
 * Reads analysis.json and analysis.md from analysis/ directory
 */
export function parseAnalysis(featurePath: string): FeatureAnalysis {
  const analysisDir = path.join(featurePath, 'analysis');
  const jsonPath = path.join(analysisDir, 'analysis.json');
  const mdPath = path.join(analysisDir, 'analysis.md');

  let jsonData: AnalysisData | null = null;
  let markdownContent: string | null = null;
  let jsonPathResult: string | null = null;
  let markdownPathResult: string | null = null;

  try {
    if (fs.existsSync(jsonPath)) {
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      jsonData = JSON.parse(jsonContent) as AnalysisData;
      jsonPathResult = jsonPath;
    }
  } catch (error) {
    console.error(`Failed to parse analysis.json at ${jsonPath}:`, error);
  }

  try {
    if (fs.existsSync(mdPath)) {
      markdownContent = fs.readFileSync(mdPath, 'utf-8');
      markdownPathResult = mdPath;
    }
  } catch (error) {
    console.error(`Failed to read analysis.md at ${mdPath}:`, error);
  }

  return {
    jsonData,
    markdownContent,
    jsonPath: jsonPathResult,
    markdownPath: markdownPathResult,
  };
}

/**
 * Parse constitution.md file
 * Extracts principles, sections, and version metadata
 */
export function parseConstitution(content: string): Constitution {
  const principles: ConstitutionPrinciple[] = [];
  const sections: ConstitutionSection[] = [];

  // Extract version info from the footer line
  // Format: **Version**: X.X.X | **Ratified**: YYYY-MM-DD | **Last Amended**: YYYY-MM-DD
  const versionMatch = content.match(/\*\*Version\*\*:\s*([^\s|]+)/);
  const ratifiedMatch = content.match(/\*\*Ratified\*\*:\s*([^\s|]+)/);
  const amendedMatch = content.match(/\*\*Last Amended\*\*:\s*([^\s|]+)/);

  const version = versionMatch ? versionMatch[1].trim() : undefined;
  const ratifiedDate = ratifiedMatch ? ratifiedMatch[1].trim() : undefined;
  const lastAmendedDate = amendedMatch ? amendedMatch[1].trim() : undefined;

  // Find Core Principles section and extract principles
  const principlesMatch = content.match(/## Core Principles\s*\n([\s\S]*?)(?=\n## [^#]|$)/i);
  if (principlesMatch) {
    const principlesContent = principlesMatch[1];
    // Match ### headers within Core Principles
    const principleRegex = /### ([^\n]+)\s*\n([\s\S]*?)(?=\n### |$)/g;
    let match;

    while ((match = principleRegex.exec(principlesContent)) !== null) {
      const name = match[1].trim();
      // Skip template placeholders
      if (!name.startsWith('[')) {
        principles.push({
          name,
          description: match[2].trim().replace(/<!--[\s\S]*?-->/g, '').trim(),
        });
      }
    }
  }

  // Extract other ## sections (excluding Core Principles and Governance)
  const sectionRegex = /## ([^\n]+)\s*\n([\s\S]*?)(?=\n## |$)/g;
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(content)) !== null) {
    const sectionName = sectionMatch[1].trim();
    // Skip Core Principles (already parsed) and template placeholders
    if (sectionName !== 'Core Principles' && !sectionName.startsWith('[')) {
      sections.push({
        name: sectionName,
        content: sectionMatch[2].trim().replace(/<!--[\s\S]*?-->/g, '').trim(),
      });
    }
  }

  return {
    rawContent: content,
    principles,
    sections,
    version,
    ratifiedDate,
    lastAmendedDate,
  };
}

/**
 * Determine feature stage based on available files and task completion
 */
export function determineFeatureStage(
  hasSpec: boolean,
  hasPlan: boolean,
  hasTasks: boolean,
  completedTasks: number,
  totalTasks: number
): FeatureStage {
  if (!hasSpec) return 'specify';
  if (!hasPlan) return 'plan';
  if (!hasTasks) return 'tasks';
  if (totalTasks > 0 && completedTasks === totalTasks) return 'complete';
  if (totalTasks > 0 && completedTasks > 0) return 'implement';
  return 'tasks';
}

/**
 * Parse a single feature directory (T014 - updated to use new parsing functions)
 */
export async function parseFeature(featurePath: string): Promise<Feature | null> {
  try {
    const featureName = path.basename(featurePath);

    // Check for required files
    const specPath = path.join(featurePath, 'spec.md');
    const planPath = path.join(featurePath, 'plan.md');
    const tasksPath = path.join(featurePath, 'tasks.md');

    const hasSpec = fs.existsSync(specPath);
    const hasPlan = fs.existsSync(planPath);
    const hasTasks = fs.existsSync(tasksPath);

    let tasks: Task[] = [];
    let phases: TaskPhase[] = [];
    let clarificationSessions: ClarificationSession[] = [];
    let userStories: UserStory[] = [];
    let technicalContext: TechnicalContext | null = null;
    let specContent: string | null = null;
    let planContent: string | null = null;

    if (hasTasks) {
      const tasksFileContent = fs.readFileSync(tasksPath, 'utf-8');
      const parsed = parseTasksFile(tasksFileContent);
      tasks = parsed.tasks;
      phases = parsed.phases;
    }

    // Parse spec.md for clarifications and user stories
    if (hasSpec) {
      specContent = fs.readFileSync(specPath, 'utf-8');
      clarificationSessions = parseClarifications(specContent);
      userStories = parseUserStories(specContent);
    }

    // Parse plan.md for technical context
    if (hasPlan) {
      planContent = fs.readFileSync(planPath, 'utf-8');
      technicalContext = parseTechnicalContext(planContent);
    }

    // Parse branch name from spec.md or plan.md
    const branch = parseBranchName(specContent || '') || parseBranchName(planContent || '');

    // Group tasks by user story
    const taskGroups = groupTasksByUserStory(tasks, userStories);

    // Parse additional spec-kit files
    const additionalFiles = parseAdditionalFiles(featurePath);

    // Parse analysis data
    const analysis = parseAnalysis(featurePath);

    // Calculate checklist completion from all checklist files
    const checklists = additionalFiles.filter(f => f.type === 'checklist');
    const hasChecklists = checklists.length > 0;
    let totalChecklistItems = 0;
    let completedChecklistItems = 0;
    for (const checklist of checklists) {
      const { total, completed } = parseChecklistCompletion(checklist.content);
      totalChecklistItems += total;
      completedChecklistItems += completed;
    }

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter(t => !t.completed).length;
    const totalClarifications = clarificationSessions.reduce(
      (sum, session) => sum + session.clarifications.length,
      0
    );

    const stage = determineFeatureStage(hasSpec, hasPlan, hasTasks, completedTasks, totalTasks);

    return {
      id: featureName,
      name: featureName.replace(/^\d+-/, '').replace(/-/g, ' '),
      path: featurePath,
      stage,
      hasSpec,
      hasPlan,
      hasTasks,
      tasks,
      phases,
      totalTasks,
      completedTasks,
      inProgressTasks,
      branch,
      clarificationSessions,
      totalClarifications,
      // Extended fields for full spec-kit integration
      userStories,
      technicalContext,
      taskGroups,
      specContent,
      planContent,
      additionalFiles,
      // Analysis data for spec alignment
      analysis: (analysis.jsonData || analysis.markdownContent) ? analysis : null,
      // Checklist completion tracking
      hasChecklists,
      totalChecklistItems,
      completedChecklistItems,
    };
  } catch (error) {
    console.error(`Error parsing feature at ${featurePath}:`, error);
    return null;
  }
}

/**
 * Parse entire project and return all features
 */
export async function parseProject(projectPath: string): Promise<Project | null> {
  try {
    const specsDir = path.join(projectPath, 'specs');

    // Check for constitution file in .specify/memory/constitution.md
    const constitutionPath = path.join(projectPath, '.specify', 'memory', 'constitution.md');
    let constitution: Constitution | null = null;
    const hasConstitution = fs.existsSync(constitutionPath);

    if (hasConstitution) {
      const constitutionContent = fs.readFileSync(constitutionPath, 'utf-8');
      constitution = parseConstitution(constitutionContent);
    }

    if (!fs.existsSync(specsDir)) {
      // Try alternative location
      const altSpecsDir = path.join(projectPath, '.specify', 'specs');
      if (!fs.existsSync(altSpecsDir)) {
        return {
          path: projectPath,
          name: path.basename(projectPath),
          features: [],
          lastUpdated: new Date(),
          constitution,
          hasConstitution,
        };
      }
    }

    const actualSpecsDir = fs.existsSync(specsDir)
      ? specsDir
      : path.join(projectPath, '.specify', 'specs');

    const entries = fs.readdirSync(actualSpecsDir, { withFileTypes: true });
    const featureDirs = entries.filter(e => e.isDirectory());

    const features: Feature[] = [];
    for (const dir of featureDirs) {
      const feature = await parseFeature(path.join(actualSpecsDir, dir.name));
      if (feature) {
        features.push(feature);
      }
    }

    // Sort features by name (which typically includes a number prefix)
    features.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    return {
      path: projectPath,
      name: path.basename(projectPath),
      features,
      lastUpdated: new Date(),
      constitution,
      hasConstitution,
    };
  } catch (error) {
    console.error(`Error parsing project at ${projectPath}:`, error);
    return null;
  }
}
