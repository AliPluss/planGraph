import * as fs from 'fs/promises';
import * as path from 'path';
import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Code2,
  FileText,
  ListChecks,
  Play,
  ScrollText,
  SquareTerminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { getCurrentStep, getProgress } from '@/core/analytics/project-analytics';
import { storage } from '@/core/storage/storage';
import { getReportsDir } from '@/core/storage/paths';
import type { ExecutorTool, Project, ProjectMeta, Step, StepStatus } from '@/core/types';

type SearchParams = Promise<{
  project?: string;
  step?: string;
}>;

type ExecutionProject = {
  meta: ProjectMeta;
  project: Project;
  currentStep: Step | null;
  progress: { done: number; total: number; percent: number };
};

const STATUS_LABELS: Record<StepStatus, string> = {
  not_started: 'Not started',
  ready: 'Ready',
  in_progress: 'In progress',
  done: 'Done',
  failed: 'Failed',
  needs_review: 'Needs review',
  blocked: 'Blocked',
};

const EXECUTOR_LABELS: Record<ExecutorTool, string> = {
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  antigravity: 'Antigravity',
  copilot: 'Copilot',
  manual: 'Manual',
};

const EXECUTORS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    detail: 'Writes .plangraph/PROMPT.md and can use the existing local Claude Code adapter.',
    icon: SquareTerminal,
    tone: 'purple',
  },
  {
    id: 'codex',
    name: 'Codex',
    detail: 'Use the generated prompt/report files with your local Codex workflow.',
    icon: Code2,
    tone: 'cyan',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    detail: 'Prepares Cursor context files and the active PlanGraph prompt.',
    icon: Bot,
    tone: 'blue',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    detail: 'Uses the active prompt file and PlanGraph skill handoff.',
    icon: Play,
    tone: 'green',
  },
] as const;

