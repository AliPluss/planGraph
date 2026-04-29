import Link from 'next/link';
import {
  ArrowDownAZ,
  Clock3,
  Filter,
  FolderOpen,
  Layers3,
  ListFilter,
  Search,
  Sparkles,
} from 'lucide-react';
import { getCurrentStep, getProgress } from '@/core/analytics/project-analytics';
import { storage } from '@/core/storage/storage';
import { listTemplates } from '@/core/templates/registry';
import type { Project, ProjectMeta, Step } from '@/core/types';

type SearchParams = Promise<{
  q?: string;
  status?: string;
  sort?: string;
  selected?: string;
}>;

type ProjectGalleryItem = ProjectMeta & {
  progress: { done: number; total: number; percent: number };
  currentStep: Step | null;
  status: 'active' | 'blocked' | 'complete' | 'draft';
  stepCount: number;
  blockedCount: number;
  stackPreview: string[];
  project: Project | null;
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
  { value: 'draft', label: 'Draft' },
];

const sortOptions = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
  { value: 'progress', label: 'Progress' },
  { value: 'created', label: 'Newest created' },
];

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
    projects.find((project) => project.id === params.selected) ??
    filtered[0] ??
    latest ??
    null;
  const templates = listTemplates().slice(0, 4);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="pg-panel overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pg-text-faint)]">
              Projects and templates
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Project gallery</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Browse local PlanGraph workspaces, inspect their graph readiness, and start
                  from reusable templates.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {latest && (
                  <Link
                    href={`/project/${latest.id}`}
                    prefetch={false}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--pg-border-soft)] bg-background/50 px-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <FolderOpen className="size-4" />
                    Continue
                  </Link>
                )}
                <Link
                  href="/discovery"
                  prefetch={false}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Sparkles className="size-4" />
                  New project
                </Link>
              </div>
            </div>

            <form className="mt-5 grid gap-3 md:grid-cols-[1fr_12rem_13rem_auto]" action="/project">
              <label className="relative block">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={params.q ?? ''}
                  placeholder="Search projects"
                  className="h-10 w-full rounded-lg border border-input bg-background/55 ps-9 pe-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45"
                />
              </label>
              <label className="relative block">
                <Filter className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  name="status"
                  defaultValue={statusFilter}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background/55 ps-9 pe-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative block">
                <ArrowDownAZ className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  name="sort"
                  defaultValue={sortBy}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background/55 ps-9 pe-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--pg-border-soft)] bg-background/70 px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ListFilter className="size-4" />
                Apply
              </button>
            </form>
          </div>

          <SummaryPanel projects={projects} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_23rem]">
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="pg-panel-muted px-6 py-12 text-center">
              <p className="text-sm font-medium">No matching projects</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Clear the filters or create a new project from discovery.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} selected={selected?.id === project.id} />
              ))}
            </div>
          )}

          <section className="pg-panel-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Recommended templates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reuse proven plan structures when starting the next workspace.
                </p>
              </div>
              <Link
                href="/discovery"
                prefetch={false}
                className="hidden h-8 items-center rounded-lg border border-[var(--pg-border-soft)] px-3 text-xs font-medium transition-colors hover:bg-muted sm:inline-flex"
              >
                Start from template
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href="/discovery"
                  prefetch={false}
                  className="rounded-lg border border-[var(--pg-border-soft)] bg-background/40 p-4 transition-colors hover:bg-muted/55"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{template.name.en}</h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {template.description.en}
                      </p>
                    </div>
                    <span className="rounded-md bg-[var(--pg-accent-cyan)]/15 px-2 py-1 text-[0.68rem] font-semibold uppercase text-[var(--pg-accent-cyan)]">
                      {template.kind.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.defaultStack.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-md bg-muted px-2 py-1 text-[0.68rem] text-muted-foreground">
                        {item}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <ProjectDetails project={selected} />
      </section>
    </main>
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
  progress: ProjectGalleryItem['progress'],
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

function SummaryPanel({ projects }: { projects: ProjectGalleryItem[] }) {
  const active = projects.filter((project) => project.status === 'active').length;
  const blocked = projects.filter((project) => project.status === 'blocked').length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((total, project) => total + project.progress.percent, 0) / projects.length)
    : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
      <Metric label="Total projects" value={String(projects.length)} tone="purple" />
      <Metric label="Active / blocked" value={`${active} / ${blocked}`} tone="amber" />
      <Metric label="Average progress" value={`${avgProgress}%`} tone="green" />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'purple' | 'amber' | 'green' }) {
  const color =
    tone === 'green'
      ? 'var(--pg-accent-green)'
      : tone === 'amber'
        ? 'var(--pg-accent-amber)'
        : 'var(--pg-accent-purple)';

  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ProjectCard({ project, selected }: { project: ProjectGalleryItem; selected: boolean }) {
  const detailHref = `/project?selected=${project.id}`;

  return (
    <article
      className={`pg-card overflow-hidden transition-colors ${
        selected ? 'border-[var(--pg-accent-purple)]/65 bg-primary/5' : 'hover:bg-muted/25'
      }`}
    >
      <div className="pg-canvas-grid h-32 border-b border-[var(--pg-border-soft)] p-4">
        <GraphPreview project={project} />
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{project.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="text-xs capitalize text-muted-foreground">
                {project.templateId.replace(/-/g, ' ')}
              </span>
            </div>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground" dateTime={project.updatedAt}>
            {formatDate(project.updatedAt)}
          </time>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{project.idea}</p>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {project.progress.done} / {project.progress.total} steps done
            </span>
            <span className="font-medium">{project.progress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--pg-accent-purple)]"
              style={{ width: `${project.progress.percent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoPill label="Executor" value={project.selectedExecutor} />
          <InfoPill label="Steps" value={String(project.stepCount)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/project/${project.id}`}
            prefetch={false}
            className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FolderOpen className="size-3.5" />
            Open
          </Link>
          <Link
            href={detailHref}
            prefetch={false}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-[var(--pg-border-soft)] px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function GraphPreview({ project }: { project: ProjectGalleryItem }) {
  const nodes = project.project?.steps.slice(0, 5) ?? [];

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--pg-border-soft)] bg-background/35 text-xs text-muted-foreground">
        Draft graph
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute left-5 right-5 top-1/2 h-px bg-[var(--pg-border-strong)]" />
      {nodes.map((step, index) => (
        <div
          key={step.id}
          className="absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--pg-border-soft)] bg-[var(--pg-surface-glass)] text-[0.68rem] font-semibold shadow-sm"
          style={{ left: `${Math.min(82, index * 18 + 4)}%` }}
          title={step.title}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
}

function ProjectDetails({ project }: { project: ProjectGalleryItem | null }) {
  if (!project) {
    return (
      <aside className="pg-panel-muted h-fit p-5">
        <h2 className="text-base font-semibold">Project details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a project to see its graph summary, current step, and template information here.
        </p>
      </aside>
    );
  }

  return (
    <aside className="pg-panel h-fit p-5 xl:sticky xl:top-20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pg-text-faint)]">
            Selected project
          </p>
          <h2 className="mt-2 truncate text-xl font-semibold">{project.name}</h2>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{project.idea}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoPill label="Progress" value={`${project.progress.percent}%`} />
        <InfoPill label="Executor" value={project.selectedExecutor} />
        <InfoPill label="Template" value={project.templateId.replace(/-/g, ' ')} />
        <InfoPill label="Updated" value={formatDate(project.updatedAt)} />
      </div>

      <div className="mt-5 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="size-4 text-[var(--pg-accent-cyan)]" />
          Current step
        </div>
        <p className="text-sm text-muted-foreground">
          {project.currentStep?.title ?? 'All planned steps are complete or no steps exist yet.'}
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Layers3 className="size-4 text-[var(--pg-accent-green)]" />
          Stack
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(project.stackPreview.length ? project.stackPreview : ['Local files', 'Markdown plan']).map((item) => (
            <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <Link
          href={`/project/${project.id}`}
          prefetch={false}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open graph workspace
        </Link>
        <Link
          href={`/project/${project.id}/memory`}
          prefetch={false}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--pg-border-soft)] px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          View memory
        </Link>
      </div>
    </aside>
  );
}

function StatusBadge({ status }: { status: ProjectGalleryItem['status'] }) {
  const styles = {
    active: 'bg-[var(--pg-accent-blue)]/15 text-[var(--pg-accent-cyan)]',
    blocked: 'bg-[var(--pg-accent-danger)]/15 text-[var(--pg-accent-danger)]',
    complete: 'bg-[var(--pg-accent-green)]/15 text-[var(--pg-accent-green)]',
    draft: 'bg-[var(--pg-accent-amber)]/15 text-[var(--pg-accent-amber)]',
  };

  return (
    <span className={`rounded-md px-2 py-1 text-[0.68rem] font-semibold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
      <p className="mt-1 truncate text-xs font-medium capitalize">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso));
}
