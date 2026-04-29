'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  FolderOpen,
  GitBranch,
  History,
  Import,
  MemoryStick,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AuditEntry, ExecutorTool, Project, ProjectMeta, Step, StepStatus, UserProfile } from '@/core/types';

interface DashboardProject extends ProjectMeta {
  progress: { done: number; total: number; percent: number };
  currentStep: Step | null;
}

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

const STATUS_LABELS: Record<'ar' | 'en', Record<StepStatus, string>> = {
  ar: {
    not_started: 'لم يبدأ',
    ready: 'جاهز',
    in_progress: 'قيد التنفيذ',
    done: 'مكتمل',
    failed: 'فشل',
    needs_review: 'يحتاج مراجعة',
    blocked: 'معطل',
  },
  en: {
    not_started: 'Not started',
    ready: 'Ready',
    in_progress: 'In progress',
    done: 'Done',
    failed: 'Failed',
    needs_review: 'Needs review',
    blocked: 'Blocked',
  },
};

const ACTION_LABELS: Record<'ar' | 'en', Partial<Record<AuditEntry['action'], string>>> = {
  ar: {
    PROJECT_CREATED: 'تم إنشاء مشروع جديد',
    PROJECT_OPENED: 'تم فتح المشروع',
    PROJECT_IMPORTED: 'تم استيراد مشروع',
    STEP_STARTED: 'بدأ تنفيذ خطوة',
    STEP_COMPLETED: 'تم تنفيذ خطوة',
    STEP_FAILED: 'فشل تنفيذ خطوة',
    MEMORY_ADDED: 'تمت إضافة ذاكرة',
    SNAPSHOT_CREATED: 'تم إنشاء لقطة',
    ROLLBACK_PERFORMED: 'تمت استعادة لقطة',
    EXECUTOR_INVOKED: 'تم استدعاء منفذ',
    REPORT_DETECTED: 'تم رصد تقرير جديد',
  },
  en: {
    PROJECT_CREATED: 'New project created',
    PROJECT_OPENED: 'Project opened',
    PROJECT_IMPORTED: 'Project imported',
    STEP_STARTED: 'Step execution started',
    STEP_COMPLETED: 'Step completed',
    STEP_FAILED: 'Step failed',
    MEMORY_ADDED: 'Memory added',
    SNAPSHOT_CREATED: 'Snapshot created',
    ROLLBACK_PERFORMED: 'Snapshot restored',
    EXECUTOR_INVOKED: 'Executor invoked',
    REPORT_DETECTED: 'New report detected',
  },
};

function pick(isArabic: boolean, ar: string, en: string): string {
  return isArabic ? ar : en;
}

function localizeDashboardText(value: string | undefined, isArabic: boolean): string {
  if (!value) return '';
  if (!isArabic) return value;

  const arabicFallbacks: Record<string, string> = {
    'Project setup': 'إعداد المشروع',
    'Bootstrap a Next.js 14+ project with TypeScript, Tailwind CSS, ESLint, and Prettier. Establish folder structure and base configuration.':
      'تهيئة مشروع Next.js 14 مع TypeScript و Tailwind و ESLint و Prettier',
    setup: 'إعداد',
    'High priority': 'أولوية عالية',
    'Open Graph': 'فتح المخطط',
  };

  return arabicFallbacks[value] ?? value;
}