export default async function ExecutionCenterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const projects = await getExecutionProjects();
  const selectedProject =
    projects.find((item) => item.meta.id === params.project) ??
    projects[0] ??
    null;
  const selectedStep =
    selectedProject?.project.steps.find((step) => step.id === params.step) ??
    selectedProject?.currentStep ??
    selectedProject?.project.steps[0] ??
    null;
  const queue = selectedProject ? getExecutionQueue(selectedProject.project) : [];
  const prompt = selectedProject && selectedStep ? getPrompt(selectedStep, selectedProject.meta.selectedExecutor) : '';
  const reportPreview = selectedProject && selectedStep
    ? await readReportPreview(selectedProject.meta.id, selectedStep)
    : null;
  const tokenEstimate = estimateTokens(prompt);
  const activeExecutor = selectedProject?.meta.selectedExecutor ?? 'manual';

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="pg-panel overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_24rem]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pg-text-faint)]">
              Execution Center V2
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Step-by-step execution management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage the local execution queue, inspect the active prompt, and track report output without changing the existing graph runtime.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProject && (
                <Link
                  href={`/project/${selectedProject.meta.id}`}
                  prefetch={false}
                  className={buttonVariants({ size: 'sm' })}
                >
                  Open graph workspace
                </Link>
              )}
              <Link href="/project" prefetch={false} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Project gallery
              </Link>
            </div>
          </div>

          <Panel tone="muted" className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">Active project</p>
            {selectedProject ? (
              <div className="mt-3 space-y-4">
                <div>
                  <h2 className="line-clamp-1 text-lg font-semibold">{selectedProject.meta.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{selectedProject.meta.idea}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{selectedProject.progress.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[var(--pg-accent-purple)]"
                      style={{ width: `${selectedProject.progress.percent}%` }}
                    />
                  </div>
                </div>
                <ProjectSwitcher projects={projects} selectedProjectId={selectedProject.meta.id} />
              </div>
            ) : (
              <EmptyState text="No local projects found. Create or import a project before managing execution." />
            )}
          </Panel>
        </div>
      </section>

      {selectedProject && selectedStep ? (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            {EXECUTORS.map((executor) => (
              <ExecutorCard
                key={executor.id}
                executor={executor}
                active={executor.id === activeExecutor}
                selectedProjectId={selectedProject.meta.id}
              />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[21rem_1fr_21rem]">
            <Panel className="h-fit p-0 xl:sticky xl:top-20">
              <div className="border-b border-[var(--pg-border-soft)] p-4">
                <PanelTitle>Execution queue</PanelTitle>
                <PanelDescription>Ordered from the project graph execution plan.</PanelDescription>
              </div>
              <div className="max-h-[42rem] overflow-y-auto p-2">
                {queue.map((step, index) => (
                  <QueueItem
                    key={step.id}
                    step={step}
                    index={index}
                    selected={step.id === selectedStep.id}
                    projectId={selectedProject.meta.id}
                  />
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>{selectedStep.title}</PanelTitle>
                  <PanelDescription>{selectedStep.goal}</PanelDescription>
                </div>
                <Badge variant={statusVariant(selectedStep.status)}>{STATUS_LABELS[selectedStep.status]}</Badge>
              </PanelHeader>
              <PanelContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Executor" value={EXECUTOR_LABELS[activeExecutor]} />
                  <Metric label="Token estimate" value={`~${tokenEstimate.toLocaleString()} tokens`} />
                  <Metric label="Report file" value={selectedStep.reportFile ?? `reports/${selectedStep.id}_report.md`} />
                </div>

                <PreviewBlock
                  icon={<FileText className="size-4" />}
                  title="Prompt preview"
                  detail="Generated from the selected executor prompt."
                  content={prompt || 'No prompt has been generated for this step yet.'}
                />

                <PreviewBlock
                  icon={<ScrollText className="size-4" />}
                  title="Report preview"
                  detail={reportPreview?.path ?? 'Expected report output'}
                  content={reportPreview?.content ?? 'No report has been written for this step yet.'}
                />
              </PanelContent>
            </Panel>

            <aside className="space-y-4">
              <Panel>
                <PanelHeader>
                  <div>
                    <PanelTitle>Selected step</PanelTitle>
                    <PanelDescription>Execution readiness and local handoff files.</PanelDescription>
                  </div>
                </PanelHeader>
                <PanelContent>
                  <InfoRow label="Step id" value={selectedStep.id} />
                  <InfoRow label="Markdown" value={selectedStep.mdFile} />
                  <InfoRow label="Dependencies" value={selectedStep.dependsOn.length ? selectedStep.dependsOn.join(', ') : 'None'} />
                  <InfoRow label="Protected files" value={selectedStep.protectedFiles.length ? selectedStep.protectedFiles.length.toString() : 'None'} />
                </PanelContent>
              </Panel>

              <Panel>
                <PanelHeader>
                  <div>
                    <PanelTitle>Logs</PanelTitle>
                    <PanelDescription>Local execution telemetry captured on the step.</PanelDescription>
                  </div>
                  <ListChecks className="size-4 text-muted-foreground" />
                </PanelHeader>
                {selectedStep.executionLog ? (
                  <PanelContent>
                    <LogLine label="Duration" value={`${selectedStep.executionLog.durationMs}ms`} />
                    <LogLine
                      label="Tokens"
                      value={selectedStep.executionLog.tokens
                        ? `${selectedStep.executionLog.tokens.input} in / ${selectedStep.executionLog.tokens.output} out`
                        : 'Not recorded'}
                    />
                    <LogLine
                      label="Cost"
                      value={selectedStep.executionLog.costUsd === undefined
                        ? 'Not recorded'
                        : `$${selectedStep.executionLog.costUsd.toFixed(4)}`}
                    />
                  </PanelContent>
                ) : (
                  <EmptyState text="No execution log has been captured for this step yet." />
                )}
              </Panel>
            </aside>
          </section>
        </>
      ) : (
        <Panel>
          <EmptyState text="No executable step is available yet." />
        </Panel>
      )}
    </main>
  );
}

async function getExecutionProjects(): Promise<ExecutionProject[]> {
  const metas = await storage.listProjects();
  const projects = await Promise.all(
    metas.map(async (meta) => {
      const project = await storage.readProject(meta.id);
      if (!project) return null;
      return {
        meta,
        project,
        currentStep: getCurrentStep(project),
        progress: getProgress(project),
      };
    }),
  );

  return projects
    .filter((project): project is ExecutionProject => Boolean(project))
    .sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt));
}

function getExecutionQueue(project: Project): Step[] {
  const ordered = project.executionOrder
    .map((stepId) => project.steps.find((step) => step.id === stepId))
    .filter((step): step is Step => Boolean(step));
  const extras = project.steps.filter((step) => !project.executionOrder.includes(step.id));
  return [...ordered, ...extras];
}

function getPrompt(step: Step, executor: ExecutorTool): string {
  const key = executor === 'claude-code' ? 'claudeCode' : executor;
  return step.prompts[key as keyof Step['prompts']] ?? step.prompts.manual;
}

function estimateTokens(prompt: string): number {
  return Math.max(0, Math.ceil(prompt.trim().length / 4));
}

async function readReportPreview(projectId: string, step: Step): Promise<{ path: string; content: string } | null> {
  const reportFile = step.reportFile ?? `${step.id}_report.md`;
  const reportPath = path.join(getReportsDir(projectId), path.basename(reportFile));

  try {
    const content = await fs.readFile(reportPath, 'utf8');
    return {
      path: `reports/${path.basename(reportPath)}`,
      content: content.slice(0, 2000),
    };
  } catch {
    return null;
  }
}

function ProjectSwitcher({
  projects,
  selectedProjectId,
}: {
  projects: ExecutionProject[];
  selectedProjectId: string;
}) {
  if (projects.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">Switch project</p>
      <div className="grid gap-2">
        {projects.slice(0, 4).map((item) => (
          <Link
            key={item.meta.id}
            href={`/execution?project=${item.meta.id}`}
            prefetch={false}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted ${
              item.meta.id === selectedProjectId
                ? 'border-[var(--pg-accent-purple)] bg-primary/10'
                : 'border-[var(--pg-border-soft)] bg-background/35'
            }`}
          >
            <span className="block truncate font-medium">{item.meta.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {item.progress.done}/{item.progress.total} steps done
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ExecutorCard({
  active,
  executor,
  selectedProjectId,
}: {
  active: boolean;
  executor: (typeof EXECUTORS)[number];
  selectedProjectId: string;
}) {
  const Icon = executor.icon;
  const toneClass = {
    blue: 'text-[var(--pg-accent-blue)] bg-[var(--pg-accent-blue)]/12',
    cyan: 'text-[var(--pg-accent-cyan)] bg-[var(--pg-accent-cyan)]/12',
    green: 'text-[var(--pg-accent-green)] bg-[var(--pg-accent-green)]/12',
    purple: 'text-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/12',
  }[executor.tone];

  return (
    <article className={`pg-card p-4 ${active ? 'border-[var(--pg-accent-purple)]/65 bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="size-4" />
        </span>
        <Badge variant={active ? 'green' : 'outline'}>{active ? 'Selected' : 'Available'}</Badge>
      </div>
      <h2 className="mt-3 text-sm font-semibold">{executor.name}</h2>
      <p className="mt-2 min-h-12 text-xs leading-5 text-muted-foreground">{executor.detail}</p>
      <Link
        href={`/project/${selectedProjectId}`}
        prefetch={false}
        className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg border border-[var(--pg-border-soft)] text-xs font-medium transition-colors hover:bg-muted"
      >
        Prepare in workspace
      </Link>
    </article>
  );
}

function QueueItem({
  index,
  projectId,
  selected,
  step,
}: {
  index: number;
  projectId: string;
  selected: boolean;
  step: Step;
}) {
  return (
    <Link
      href={`/execution?project=${projectId}&step=${step.id}`}
      prefetch={false}
      className={`mb-2 block rounded-lg border p-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? 'border-[var(--pg-accent-purple)] bg-primary/10' : 'border-[var(--pg-border-soft)] bg-background/35'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium">{step.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(step.status)}>{STATUS_LABELS[step.status]}</Badge>
            <span className="text-xs capitalize text-muted-foreground">{step.type}</span>
          </span>
        </span>
      </div>
    </Link>
  );
}

function PreviewBlock({
  content,
  detail,
  icon,
  title,
}: {
  content: string;
  detail: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--pg-border-soft)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[var(--pg-accent-cyan)]">{icon}</span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="truncate text-xs text-muted-foreground">{detail}</p>
          </div>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-4 py-3 text-xs leading-5 text-muted-foreground">
        {content}
      </pre>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
      <p className="mt-1 truncate text-xs font-medium">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
      <p className="mt-1 break-words text-xs text-muted-foreground">{value}</p>
    </div>
  );
}

function LogLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--pg-border-soft)] bg-background/25 p-4 text-sm text-muted-foreground">
      <CheckCircle2 className="mb-2 size-4 text-[var(--pg-accent-green)]" />
      {text}
    </div>
  );
}

function statusVariant(status: StepStatus): 'amber' | 'blue' | 'destructive' | 'green' | 'outline' {
  if (status === 'done') return 'green';
  if (status === 'in_progress' || status === 'ready') return 'blue';
  if (status === 'blocked' || status === 'failed') return 'destructive';
  if (status === 'needs_review') return 'amber';
  return 'outline';
}
