import { getCurrentStep, getProgress } from '@/core/analytics/project-analytics';
import { storage } from '@/core/storage/storage';
import { listTemplates } from '@/core/templates/registry';
import type { Project, ProjectMeta, Step } from '@/core/types';
import ProjectsTemplatesView, {
  type ProjectGalleryItem,
  type TemplateGalleryItem,
} from '@/components/plangraph/projects/ProjectsTemplatesView';

type SearchParams = Promise<{
  q?: string;
  status?: string;
  sort?: string;
  selected?: string;
}>;

export default async function ProjectsIndexPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const statusFilter = params.status ?? 'all';
  const sortBy = params.sort ?? 'updated';

  const projects = await getProjectGallery();
  const filtered = projects
    .filter((project) => {
      const matchesQuery =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.idea.toLowerCase().includes(query) ||
        project.templateId.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => sortProjects(a, b, sortBy));

  const latest = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const selected =
    filtered.find((project) => project.id === params.selected) ??
    filtered[0] ??
    (query || statusFilter !== 'all' ? null : latest) ??
    null;

  const templates: TemplateGalleryItem[] = listTemplates().slice(0, 5).map((template) => ({
    id: template.id,
    kind: template.kind,
    name: template.name,
    description: template.description,
    defaultStack: template.defaultStack,
    stageCount: template.baseSteps.length + template.conditionalSteps.length,
  }));

  return (
    <ProjectsTemplatesView
      projects={projects}
      filteredProjects={filtered}
      selectedProject={selected}
      templates={templates}
      query={params.q ?? ''}
      statusFilter={statusFilter}
      sortBy={sortBy}
    />
  );
}

async function getProjectGallery(): Promise<ProjectGalleryItem[]> {
  const metas = await storage.listProjects();
  const projects = await Promise.all(
    metas.map(async (meta) => {
      const project = await storage.readProject(meta.id);
      const progress = project ? getProgress(project) : { done: 0, total: 0, percent: 0 };
      const currentStep = project ? getCurrentStep(project) : null;
      const blockedCount =
        project?.steps.filter((step) => step.status === 'blocked' || step.status === 'failed').length ?? 0;
      const status = getProjectStatus(progress, project?.steps ?? [], blockedCount);

      return {
        ...meta,
        progress,
        currentStep,
        status,
        stepCount: project?.steps.length ?? 0,
        blockedCount,
        stackPreview: meta.stack?.slice(0, 4) ?? [],
        project,
      };
    }),
  );

  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getProjectStatus(
  progress: { done: number; total: number; percent: number },
  steps: Step[],
  blockedCount: number,
): ProjectGalleryItem['status'] {
  if (blockedCount > 0) return 'blocked';
  if (progress.total > 0 && progress.done === progress.total) return 'complete';
  if (steps.length === 0 || progress.done === 0) return 'draft';
  return 'active';
}

function sortProjects(a: ProjectGalleryItem, b: ProjectGalleryItem, sortBy: string) {
  if (sortBy === 'name') return a.name.localeCompare(b.name);
  if (sortBy === 'progress') return b.progress.percent - a.progress.percent;
  if (sortBy === 'created') return b.createdAt.localeCompare(a.createdAt);
  return b.updatedAt.localeCompare(a.updatedAt);
}

export type { Project, ProjectMeta };