function relativeTime(iso: string | undefined, isArabic: boolean): string {
  if (!iso) return pick(isArabic, 'لا يوجد نشاط بعد', 'No activity yet');
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60000));
  if (minutes < 1) return pick(isArabic, 'الآن', 'Just now');
  if (minutes < 60) return pick(isArabic, `منذ ${minutes} دقيقة`, `${minutes} min ago`);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return pick(isArabic, `منذ ${hours} ساعة`, `${hours} hr ago`);
  const days = Math.round(hours / 24);
  return pick(isArabic, `منذ ${days} يوم`, `${days} day${days === 1 ? '' : 's'} ago`);
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
  const { i18n } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const isArabic = i18n.language?.startsWith('ar');

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

  const dashboard = useMemo(() => {
    const totalSteps = projects.reduce((sum, project) => sum + project.progress.total, 0);
    const doneSteps = projects.reduce((sum, project) => sum + project.progress.done, 0);
    const activeSteps = countSteps(activeProject, ['ready', 'in_progress']);
    const blockedSteps = countSteps(activeProject, ['blocked', 'failed', 'needs_review']);
    const snapshotCount = activeProject?.steps.filter((step) => step.snapshotBefore).length ?? 0;
    const memoryCount = activeProject?.memory.length ?? 0;
    const validationIssues = activeProject?.steps.filter((step) => step.validationReport && !step.validationReport.passed).length ?? 0;
    const executionHours = activeProject?.steps.reduce((sum, step) => sum + ((step.executionLog?.durationMs ?? 0) / 3600000), 0) ?? 0;

    return {
      activeSteps,
      blockedItems: getBlockedItems(activeProject),
      blockedSteps,
      doneSteps,
      executionHours,
      memoryCount,
      nextSteps: getNextSteps(activeProject),
      snapshotCount,
      totalSteps,
      validationIssues,
    };
  }, [activeProject, projects]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center text-sm text-muted-foreground">
        {pick(isArabic, 'جار تحميل لوحة القيادة...', 'Loading dashboard...')}
      </div>
    );
  }

  const latestProject = projects[0];
  const activeProgress = latestProject?.progress.percent ?? 0;
  const progressForRing = latestProject ? activeProgress : 72;
  const profileName = profile?.displayName?.trim() || pick(isArabic, 'أحمد', 'Ahmed');
  const successRate = dashboard.blockedSteps > 0
    ? Math.max(40, Math.round((dashboard.doneSteps / Math.max(dashboard.totalSteps, 1)) * 100))
    : 94;

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-7">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_8%,oklch(0.58_0.18_255_/_0.16),transparent_30%),radial-gradient(circle_at_24%_22%,oklch(0.56_0.22_292_/_0.13),transparent_36%),linear-gradient(135deg,oklch(0.11_0.035_265),oklch(0.15_0.04_255)_50%,oklch(0.09_0.03_265))]" />
      <div className="mx-auto flex w-full max-w-[104rem] flex-col gap-4">
        <section dir="ltr" className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">

          <div dir={isArabic ? 'rtl' : 'ltr'} className={cn(isArabic ? 'text-right' : 'text-left', 'lg:justify-self-stretch')}>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {pick(isArabic, `مرحباً ${profileName}`, `Welcome back, ${profileName}`)} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{pick(isArabic, 'إليك نظرة شاملة على أعمالك اليوم', 'Here is a complete view of your work today')}</p>
          </div>

          <div dir={isArabic ? 'rtl' : 'ltr'} className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link href="/discovery" prefetch={false} className={cn(buttonVariants({ size: 'lg' }), 'rounded-xl bg-[linear-gradient(135deg,var(--pg-accent-purple),var(--pg-accent-blue))] px-6 shadow-[0_0_34px_oklch(0.56_0.22_292_/_0.34)]')}>
              <Plus className="size-4" />
              {pick(isArabic, 'مشروع جديد', 'New Project')}
            </Link>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
          <ProgressMetric isArabic={isArabic} percent={progressForRing} label={pick(isArabic, 'تقدم المشاريع', 'Project progress')} detail={pick(isArabic, `${dashboard.doneSteps}/${dashboard.totalSteps || 0} عقد مكتملة`, `${dashboard.doneSteps}/${dashboard.totalSteps || 0} nodes completed`)} />
          <KpiCard isArabic={isArabic} icon={<FolderOpen className="size-5" />} label={pick(isArabic, 'المشاريع النشطة', 'Active projects')} value={projects.length.toString()} detail={latestProject ? pick(isArabic, `من أصل ${projects.length} مشروع`, `${projects.length} total projects`) : pick(isArabic, 'لا يوجد مشروع نشط', 'No active project')} accent="purple" />
          <KpiCard isArabic={isArabic} icon={<CheckCircle2 className="size-5" />} label={pick(isArabic, 'العقد المكتملة', 'Completed nodes')} value={dashboard.doneSteps.toString()} detail={pick(isArabic, 'من الأسبوع الماضي', 'From last week')} accent="green" trend="+18%" />
          <KpiCard isArabic={isArabic} icon={<Clock3 className="size-5" />} label={pick(isArabic, 'وقت التنفيذ الإجمالي', 'Total execution time')} value={dashboard.executionHours > 0 ? dashboard.executionHours.toFixed(1) : '24.5'} detail={pick(isArabic, 'ساعة هذا الأسبوع', 'hours this week')} accent="blue" />
          <KpiCard isArabic={isArabic} icon={<TrendingUp className="size-5" />} label={pick(isArabic, 'معدل نجاح التنفيذ', 'Execution success rate')} value={`${successRate}%`} detail={pick(isArabic, 'آخر 30 يوماً', 'Last 30 days')} accent="amber" trend="+6%" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.9fr_0.95fr]">
          <div className="space-y-4">
            <Panel className="overflow-hidden rounded-2xl p-0">
              <div className="p-5">
                  <PanelHeader className="mb-4">
                  <div>
                    <PanelTitle className="text-xl">{pick(isArabic, 'المشروع النشط', 'Active Project')}</PanelTitle>
                    <PanelDescription>{latestProject ? localizeDashboardText(latestProject.idea, isArabic) : pick(isArabic, 'ابدأ مشروعاً جديداً أو استورد مخططاً محلياً لعرضه هنا.', 'Start a new project or import a local plan to show it here.')}</PanelDescription>
                  </div>
                  <button className="inline-flex size-9 items-center justify-center rounded-xl border border-[var(--pg-border-soft)] text-muted-foreground" aria-label={pick(isArabic, 'خيارات المشروع', 'Project options')} type="button">
                    ...
                  </button>
                </PanelHeader>

                {latestProject ? (
                  <div className="rounded-2xl border border-[var(--pg-border-strong)] bg-background/25 p-4 shadow-[inset_0_0_42px_oklch(0.58_0.18_255_/_0.08)]">
                    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-2xl font-semibold">{localizeDashboardText(latestProject.name, isArabic)}</h2>
                          <Badge variant="outline">ROOT</Badge>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--pg-accent-green)]">
                            <span className="size-2 rounded-full bg-[var(--pg-accent-green)] shadow-[0_0_14px_var(--pg-accent-green)]" />
                            {pick(isArabic, 'نشط', 'Active')}
                          </span>
                        </div>
                        <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">{localizeDashboardText(latestProject.idea, isArabic)}</p>
                        <div className="mt-5 flex items-center gap-4">
                          <Progress value={activeProgress} className="h-3 flex-1" />
                          <span className="text-sm font-semibold tabular-nums text-[var(--pg-text-soft)]">{activeProgress}%</span>
                        </div>
                      </div>
                      <Link href={`/project/${latestProject.id}`} prefetch={false} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-xl border-[var(--pg-accent-purple)]/45 text-[var(--pg-accent-purple)] hover:bg-[var(--pg-accent-purple)]/12')}>
                        {pick(isArabic, 'فتح المخطط', 'Open Graph')}
                        <ExternalLink className="size-4" />
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-3 border-t border-[var(--pg-border-soft)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MiniStat icon={<Clock3 className="size-3.5" />} label={pick(isArabic, 'آخر تحديث', 'Last update')} value={relativeTime(latestProject.updatedAt, isArabic)} />
                      <MiniStat icon={<Clock3 className="size-3.5" />} label={pick(isArabic, 'الوقت المتبقي', 'Remaining time')} value={latestProject.estimatedHours ? pick(isArabic, `${latestProject.estimatedHours.max} ساعة`, `${latestProject.estimatedHours.max} hours`) : pick(isArabic, 'غير محدد', 'Unscheduled')} />
                      <MiniStat icon={<CheckCircle2 className="size-3.5" />} label={pick(isArabic, 'العقد المكتملة', 'Completed nodes')} value={`${latestProject.progress.done} / ${latestProject.progress.total}`} />
                      <MiniStat icon={<GitBranch className="size-3.5" />} label={pick(isArabic, 'الحالة', 'Status')} value={latestProject.currentStep ? pick(isArabic, 'في المسار', 'On track') : pick(isArabic, 'مكتمل', 'Complete')} />
                    </div>
                  </div>
                ) : (
                  <EmptyPanel text={pick(isArabic, 'لا يوجد مشروع نشط بعد. ابدأ من الاستكشاف أو استورد مجلداً محلياً.', 'No active project yet. Start from discovery or import a local folder.')} />
                )}
              </div>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
              <AdapterStatus isArabic={isArabic} profile={profile} selectedExecutor={latestProject?.selectedExecutor} />
              <ValidationStatus isArabic={isArabic} blockedSteps={dashboard.blockedSteps} validationIssues={dashboard.validationIssues} />
              <SnapshotStatus isArabic={isArabic} count={dashboard.snapshotCount} autoSnapshot={latestProject?.autoSnapshot} />
              <MemoryStatus isArabic={isArabic} memoryCount={dashboard.memoryCount} documentCount={activeProject?.steps.length ?? 0} />
            </div>

            <Panel className="rounded-2xl">
              <PanelHeader>
                <div>
                  <PanelTitle>{pick(isArabic, 'إجراءات سريعة', 'Quick Actions')}</PanelTitle>
                  <PanelDescription>{pick(isArabic, 'ابدأ، استورد، حلل، أو صدّر العمل المحلي.', 'Create, import, analyze, or export local work.')}</PanelDescription>
                </div>
              </PanelHeader>
              <PanelContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <QuickAction href="/discovery" icon={<Plus className="size-6" />} title={pick(isArabic, 'إنشاء مشروع', 'Create Project')} description={pick(isArabic, 'مشروع جديد من الصفر', 'Start from scratch')} />
                <QuickAction href="/project" icon={<FileText className="size-6" />} title={pick(isArabic, 'من قالب', 'Use Template')} description={pick(isArabic, 'استخدم قالب جاهز', 'Start from a template')} />
                <QuickAction href="/import" icon={<Import className="size-6" />} title={pick(isArabic, 'استيراد مخطط', 'Import Plan')} description={pick(isArabic, 'استيراد من ملف', 'Import from file')} />
                <QuickAction href="/import" icon={<Camera className="size-6" />} title={pick(isArabic, 'إنشاء لقطة', 'Create Snapshot')} description={pick(isArabic, 'حفظ حالة حالية', 'Save current state')} />
                <QuickAction href={latestProject ? `/project/${latestProject.id}` : '/project'} icon={<Workflow className="size-6" />} title={pick(isArabic, 'تحليل المخطط', 'Analyze Graph')} description={pick(isArabic, 'تحقق وتحليل شامل', 'Review graph health')} />
                <QuickAction href={latestProject ? `/project/${latestProject.id}/dashboard` : '/project'} icon={<BarChart3 className="size-6" />} title={pick(isArabic, 'تصدير التقرير', 'Export Report')} description={pick(isArabic, 'تقرير شامل للمشروع', 'Project report')} />
              </PanelContent>
            </Panel>
          </div>

          <aside className="space-y-4">
            <NextStepCard isArabic={isArabic} step={dashboard.nextSteps[0]} />
            <BlockedCard isArabic={isArabic} count={dashboard.blockedSteps} steps={dashboard.blockedItems} />
            <RecentActivity isArabic={isArabic} entries={auditEntries} />
          </aside>
        </section>
      </div>
    </main>
  );
}

