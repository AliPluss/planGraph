'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/lib/i18n/i18n';
import Link from 'next/link';
import {
  ArchiveRestore,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  FileCheck2,
  GitBranch,
  History,
  MemoryStick,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectGrid, { type DashboardProject } from '@/components/plangraph/dashboard/ProjectGrid';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { AuditEntry, ExecutorTool, Project, Step, StepStatus, UserProfile } from '@/core/types';

type ProjectResponse = { data?: DashboardProject[]; error?: string };
type FullProjectResponse = { data?: Project; error?: string };
type AuditResponse = { data?: AuditEntry[]; error?: string };

const EXECUTOR_LABELS: Record<ExecutorTool, string> = {
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  antigravity: 'Antigravity',
  copilot: 'Copilot',
  manual: 'Manual',
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

function relativeTime(iso?: string): string {
  if (!iso) return 'No activity yet';
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function countSteps(project: Project | null, statuses: StepStatus[]): number {
  return project?.steps.filter((step) => statuses.includes(step.status)).length ?? 0;
}

function getNextSteps(project: Project | null): Step[] {
  if (!project) return [];
  return project.executionOrder
    .map((stepId) => project.steps.find((step) => step.id === stepId))
    .filter((step): step is Step => Boolean(step))
    .filter((step) => step.status === 'in_progress' || step.status === 'ready' || step.status === 'not_started')
    .slice(0, 3);
}

function getBlockedItems(project: Project | null): Step[] {
  return project?.steps.filter((step) => ['blocked', 'failed', 'needs_review'].includes(step.status)).slice(0, 4) ?? [];
}

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [profileRes, projectsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/project'),
        ]);
        const profileJson = await profileRes.json() as { profile?: UserProfile | null };
        const projectsJson = await projectsRes.json() as ProjectResponse;

        if (cancelled) return;
        if (!profileJson.profile) {
          router.replace('/onboarding');
          return;
        }

        const nextProjects = projectsJson.data ?? [];
        setProfile(profileJson.profile);
        setDisplayName(profileJson.profile.displayName ?? '');
        setProjects(nextProjects);
        setChecking(false);

        const latestProject = nextProjects[0];
        if (!latestProject) return;

        const [fullProjectRes, auditRes] = await Promise.all([
          fetch(`/api/projects/${latestProject.id}`),
          fetch(`/api/projects/${latestProject.id}/audit`),
        ]);
        const fullProjectJson = await fullProjectRes.json() as FullProjectResponse;
        const auditJson = await auditRes.json() as AuditResponse;

        if (cancelled) return;
        setActiveProject(fullProjectJson.data ?? null);
        setAuditEntries(auditJson.data?.slice(0, 5) ?? []);
      } catch (error) {
        if (!cancelled) {
          toast.error(String(error));
          setChecking(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function saveDisplayName() {
    if (!profile || !displayName.trim()) return;
    setSavingName(true);
    try {
      const nextProfile = { ...profile, displayName: displayName.trim() };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProfile),
      });
      if (!res.ok) throw new Error('Could not save name');
      setProfile(nextProfile);
      toast.success('Name saved');
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSavingName(false);
    }
  }

  const dashboard = useMemo(() => {
    const totalSteps = projects.reduce((sum, project) => sum + project.progress.total, 0);
    const doneSteps = projects.reduce((sum, project) => sum + project.progress.done, 0);
    const activeSteps = countSteps(activeProject, ['ready', 'in_progress']);
    const blockedSteps = countSteps(activeProject, ['blocked', 'failed', 'needs_review']);
    const snapshotCount = activeProject?.steps.filter((step) => step.snapshotBefore).length ?? 0;
    const memoryCount = activeProject?.memory.length ?? 0;
    const validationIssues = activeProject?.steps.filter((step) => step.validationReport && !step.validationReport.passed).length ?? 0;

    return {
      activeSteps,
      blockedSteps,
      doneSteps,
      memoryCount,
      nextSteps: getNextSteps(activeProject),
      blockedItems: getBlockedItems(activeProject),
      snapshotCount,
      totalSteps,
      validationIssues,
    };
  }, [activeProject, projects]);

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  const isArabic = profile?.preferredLocale === 'ar';
  const greeting = profile?.displayName
    ? isArabic ? `مرحباً، ${profile.displayName}` : `Hi, ${profile.displayName}`
    : isArabic ? 'مرحباً، أيها البنّاء' : 'Hi, builder';
  const latestProject = projects[0];
  const activeProgress = latestProject?.progress.percent ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--pg-border-soft)] bg-[var(--pg-surface-glass)] px-3 py-1 text-xs text-[var(--pg-text-soft)]">
            <Sparkles className="size-3.5 text-[var(--pg-accent-cyan)]" />
            {isArabic ? 'لوحة قيادة MVP 2' : 'MVP 2 command center'}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {isArabic
              ? 'راقب المشاريع النشطة، حالة المنفذات، الذاكرة، اللقطات، والخطوة التالية من مكان واحد.'
              : 'Monitor active projects, adapters, validation, memory, snapshots, and the next executable step in one place.'}
          </p>
        </div>

        {profile && !profile.displayName && (
          <div className="flex w-full max-w-sm items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              className="h-9"
            />
            <Button size="sm" onClick={() => void saveDisplayName()} disabled={!displayName.trim() || savingName}>
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Workflow className="size-4" />} label="Projects" value={projects.length.toString()} detail={`${dashboard.doneSteps}/${dashboard.totalSteps} steps done`} accent="purple" />
        <KpiCard icon={<Clock3 className="size-4" />} label="Active steps" value={dashboard.activeSteps.toString()} detail={latestProject?.currentStep?.title ?? 'No active step'} accent="blue" />
        <KpiCard icon={<CircleAlert className="size-4" />} label="Blocked items" value={dashboard.blockedSteps.toString()} detail={dashboard.blockedSteps > 0 ? 'Needs attention' : 'No blockers in active project'} accent="amber" />
        <KpiCard icon={<ShieldCheck className="size-4" />} label="Validation" value={dashboard.validationIssues.toString()} detail={dashboard.validationIssues > 0 ? 'Open validation issues' : 'No failed reports found'} accent="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <Panel className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_17rem]">
            <div className="p-5">
              <PanelHeader className="mb-3">
                <div>
                  <PanelTitle>{isArabic ? 'المشروع النشط' : 'Active project'}</PanelTitle>
                  <PanelDescription>
                    {latestProject ? latestProject.idea : 'Create or import a project to start building a local execution graph.'}
                  </PanelDescription>
                </div>
                {latestProject && (
                  <Badge variant="cyan" className="capitalize">
                    {latestProject.templateId.replace(/-/g, ' ')}
                  </Badge>
                )}
              </PanelHeader>

              {latestProject ? (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{latestProject.name}</span>
                      <span className="text-muted-foreground">{activeProgress}%</span>
                    </div>
                    <Progress value={activeProgress} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {latestProject.progress.done} of {latestProject.progress.total} steps completed · updated {relativeTime(latestProject.updatedAt)}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Snapshots" value={dashboard.snapshotCount.toString()} />
                    <MiniStat label="Memory entries" value={dashboard.memoryCount.toString()} />
                    <MiniStat label="Executor" value={EXECUTOR_LABELS[latestProject.selectedExecutor]} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/project/${latestProject.id}`}
                      prefetch={false}
                      className={buttonVariants({ size: 'sm' })}
                    >
                      Open workspace
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href={`/project/${latestProject.id}/dashboard`}
                      prefetch={false}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      Project dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyPanel text="No active project yet. Start from discovery or import a local folder." />
              )}
            </div>

            <div className="border-t border-[var(--pg-border-soft)] bg-[var(--pg-surface-1)] p-5 lg:border-s lg:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">Adapter status</p>
              <div className="mt-4 space-y-3">
                {(profile?.tools.length ? profile.tools : ['manual' as ExecutorTool]).map((tool) => (
                  <div key={tool} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Bot className="size-4 text-[var(--pg-accent-cyan)]" />
                      <span className="truncate text-sm font-medium">{EXECUTOR_LABELS[tool]}</span>
                    </div>
                    <Badge variant={tool === latestProject?.selectedExecutor ? 'green' : 'outline'}>
                      {tool === latestProject?.selectedExecutor ? 'Active' : 'Ready'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'ملخص الحالة' : 'System summary'}</PanelTitle>
              <PanelDescription>Validation, snapshots, and memory are local project records.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <SummaryRow icon={<FileCheck2 className="size-4" />} label="Validation" value={dashboard.validationIssues > 0 ? `${dashboard.validationIssues} issue(s)` : 'Clean'} tone={dashboard.validationIssues > 0 ? 'amber' : 'green'} />
            <SummaryRow icon={<GitBranch className="size-4" />} label="Snapshots" value={`${dashboard.snapshotCount} captured`} tone="blue" />
            <SummaryRow icon={<MemoryStick className="size-4" />} label="Memory" value={`${dashboard.memoryCount} entries`} tone="cyan" />
            <SummaryRow icon={<Database className="size-4" />} label="Storage" value="Local workspace" tone="purple" />
          </PanelContent>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'الخطوات التالية' : 'Next steps'}</PanelTitle>
              <PanelDescription>Ready work from the active execution order.</PanelDescription>
            </div>
          </PanelHeader>
          <StepList steps={dashboard.nextSteps} empty="No pending steps in the active project." />
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'العناصر المتوقفة' : 'Blocked items'}</PanelTitle>
              <PanelDescription>Failed, blocked, or needs-review steps.</PanelDescription>
            </div>
          </PanelHeader>
          <StepList steps={dashboard.blockedItems} empty="No blocked items found." />
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'إجراءات سريعة' : 'Quick actions'}</PanelTitle>
              <PanelDescription>Start or recover local planning work.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <QuickAction href="/discovery" icon={<Plus className="size-4" />} title="New project" description="Create a fresh plan from an idea." />
            <QuickAction href="/import" icon={<ArchiveRestore className="size-4" />} title="Import existing" description="Scan a local folder and plan remaining work." />
            <QuickAction href="/project" icon={<Workflow className="size-4" />} title="Project gallery" description="Browse existing projects and templates." />
          </PanelContent>
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>{isArabic ? 'النشاط الأخير' : 'Recent activity'}</PanelTitle>
            <PanelDescription>Latest audit records from the active project.</PanelDescription>
          </div>
          <History className="size-4 text-muted-foreground" />
        </PanelHeader>
        {auditEntries.length > 0 ? (
          <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {auditEntries.map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`} className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
                <p className="line-clamp-1 text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{relativeTime(entry.timestamp)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyPanel text="No recent activity yet." />
        )}
      </Panel>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Projects
        </h2>
        <ProjectGrid />
      </div>
    </div>
  );
}

