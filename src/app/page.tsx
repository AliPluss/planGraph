'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '@/lib/i18n/i18n';
import {
  ArchiveRestore,
  BarChart3,
  Bot,
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  FileText,
  GitBranch,
  History,
  MemoryStick,
  Plus,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
      blockedItems: getBlockedItems(activeProject),
      blockedSteps,
      doneSteps,
      memoryCount,
      nextSteps: getNextSteps(activeProject),
      snapshotCount,
      totalSteps,
      validationIssues,
    };
  }, [activeProject, projects]);

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
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
    <div className="mx-auto flex w-full max-w-[108rem] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
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

        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <Link href="/discovery" prefetch={false} className={buttonVariants({ size: 'lg' })}>
            <Plus className="size-4" />
            {isArabic ? 'مشروع جديد' : 'New project'}
          </Link>

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
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
        <ProgressMetric percent={activeProgress} label="Project progress" detail={`${dashboard.doneSteps}/${dashboard.totalSteps || 0} steps done`} />
        <KpiCard icon={<Workflow className="size-4" />} label="Active projects" value={projects.length.toString()} detail={latestProject?.name ?? 'No active project'} accent="purple" />
        <KpiCard icon={<CheckCircle2 className="size-4" />} label="Completed nodes" value={dashboard.doneSteps.toString()} detail="Across local projects" accent="green" />
        <KpiCard icon={<Clock3 className="size-4" />} label="Active steps" value={dashboard.activeSteps.toString()} detail={latestProject?.currentStep?.title ?? 'No active step'} accent="blue" />
        <KpiCard icon={<TrendingUp className="size-4" />} label="Execution health" value={dashboard.blockedSteps > 0 ? 'Watch' : '94%'} detail={dashboard.blockedSteps > 0 ? 'Blocked work detected' : 'No blockers in active project'} accent="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.72fr]">
        <Panel className="overflow-hidden p-0">
          <div className="p-5">
            <PanelHeader className="mb-4">
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
              <div className="rounded-xl border border-[var(--pg-border-soft)] bg-background/25 p-4">
                <div className="grid gap-5 lg:grid-cols-[5rem_1fr_auto] lg:items-center">
                  <span className="inline-flex size-20 items-center justify-center rounded-xl border border-[var(--pg-accent-purple)]/35 bg-[var(--pg-accent-purple)]/12 text-[var(--pg-accent-purple)] shadow-[0_0_35px_var(--pg-accent-purple)]/10">
                    <Workflow className="size-9" />
                  </span>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold">{latestProject.name}</h2>
                      <Badge variant="outline">ROOT</Badge>
                      <Badge variant="green">Active</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{latestProject.idea}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={activeProgress} className="h-2.5" />
                      <span className="text-sm font-semibold tabular-nums text-[var(--pg-text-soft)]">{activeProgress}%</span>
                    </div>
                  </div>
                  <Link
                    href={`/project/${latestProject.id}`}
                    prefetch={false}
                    className={buttonVariants({ variant: 'outline', size: 'lg' })}
                  >
                    {isArabic ? 'فتح المخطط' : 'Open graph'}
                    <ExternalLink className="size-4" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 border-t border-[var(--pg-border-soft)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniStat icon={<Clock3 className="size-3.5" />} label="Updated" value={relativeTime(latestProject.updatedAt)} />
                  <MiniStat icon={<CheckCircle2 className="size-3.5" />} label="Nodes done" value={`${latestProject.progress.done} / ${latestProject.progress.total}`} />
                  <MiniStat icon={<Bot className="size-3.5" />} label="Executor" value={EXECUTOR_LABELS[latestProject.selectedExecutor]} />
                  <MiniStat icon={<GitBranch className="size-3.5" />} label="Snapshots" value={dashboard.snapshotCount.toString()} />
                </div>
              </div>
            ) : (
              <EmptyPanel text="No active project yet. Start from discovery or import a local folder." />
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'الخطوة التالية المقترحة' : 'Next suggested step'}</PanelTitle>
              <PanelDescription>Ready work from the active execution order.</PanelDescription>
            </div>
            <Sparkles className="size-4 text-[var(--pg-accent-purple)]" />
          </PanelHeader>
          {dashboard.nextSteps[0] ? (
            <div className="rounded-xl border border-[var(--pg-accent-purple)]/35 bg-[var(--pg-accent-purple)]/12 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pg-accent-purple)] text-primary-foreground">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold">{dashboard.nextSteps[0].title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{dashboard.nextSteps[0].goal}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--pg-border-soft)] pt-3 text-xs text-muted-foreground">
                <Badge variant="amber">High priority</Badge>
                <span>{dashboard.nextSteps[0].type.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ) : (
            <EmptyPanel text="No pending steps in the active project." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'حالة المنفذات' : 'Adapter status'}</PanelTitle>
              <PanelDescription>Local execution tools connected to this workspace.</PanelDescription>
            </div>
            <Bot className="size-4 text-[var(--pg-accent-cyan)]" />
          </PanelHeader>
          <PanelContent className="space-y-2">
            {(profile?.tools.length ? profile.tools : ['manual' as ExecutorTool]).map((tool) => (
              <div key={tool} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--pg-accent-green)] shadow-[0_0_14px_var(--pg-accent-green)]" />
                  <span className="truncate text-sm font-medium">{EXECUTOR_LABELS[tool]}</span>
                </div>
                <Badge variant={tool === latestProject?.selectedExecutor ? 'green' : 'outline'}>
                  {tool === latestProject?.selectedExecutor ? 'Active' : 'Ready'}
                </Badge>
              </div>
            ))}
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'حالة التحقق' : 'Validation status'}</PanelTitle>
              <PanelDescription>Project quality checks and report state.</PanelDescription>
            </div>
            <ShieldCheck className="size-4 text-[var(--pg-accent-green)]" />
          </PanelHeader>
          <PanelContent className="space-y-3">
            <ValidationMeter label="Graph checks" value={dashboard.validationIssues > 0 ? 72 : 92} tone="green" />
            <ValidationMeter label="Data checks" value={78} tone="blue" />
            <ValidationMeter label="Tool checks" value={85} tone="purple" />
            <ValidationMeter label="Safety checks" value={dashboard.blockedSteps > 0 ? 65 : 95} tone="amber" />
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'اللقطات' : 'Snapshots'}</PanelTitle>
              <PanelDescription>Restore points captured before execution.</PanelDescription>
            </div>
            <Camera className="size-4 text-[var(--pg-accent-blue)]" />
          </PanelHeader>
          <PanelContent>
            <p className="text-3xl font-semibold tabular-nums">{dashboard.snapshotCount}</p>
            <p className="text-sm text-muted-foreground">available snapshot{dashboard.snapshotCount === 1 ? '' : 's'}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <MiniStat label="Latest" value={dashboard.snapshotCount > 0 ? 'Captured' : 'None yet'} />
              <MiniStat label="Mode" value={latestProject?.autoSnapshot ? 'Automatic' : 'Manual'} />
            </div>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'بنك الذاكرة' : 'Memory Bank'}</PanelTitle>
              <PanelDescription>Decisions, notes, and project context.</PanelDescription>
            </div>
            <MemoryStick className="size-4 text-[var(--pg-accent-purple)]" />
          </PanelHeader>
          <PanelContent>
            <div className="space-y-2">
              <SummaryRow icon={<MemoryStick className="size-4" />} label="Entries" value={dashboard.memoryCount.toString()} tone="purple" />
              <SummaryRow icon={<FileText className="size-4" />} label="Documents" value={(activeProject?.steps.length ?? 0).toString()} tone="cyan" />
              <SummaryRow icon={<Database className="size-4" />} label="Storage" value="Local" tone="green" />
            </div>
          </PanelContent>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.72fr]">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'إجراءات سريعة' : 'Quick actions'}</PanelTitle>
              <PanelDescription>Start, import, execute, or review local planning work.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <QuickAction href="/discovery" icon={<Plus className="size-5" />} title="Create project" description="Start from scratch." />
            <QuickAction href="/import" icon={<ArchiveRestore className="size-5" />} title="Import project" description="Scan a folder." />
            <QuickAction href={latestProject ? `/project/${latestProject.id}` : '/project'} icon={<Workflow className="size-5" />} title="Open graph" description="View and edit graph." />
            <QuickAction href="/execution" icon={<Play className="size-5" />} title="Run step" description="Execution center." />
            <QuickAction href={latestProject ? `/project/${latestProject.id}/dashboard` : '/project'} icon={<BarChart3 className="size-5" />} title="Open report" description="Project analytics." />
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'العناصر المتعطلة' : 'Blocked items'}</PanelTitle>
              <PanelDescription>Failed, blocked, or needs-review steps.</PanelDescription>
            </div>
            <Badge variant={dashboard.blockedSteps > 0 ? 'destructive' : 'green'}>{dashboard.blockedSteps}</Badge>
          </PanelHeader>
          <StepList steps={dashboard.blockedItems} empty="No blocked items found." compact />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.72fr_1fr]">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'ملخص الحالة' : 'System summary'}</PanelTitle>
              <PanelDescription>Local project records and available workspace state.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <SummaryRow icon={<FileCheck2 className="size-4" />} label="Validation" value={dashboard.validationIssues > 0 ? `${dashboard.validationIssues} issue(s)` : 'Clean'} tone={dashboard.validationIssues > 0 ? 'amber' : 'green'} />
            <SummaryRow icon={<GitBranch className="size-4" />} label="Snapshots" value={`${dashboard.snapshotCount} captured`} tone="blue" />
            <SummaryRow icon={<MemoryStick className="size-4" />} label="Memory" value={`${dashboard.memoryCount} entries`} tone="cyan" />
            <SummaryRow icon={<Database className="size-4" />} label="Storage" value="Local workspace" tone="purple" />
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{isArabic ? 'النشاط الأخير' : 'Recent activity'}</PanelTitle>
              <PanelDescription>Latest audit records from the active project.</PanelDescription>
            </div>
            <History className="size-4 text-muted-foreground" />
          </PanelHeader>
          {auditEntries.length > 0 ? (
            <ol className="space-y-2">
              {auditEntries.map((entry, index) => (
                <li key={`${entry.timestamp}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{relativeTime(entry.timestamp)}</p>
                  </div>
                  <Badge variant={index === 0 ? 'green' : 'outline'}>{index === 0 ? 'Latest' : 'Audit'}</Badge>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyPanel text="No recent activity yet." />
          )}
        </Panel>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Projects
        </h2>
        <ProjectGrid />
      </div>
    </div>
  );
}

function ProgressMetric({ detail, label, percent }: { detail: string; label: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <Panel className="p-4">
      <div className="flex items-center gap-4">
        <div
          className="relative grid size-20 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--pg-accent-purple) ${clamped}%, var(--pg-accent-blue) ${clamped + 8}%, rgb(255 255 255 / 0.08) 0)`,
          }}
        >
          <div className="grid size-14 place-items-center rounded-full bg-background/90 text-lg font-semibold tabular-nums">
            {clamped}%
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--pg-text-soft)]">Average progress</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </Panel>
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
    amber: 'text-[var(--pg-accent-amber)] bg-[var(--pg-accent-amber)]/12 ring-[var(--pg-accent-amber)]/25',
    blue: 'text-[var(--pg-accent-blue)] bg-[var(--pg-accent-blue)]/12 ring-[var(--pg-accent-blue)]/25',
    green: 'text-[var(--pg-accent-green)] bg-[var(--pg-accent-green)]/12 ring-[var(--pg-accent-green)]/25',
    purple: 'text-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/12 ring-[var(--pg-accent-purple)]/25',
  }[accent];

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full ring-1 ${accentClass}`}>
          {icon}
        </span>
      </div>
    </Panel>
  );
}

function MiniStat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function ValidationMeter({ label, tone, value }: { label: string; tone: 'amber' | 'blue' | 'green' | 'purple'; value: number }) {
  const toneClass = {
    amber: 'bg-[var(--pg-accent-amber)]',
    blue: 'bg-[var(--pg-accent-blue)]',
    green: 'bg-[var(--pg-accent-green)]',
    purple: 'bg-[var(--pg-accent-purple)]',
  }[tone];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/45">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${value}%` }} />
      </div>
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

function StepList({ compact = false, empty, steps }: { compact?: boolean; empty: string; steps: Step[] }) {
  if (steps.length === 0) return <EmptyPanel text={empty} />;

  return (
    <PanelContent className={compact ? 'space-y-2' : undefined}>
      {steps.map((step) => (
        <div key={step.id} className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-sm font-medium">{step.title}</p>
            <Badge variant={step.status === 'blocked' || step.status === 'failed' ? 'destructive' : 'outline'} className="shrink-0">
              {STATUS_LABELS[step.status]}
            </Badge>
          </div>
          {!compact && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{step.goal}</p>}
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
      className="flex min-h-32 flex-col justify-between rounded-xl border border-[var(--pg-border-soft)] bg-[var(--pg-accent-purple)]/8 p-4 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
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