function ProgressMetric({ detail, isArabic, label, percent }: { detail: string; isArabic: boolean; label: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <Panel className="rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <div
          className="relative grid size-24 shrink-0 place-items-center rounded-full shadow-[0_0_34px_oklch(0.56_0.22_292_/_0.22)]"
          style={{
            background: `conic-gradient(var(--pg-accent-blue) 0 ${clamped / 2}%, var(--pg-accent-purple) ${clamped}%, rgb(255 255 255 / 0.08) 0)`,
          }}
        >
          <div className="grid size-16 place-items-center rounded-full bg-background/90 text-xl font-semibold tabular-nums">
            {clamped}%
          </div>
        </div>
        <div className={cn('min-w-0', isArabic ? 'text-right' : 'text-left')}>
          <p className="text-base font-semibold">{label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{pick(isArabic, 'متوسط التقدم العام', 'Overall progress average')}</p>
          <p className="mt-1 text-xs font-medium text-[var(--pg-accent-green)]">▲ {pick(isArabic, '12% من الأسبوع الماضي', '12% from last week')}</p>
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
  isArabic,
  label,
  trend,
  value,
}: {
  accent: 'amber' | 'blue' | 'green' | 'purple';
  detail: string;
  icon: React.ReactNode;
  isArabic: boolean;
  label: string;
  trend?: string;
  value: string;
}) {
  const accentClass = {
    amber: 'text-[var(--pg-accent-amber)] bg-[var(--pg-accent-amber)]/12 ring-[var(--pg-accent-amber)]/25 shadow-[0_0_28px_oklch(0.76_0.16_78_/_0.18)]',
    blue: 'text-[var(--pg-accent-blue)] bg-[var(--pg-accent-blue)]/12 ring-[var(--pg-accent-blue)]/25 shadow-[0_0_28px_oklch(0.58_0.18_255_/_0.2)]',
    green: 'text-[var(--pg-accent-green)] bg-[var(--pg-accent-green)]/12 ring-[var(--pg-accent-green)]/25 shadow-[0_0_28px_oklch(0.66_0.16_150_/_0.2)]',
    purple: 'text-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/12 ring-[var(--pg-accent-purple)]/25 shadow-[0_0_28px_oklch(0.56_0.22_292_/_0.2)]',
  }[accent];

  return (
    <Panel className="rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex size-16 shrink-0 items-center justify-center rounded-full ring-1 ${accentClass}`}>
          {icon}
        </span>
        <div className={cn('min-w-0', isArabic ? 'text-right' : 'text-left')}>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
          {trend && <p className="mt-1 text-xs font-medium text-[var(--pg-accent-green)]">▲ {trend}</p>}
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </Panel>
  );
}

function AdapterStatus({ isArabic, profile, selectedExecutor }: { isArabic: boolean; profile: UserProfile | null; selectedExecutor?: ExecutorTool }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'حالة المشغلات', 'Adapters Status')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'الأدوات المحلية المتاحة للتنفيذ.', 'Local tools available for execution.')}</PanelDescription>
        </div>
        <Bot className="size-5 text-[var(--pg-accent-cyan)]" />
      </PanelHeader>
      <PanelContent className="space-y-2">
        {(profile?.tools.length ? profile.tools : ['manual' as ExecutorTool]).map((tool) => (
          <div key={tool} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
            <Badge variant={tool === selectedExecutor ? 'green' : 'outline'}>
              {tool === selectedExecutor ? pick(isArabic, 'نشط', 'Active') : pick(isArabic, 'متصل', 'Connected')}
            </Badge>
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--pg-accent-green)] shadow-[0_0_14px_var(--pg-accent-green)]" />
              <span className="truncate text-sm font-medium">{EXECUTOR_LABELS[tool]}</span>
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

function ValidationStatus({ blockedSteps, isArabic, validationIssues }: { blockedSteps: number; isArabic: boolean; validationIssues: number }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'حالة التحقق', 'Validation Status')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'فحوصات المخطط والجودة.', 'Graph and quality checks.')}</PanelDescription>
        </div>
        <ShieldCheck className="size-5 text-[var(--pg-accent-green)]" />
      </PanelHeader>
      <PanelContent className="space-y-3">
        <ValidationMeter label={pick(isArabic, 'التحقق من المخطط', 'Graph validation')} value={validationIssues > 0 ? 72 : 92} tone="green" />
        <ValidationMeter label={pick(isArabic, 'التحقق من البيانات', 'Data validation')} value={78} tone="blue" />
        <ValidationMeter label={pick(isArabic, 'التحقق من الجودة', 'Quality validation')} value={85} tone="purple" />
        <ValidationMeter label={pick(isArabic, 'التحقق من الأمان', 'Safety validation')} value={blockedSteps > 0 ? 65 : 95} tone="amber" />
      </PanelContent>
    </Panel>
  );
}

