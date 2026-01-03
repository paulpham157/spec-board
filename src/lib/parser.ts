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
  ConstitutionSubsection,
  ClarificationSession,
  Clarification,
  UserStory,
  TechnicalContext,
  TaskGroup,
  SpecKitFile,
  SpecKitFileType,
  FeatureAnalysis,
  AnalysisReport,
  SyncImpactReport,
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
 * Matches patterns like "Phase 2: US1 – Create/Complete" or "US2 - Edit Tasks"
 */
function extractUserStoryFromPhaseName(phaseName: string): string | undefined {
  // Look for US pattern anywhere in the phase name (after "Phase N:" prefix)
  const match = phaseName.match(/(US\d+)\s*[–\-]/i);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * Parse tasks.md file and extract tasks organized by phases
 *
 * This parser captures ALL content within a phase:
 * - Phase name from ## Phase header
 * - Description: all non-task content (Purpose, subsections, checkpoints, etc.)
 * - Tasks: all checkbox items (- [ ] or - [x])
 */
export function parseTasksFile(content: string): { tasks: Task[]; phases: TaskPhase[] } {
  const lines = content.split('\n');
  const tasks: Task[] = [];
  const phases: TaskPhase[] = [];

  let currentPhase: TaskPhase | null = null;
  let currentPhaseUserStory: string | undefined = undefined;
  let pendingMarkdownLines: string[] = [];

  // Helper to flush pending markdown lines as a content block
  const flushMarkdown = () => {
    if (currentPhase && pendingMarkdownLines.length > 0) {
      const content = pendingMarkdownLines.join('\n').trim();
      if (content) {
        currentPhase.contentBlocks.push({ type: 'markdown', content });
      }
      pendingMarkdownLines = [];
    }
  };

  for (const line of lines) {
    // Check for any ## headers (phases, dependencies, summary, etc.)
    // This captures both "## Phase N: Name" and "## Dependencies & Execution Order"
    const phaseMatch = line.match(/^##\s+(.+)/);
    if (phaseMatch) {
      // Flush any pending markdown before saving phase
      flushMarkdown();

      // Save previous phase
      if (currentPhase) {
        // Build description from all markdown blocks for backwards compat
        const allMarkdown = currentPhase.contentBlocks
          .filter((b): b is { type: 'markdown'; content: string } => b.type === 'markdown')
          .map(b => b.content)
          .join('\n\n');
        if (allMarkdown) {
          currentPhase.description = allMarkdown;
        }
        if (currentPhase.tasks.length > 0 || currentPhase.description || currentPhase.contentBlocks.length > 0) {
          phases.push(currentPhase);
        }
      }
      const phaseName = phaseMatch[1].trim();
      currentPhase = {
        name: phaseName,
        tasks: [],
        contentBlocks: [],
      };
      // Extract user story from phase name for tasks that don't have explicit [USx] markers
      currentPhaseUserStory = extractUserStoryFromPhaseName(phaseName);
      pendingMarkdownLines = [];
      continue;
    }

    // Parse task lines
    const task = parseTaskLine(line);
    if (task) {
      // Flush any pending markdown before adding task
      flushMarkdown();

      // If task doesn't have explicit userStory marker, inherit from phase name
      if (!task.userStory && currentPhaseUserStory) {
        task.userStory = currentPhaseUserStory;
      }
      tasks.push(task);
      if (currentPhase) {
        currentPhase.tasks.push(task);
        currentPhase.contentBlocks.push({ type: 'task', task });
      }
    } else if (currentPhase) {
      // Collect non-task content - will be flushed as markdown block before next task or phase
      // Skip empty lines at the start, but include them in the middle
      if (line.trim() || pendingMarkdownLines.length > 0) {
        pendingMarkdownLines.push(line);
      }
    }
  }

  // Flush any remaining markdown and push the last phase
  flushMarkdown();
  if (currentPhase) {
    // Build description from all markdown blocks for backwards compat
    const allMarkdown = currentPhase.contentBlocks
      .filter((b): b is { type: 'markdown'; content: string } => b.type === 'markdown')
      .map(b => b.content)
      .join('\n\n');
    if (allMarkdown) {
      currentPhase.description = allMarkdown;
    }
    if (currentPhase.tasks.length > 0 || currentPhase.description || currentPhase.contentBlocks.length > 0) {
      phases.push(currentPhase);
    }
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
          const content = fs.readFileSync(checklistPath, 'utf-8');
          // Parse per-file checklist progress
          const checklistProgress = parseChecklistCompletion(content);
          additionalFiles.push({
            type: 'checklist',
            path: checklistPath,
            content,
            exists: true,
            checklistProgress,
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
 * Extract ISO timestamp from analysis filename (T004)
 * Format: YYYY-MM-DD-HH-mm-analysis.md -> YYYY-MM-DDTHH:mm:00
 */
export function extractTimestampFromFilename(filename: string): string {
  // Match: 2026-01-03-16-30-analysis.md
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-analysis\.md$/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  }
  // Fallback for legacy analysis.md (no timestamp)
  return new Date().toISOString();
}

/**
 * Parse analysis directory for spec alignment data (T003, T005, T006)
 * Reads all *-analysis.md files from analysis/ directory
 * Returns reports sorted by filename (newest first) with backwards compatibility
 */
export function parseAnalysis(featurePath: string): FeatureAnalysis {
  const analysisDir = path.join(featurePath, 'analysis');
  const reports: AnalysisReport[] = [];

  try {
    if (fs.existsSync(analysisDir) && fs.statSync(analysisDir).isDirectory()) {
      // Read all *-analysis.md files
      const files = fs.readdirSync(analysisDir)
        .filter(f => f.endsWith('-analysis.md') || f === 'analysis.md')
        .sort()
        .reverse(); // Sort descending (newest first by filename)

      for (const filename of files) {
        const filePath = path.join(analysisDir, filename);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const timestamp = extractTimestampFromFilename(filename);
          reports.push({
            filename,
            timestamp,
            path: filePath,
            content,
          });
        } catch (error) {
          console.error(`Failed to read analysis file ${filePath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read analysis directory ${analysisDir}:`, error);
  }

  // Backwards compatibility: populate from latest report (T006)
  const latestReport = reports[0] || null;

  return {
    reports,
    markdownContent: latestReport?.content || null,
    markdownPath: latestReport?.path || null,
  };
}

/**
 * Parse Sync Impact Report from HTML comment in constitution.md
 * Format:
 * <!--
 * Sync Impact Report
 * ==================
 * Version change: 0.0.0 → 1.0.0 (Initial ratification)
 * Modified principles: N/A
 * Added sections:
 *   - Core Principles (5 principles)
 *   - Quality Standards
 * Removed sections: N/A
 * Templates requiring updates:
 *   - .specify/templates/plan-template.md ✅ (no changes needed)
 * Follow-up TODOs: None
 * -->
 */
function parseSyncImpactReport(content: string): SyncImpactReport | undefined {
  // Extract HTML comment containing "Sync Impact Report"
  const commentMatch = content.match(/<!--\s*\n?\s*Sync Impact Report[\s\S]*?-->/i);
  if (!commentMatch) return undefined;

  const commentContent = commentMatch[0];

  // Extract version change
  const versionChangeMatch = commentContent.match(/Version change:\s*(.+)/i);
  const versionChange = versionChangeMatch ? versionChangeMatch[1].trim() : undefined;

  // Extract modified principles
  const modifiedPrinciplesMatch = commentContent.match(/Modified principles:\s*(.+)/i);
  const modifiedPrinciples = modifiedPrinciplesMatch ? modifiedPrinciplesMatch[1].trim() : undefined;

  // Extract added sections (multi-line list)
  const addedSections: string[] = [];
  const addedSectionsMatch = commentContent.match(/Added sections:\s*\n([\s\S]*?)(?=\nRemoved sections:|$)/i);
  if (addedSectionsMatch) {
    const lines = addedSectionsMatch[1].split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^\s*-\s*(.+)/);
      if (itemMatch) {
        addedSections.push(itemMatch[1].trim());
      }
    }
  }

  // Extract removed sections
  const removedSections: string[] = [];
  const removedSectionsMatch = commentContent.match(/Removed sections:\s*(.+)/i);
  if (removedSectionsMatch) {
    const value = removedSectionsMatch[1].trim();
    if (value !== 'N/A' && value !== 'None') {
      // Check if it's a multi-line list
      const multiLineMatch = commentContent.match(/Removed sections:\s*\n([\s\S]*?)(?=\nTemplates requiring updates:|$)/i);
      if (multiLineMatch) {
        const lines = multiLineMatch[1].split('\n');
        for (const line of lines) {
          const itemMatch = line.match(/^\s*-\s*(.+)/);
          if (itemMatch) {
            removedSections.push(itemMatch[1].trim());
          }
        }
      }
    }
  }

  // Extract templates status (multi-line list)
  const templatesStatus: { template: string; status: string }[] = [];
  const templatesMatch = commentContent.match(/Templates requiring updates:\s*\n([\s\S]*?)(?=\nFollow-up TODOs:|$)/i);
  if (templatesMatch) {
    const lines = templatesMatch[1].split('\n');
    for (const line of lines) {
      // Match: - .specify/templates/plan-template.md ✅ (no changes needed)
      const itemMatch = line.match(/^\s*-\s*([^\s]+)\s*(.*)/);
      if (itemMatch) {
        templatesStatus.push({
          template: itemMatch[1].trim(),
          status: itemMatch[2].trim(),
        });
      }
    }
  }

  // Extract follow-up TODOs
  const followUpMatch = commentContent.match(/Follow-up TODOs:\s*(.+)/i);
  const followUpTodos = followUpMatch ? followUpMatch[1].trim() : undefined;

  return {
    versionChange,
    modifiedPrinciples,
    addedSections,
    removedSections,
    templatesStatus,
    followUpTodos,
  };
}

/**
 * Parse constitution.md file
 * Extracts principles, sections, version metadata, and sync impact report
 */
export function parseConstitution(content: string): Constitution {
  const principles: ConstitutionPrinciple[] = [];
  const sections: ConstitutionSection[] = [];

  // Extract title from first # heading (e.g., "# TodoList App Constitution")
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Extract version info from the footer line
  // Format: **Version**: X.X.X | **Ratified**: YYYY-MM-DD | **Last Amended**: YYYY-MM-DD
  const versionMatch = content.match(/\*\*Version\*\*:\s*([^\s|]+)/);
  const ratifiedMatch = content.match(/\*\*Ratified\*\*:\s*([^\s|]+)/);
  const amendedMatch = content.match(/\*\*Last Amended\*\*:\s*([^\s|]+)/);

  const version = versionMatch ? versionMatch[1].trim() : undefined;
  const ratifiedDate = ratifiedMatch ? ratifiedMatch[1].trim() : undefined;
  const lastAmendedDate = amendedMatch ? amendedMatch[1].trim() : undefined;

  // Extract Sync Impact Report from HTML comment
  const syncImpactReport = parseSyncImpactReport(content);

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
      const sectionContent = sectionMatch[2];

      // Extract subsections (### headings) within this section
      const subsections: ConstitutionSubsection[] = [];
      const subsectionRegex = /### ([^\n]+)\s*\n([\s\S]*?)(?=\n### |\n## |$)/g;
      let subsectionMatch;

      while ((subsectionMatch = subsectionRegex.exec(sectionContent)) !== null) {
        const subsectionName = subsectionMatch[1].trim();
        // Skip template placeholders
        if (!subsectionName.startsWith('[')) {
          const cleanedSubContent = subsectionMatch[2]
            .trim()
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/^\*\*Version\*\*:.+$/gm, '')
            .trim();
          subsections.push({
            name: subsectionName,
            content: cleanedSubContent,
          });
        }
      }

      // Strip HTML comments and version metadata line from content
      const cleanedContent = sectionContent
        .trim()
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^\*\*Version\*\*:.+$/gm, '')
        .trim();
      sections.push({
        name: sectionName,
        content: cleanedContent,
        subsections,
      });
    }
  }

  return {
    rawContent: content,
    title,
    principles,
    sections,
    version,
    ratifiedDate,
    lastAmendedDate,
    syncImpactReport,
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
    let tasksContent: string | null = null;

    if (hasTasks) {
      tasksContent = fs.readFileSync(tasksPath, 'utf-8');
      const parsed = parseTasksFile(tasksContent);
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
      tasksContent,
      additionalFiles,
      // Analysis data for spec alignment
      analysis: analysis.markdownContent ? analysis : null,
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
