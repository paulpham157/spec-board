import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Parse checklist progress from markdown content
 * Returns { completed, total } counts
 */
function parseChecklistProgress(content: string | null): { completed: number; total: number } | null {
  if (!content) return null;

  const checkedMatches = content.match(/- \[x\]/gi);
  const uncheckedMatches = content.match(/- \[ \]/gi);

  const completed = checkedMatches?.length || 0;
  const total = completed + (uncheckedMatches?.length || 0);

  if (total === 0) return null;

  return { completed, total };
}

/**
 * GET /api/project/[name]/data
 * Returns project data - features from DB or filesystem,
 * constitution always from database.
 *
 * Query params:
 * - view: 'kanban' | 'detail' (default: 'detail')
 *   - 'kanban': Lightweight query for Kanban board (faster)
 *   - 'detail': Full query for feature detail modal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'detail';

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100
    const skip = (page - 1) * limit;

    // Run project query and feature count in parallel
    const projectQuery = view === 'kanban'
      ? prisma.project.findUnique({
          where: { name },
          include: {
            features: {
              orderBy: { order: 'asc' },
              skip,
              take: limit,
              select: {
                id: true,
                featureId: true,
                name: true,
                stage: true,
                description: true,
                order: true,
                jobStatus: true,
                jobProgress: true,
                jobMessage: true,
                priority: true,
                priorityReason: true,
                _count: {
                  select: {
                    tasks: true,
                    userStories: true,
                  },
                },
              },
            },
            constitution: {
              select: {
                id: true,
                title: true,
                content: true,
                version: true,
              },
            },
          },
        })
      : prisma.project.findUnique({
          where: { name },
          include: {
            features: {
              orderBy: { order: 'asc' },
              skip,
              take: limit,
              include: {
                userStories: {
                  orderBy: { order: 'asc' },
                },
                tasks: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    taskId: true,
                    title: true,
                    status: true,
                    userStory: { select: { storyId: true } },
                  },
                },
                constitutionVersion: {
                  select: { id: true, version: true, content: true, principles: true },
                },
              },
            },
            constitution: {
              include: {
                versions: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
              },
            },
          },
        });

    const [project, totalFeatures] = await Promise.all([
      projectQuery,
      prisma.feature.count({ where: { project: { name } } }),
    ]);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Cast to any to handle different query shapes
    const projectData = project as any;

    // Transform database features to frontend format
    // Use different transformation based on view type
    const features = projectData.features.map((feature: any) => {
      const base = {
        id: feature.id,
        featureId: feature.featureId,
        name: feature.name || feature.featureId,
        path: '',
        stage: feature.stage,
        description: feature.description,
        jobStatus: feature.jobStatus as 'idle' | 'queued' | 'running' | 'completed' | 'failed' | undefined,
        jobProgress: feature.jobProgress || 0,
        jobMessage: feature.jobMessage || undefined,
      };

      if (view === 'kanban') {
        return {
          ...base,
          hasSpec: false,
          hasClarifications: false,
          hasPlan: false,
          hasTasks: false,
          totalTasks: feature._count?.tasks || 0,
          completedTasks: 0,
          inProgressTasks: 0,
          checklistProgress: null,
          phases: [],
          tasks: [],
          userStories: [],
          clarificationSessions: [],
          totalClarifications: 0,
          technicalContext: null,
          taskGroups: null,
          constitutionVersion: null,
          branch: null,
          specContent: null,
          planContent: null,
          tasksContent: null,
          clarificationsContent: null,
          researchContent: null,
          dataModelContent: null,
          quickstartContent: null,
          contractsContent: null,
          checklistsContent: null,
          analysisContent: null,
          additionalFiles: [],
          priority: feature.priority || null,
          priorityReason: feature.priorityReason || null,
        };
      }

      // Detail view - include all fields
      return {
        ...base,
        hasSpec: !!feature.specContent,
        hasClarifications: !!feature.clarificationsContent,
        hasPlan: !!feature.planContent,
        hasTasks: !!feature.tasksContent,
        constitutionVersion: feature.constitutionVersion
          ? {
              id: feature.constitutionVersion.id,
              version: feature.constitutionVersion.version,
              content: feature.constitutionVersion.content,
              principles: feature.constitutionVersion.principles,
            }
          : null,
        tasks: feature.tasks?.map((task: any) => ({
          id: task.taskId,
          dbId: task.id,
          description: task.title,
          completed: task.status === 'completed',
          parallel: false,
          userStory: task.userStory?.storyId,
          filePath: null,
        })) || [],
        totalTasks: feature.tasks?.length || 0,
        completedTasks: feature.tasks?.filter((t: any) => t.status === 'completed').length || 0,
        inProgressTasks: feature.tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
        checklistProgress: parseChecklistProgress(feature.checklistsContent),
        branch: null,
        clarificationSessions: [],
        totalClarifications: 0,
        userStories: feature.userStories?.map((us: any) => ({
          id: us.storyId,
          title: us.title,
          description: us.description,
          status: us.status,
        })) || [],
        technicalContext: null,
        taskGroups: [],
        specContent: feature.specContent,
        planContent: feature.planContent,
        tasksContent: feature.tasksContent,
        clarificationsContent: feature.clarificationsContent,
        researchContent: feature.researchContent,
        dataModelContent: feature.dataModelContent,
        quickstartContent: feature.quickstartContent,
        contractsContent: feature.contractsContent,
        checklistsContent: feature.checklistsContent,
        analysisContent: feature.analysisContent,
        additionalFiles: [],
        priority: feature.priority || null,
        priorityReason: feature.priorityReason || null,
      };
    });

    return NextResponse.json({
      projectId: projectData.id,
      path: '',
      name: projectData.displayName || projectData.name,
      description: projectData.description,
      features,
      lastUpdated: projectData.updatedAt,
      constitution: projectData.constitution
        ? view === 'kanban'
          ? {
              rawContent: projectData.constitution.content,
              title: projectData.constitution.title || undefined,
              version: projectData.constitution.version || undefined,
            }
          : {
              rawContent: projectData.constitution.content,
              title: projectData.constitution.title || undefined,
              principles: projectData.constitution.principles as any,
              sections: [],
              version: projectData.constitution.version || undefined,
              ratifiedDate: projectData.constitution.ratifiedDate?.toISOString(),
              lastAmendedDate: projectData.constitution.lastAmendedDate?.toISOString(),
              versions: projectData.constitution.versions?.map((v: any) => ({
                id: v.id,
                version: v.version,
                content: v.content,
                description: v.description,
                principles: v.principles,
                changeType: v.changeType,
                changeNote: v.changeNote,
                createdAt: v.createdAt.toISOString(),
              })) || [],
            }
        : null,
      hasConstitution: !!projectData.constitution,
      pagination: {
        page,
        limit,
        total: totalFeatures,
        totalPages: Math.ceil(totalFeatures / limit),
      },
    });

  } catch (error) {
    console.error('Error loading project data:', error);
    return NextResponse.json(
      { error: 'Failed to load project data' },
      { status: 500 }
    );
  }
}