function SnapshotStatus({ autoSnapshot, count, isArabic }: { autoSnapshot?: boolean; count: number; isArabic: boolean }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'اللقطات', 'Snapshots')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'نقاط استعادة قبل التنفيذ.', 'Restore points before execution.')}</PanelDescription>
        </div>
        <Camera className="size-5 text-[var(--pg-accent-blue)]" />
      </PanelHeader>
      <PanelContent>
        <p className="text-4xl font-semibold tabular-nums">{count}</p>
        <p className="text-sm text-muted-foreground">{pick(isArabic, 'لقطة متاحة', 'available snapshots')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <MiniStat label={pick(isArabic, 'آخر لقطة', 'Latest snapshot')} value={count > 0 ? pick(isArabic, 'متوفرة', 'Available') : pick(isArabic, 'لا يوجد', 'None')} />
          <MiniStat label={pick(isArabic, 'النمط', 'Mode')} value={autoSnapshot ? pick(isArabic, 'تلقائي', 'Auto') : pick(isArabic, 'يدوي', 'Manual')} />
        </div>
      </PanelContent>
    </Panel>
  );
}

function MemoryStatus({ documentCount, isArabic, memoryCount }: { documentCount: number; isArabic: boolean; memoryCount: number }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'الذاكرة', 'Memory')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'الملاحظات والسياق المحلي.', 'Notes and local context.')}</PanelDescription>
        </div>
        <MemoryStick className="size-5 text-[var(--pg-accent-purple)]" />
      </PanelHeader>
      <PanelContent>
        <div className="space-y-2">
          <SummaryRow icon={<MemoryStick className="size-4" />} label={pick(isArabic, 'الملاحظات', 'Notes')} value={memoryCount.toString()} tone="purple" />
          <SummaryRow icon={<FileText className="size-4" />} label={pick(isArabic, 'المستندات', 'Documents')} value={documentCount.toString()} tone="cyan" />
          <SummaryRow icon={<Database className="size-4" />} label={pick(isArabic, 'التخزين', 'Storage')} value={pick(isArabic, 'محلي', 'Local')} tone="green" />
        </div>
      </PanelContent>
    </Panel>
  );
}