function KpiCard({
  accent,
  detail,
  icon,
  label,
  value,
}: {
  accent: 'amber' | 'blue' | 'green' | 'purple';
  detail: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const accentClass = {
    amber: 'text-[var(--pg-accent-amber)] bg-[var(--pg-accent-amber)]/12',
    blue: 'text-[var(--pg-accent-blue)] bg-[var(--pg-accent-blue)]/12',
    green: 'text-[var(--pg-accent-green)] bg-[var(--pg-accent-green)]/12',
    purple: 'text-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/12',
  }[accent];

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${accentClass}`}>
          {icon}
        </span>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'amber' | 'blue' | 'cyan' | 'green' | 'purple';
  value: string;
}) {
  const toneClass = {
    amber: 'text-[var(--pg-accent-amber)]',
    blue: 'text-[var(--pg-accent-blue)]',
    cyan: 'text-[var(--pg-accent-cyan)]',
    green: 'text-[var(--pg-accent-green)]',
    purple: 'text-[var(--pg-accent-purple)]',
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className={toneClass}>{icon}</span>
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function StepList({ empty, steps }: { empty: string; steps: Step[] }) {
  if (steps.length === 0) return <EmptyPanel text={empty} />;

  return (
    <PanelContent>
      {steps.map((step) => (
        <div key={step.id} className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-sm font-medium">{step.title}</p>
            <Badge variant={step.status === 'blocked' || step.status === 'failed' ? 'destructive' : 'outline'} className="shrink-0">
              {STATUS_LABELS[step.status]}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{step.goal}</p>
        </div>
      ))}
    </PanelContent>
  );
}

function QuickAction({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--pg-border-soft)] bg-background/25 p-4 text-sm text-muted-foreground">
      <CheckCircle2 className="mb-2 size-4 text-[var(--pg-accent-green)]" />
      {text}
    </div>
  );
}