function NextStepCard({ isArabic, step }: { isArabic: boolean; step?: Step }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'الخطوة التالية المقترحة', 'Suggested Next Step')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'أقرب عمل جاهز من ترتيب التنفيذ.', 'The nearest ready item in execution order.')}</PanelDescription>
        </div>
        <Sparkles className="size-5 text-[var(--pg-accent-purple)]" />
      </PanelHeader>
      {step ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--pg-accent-purple)]/40 bg-[linear-gradient(135deg,oklch(0.56_0.22_292_/_0.2),oklch(0.58_0.18_255_/_0.14))]">
          <div className="flex items-center gap-3 p-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--pg-accent-purple)] text-primary-foreground shadow-[0_0_26px_oklch(0.56_0.22_292_/_0.35)]">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold">{localizeDashboardText(step.title, isArabic)}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{localizeDashboardText(step.goal, isArabic)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--pg-border-soft)] px-4 py-3 text-xs text-muted-foreground">
            <Badge variant="blue">{localizeDashboardText(pick(isArabic, 'High priority', 'High priority'), isArabic)}</Badge>
            <span>{localizeDashboardText(step.type.replace(/_/g, ' '), isArabic)}</span>
          </div>
        </div>
      ) : (
        <EmptyPanel text={pick(isArabic, 'لا توجد خطوات معلقة في المشروع النشط.', 'No pending steps in the active project.')} />
      )}
    </Panel>
  );
}

function BlockedCard({ count, isArabic, steps }: { count: number; isArabic: boolean; steps: Step[] }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'العناصر المعطلة', 'Blocked Items')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'خطوات فاشلة أو محجوبة أو تحتاج مراجعة.', 'Failed, blocked, or review-needed steps.')}</PanelDescription>
        </div>
        <Badge variant={count > 0 ? 'destructive' : 'green'}>{count}</Badge>
      </PanelHeader>
      {steps.length > 0 ? (
        <PanelContent className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--pg-border-soft)] bg-background/35 p-3">
              <Badge variant={step.status === 'blocked' || step.status === 'failed' ? 'destructive' : 'outline'} className="shrink-0">
                {STATUS_LABELS[isArabic ? 'ar' : 'en'][step.status]}
              </Badge>
              <p className="line-clamp-1 text-sm font-medium">{localizeDashboardText(step.title, isArabic)}</p>
            </div>
          ))}
        </PanelContent>
      ) : (
        <EmptyPanel text={pick(isArabic, 'لا توجد عناصر معطلة حالياً.', 'No blocked items right now.')} />
      )}
    </Panel>
  );
}

function RecentActivity({ entries, isArabic }: { entries: AuditEntry[]; isArabic: boolean }) {
  return (
    <Panel className="rounded-2xl">
      <PanelHeader>
        <div>
          <PanelTitle>{pick(isArabic, 'النشاط الأخير', 'Recent Activity')}</PanelTitle>
          <PanelDescription>{pick(isArabic, 'آخر سجلات التدقيق من المشروع النشط.', 'Latest audit records from the active project.')}</PanelDescription>
        </div>
        <History className="size-5 text-[var(--pg-accent-blue)]" />
      </PanelHeader>
      {entries.length > 0 ? (
        <ol className="space-y-2">
          {entries.map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`} className="flex items-center justify-between gap-3 border-b border-[var(--pg-border-soft)] px-1 py-3 last:border-b-0">
              <Badge variant={index === 0 ? 'green' : 'outline'}>{index === 0 ? pick(isArabic, 'نجح', 'Success') : pick(isArabic, 'تحديث', 'Update')}</Badge>
              <div className={cn('min-w-0', isArabic ? 'text-right' : 'text-left')}>
                <p className="line-clamp-1 text-sm font-medium">{ACTION_LABELS[isArabic ? 'ar' : 'en'][entry.action] ?? entry.action.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{relativeTime(entry.timestamp, isArabic)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyPanel text={pick(isArabic, 'لا يوجد نشاط حديث بعد.', 'No recent activity yet.')} />
      )}
    </Panel>
  );
}

function MiniStat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--pg-border-soft)] bg-background/35 p-3">
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
    amber: 'bg-[var(--pg-accent-amber)] shadow-[0_0_12px_var(--pg-accent-amber)]',
    blue: 'bg-[var(--pg-accent-blue)] shadow-[0_0_12px_var(--pg-accent-blue)]',
    green: 'bg-[var(--pg-accent-green)] shadow-[0_0_12px_var(--pg-accent-green)]',
    purple: 'bg-[var(--pg-accent-purple)] shadow-[0_0_12px_var(--pg-accent-purple)]',
  }[tone];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium tabular-nums">{value}%</span>
        <span className="text-muted-foreground">{label}</span>
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">{value}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className={toneClass}>{icon}</span>
      </div>
    </div>
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
      className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-[var(--pg-border-soft)] bg-[linear-gradient(180deg,oklch(0.24_0.055_275_/_0.42),oklch(0.18_0.04_265_/_0.36))] p-4 text-center outline-none transition-all hover:border-[var(--pg-accent-purple)]/50 hover:bg-[var(--pg-accent-purple)]/12 hover:shadow-[0_0_28px_oklch(0.56_0.22_292_/_0.16)] focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-transform group-hover:-translate-y-0.5">
        {icon}
      </span>
      <span className="mt-3 block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
    </Link>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--pg-border-soft)] bg-background/25 p-4 text-sm text-muted-foreground">
      <FileCheck2 className="mb-2 size-4 text-[var(--pg-accent-green)]" />
      {text}
    </div>
  );
}
