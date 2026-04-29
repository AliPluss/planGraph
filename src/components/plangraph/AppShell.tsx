'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArchiveRestore,
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  FolderKanban,
  History,
  Library,
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
  UserRound,
  Workflow,
} from 'lucide-react';
import ProjectEventToasts from './dashboard/ProjectEventToasts';
import LocaleToggle from './LocaleToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { ProjectMeta, UserProfile } from '@/core/types';

const navSections = [
  {
    key: 'workspace',
    label: { en: 'Workspace', ar: 'مساحة العمل' },
    items: [
      { href: '/', labelKey: 'nav.home', fallback: { en: 'Home', ar: 'الرئيسية' }, icon: LayoutDashboard, exact: true },
      { href: '/project', labelKey: 'nav.projects', fallback: { en: 'Projects', ar: 'المشاريع' }, icon: FolderKanban },
      { href: '/project', fallback: { en: 'Templates', ar: 'القوالب' }, icon: BookOpen, visualOnly: true },
      { href: '/settings', fallback: { en: 'Library', ar: 'المكتبة' }, icon: Library, visualOnly: true },
    ],
  },
  {
    key: 'operations',
    label: { en: 'Operations', ar: 'التشغيل' },
    items: [
      { href: '/execution', fallback: { en: 'Execution', ar: 'التنفيذ' }, icon: ListChecks },
      { href: '/project', fallback: { en: 'History', ar: 'التاريخ' }, icon: History, visualOnly: true },
      { href: '/import', fallback: { en: 'Snapshots & import', ar: 'اللقطات والاستيراد' }, icon: ArchiveRestore },
      { href: '/project', fallback: { en: 'Validation, audit & reports', ar: 'التحقق والتدقيق والتقارير' }, icon: ClipboardCheck, visualOnly: true },
    ],
  },
  {
    key: 'system',
    label: { en: 'System', ar: 'النظام' },
    items: [
      { href: '/settings', labelKey: 'nav.settings', fallback: { en: 'Settings', ar: 'الإعدادات' }, icon: Settings },
    ],
  },
];

type ProjectsResponse = { data?: ProjectMeta[] };
type ProfileResponse = { profile?: UserProfile | null };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { i18n, t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [shellLocale, setShellLocale] = useState<'ar' | 'en'>('en');

  const isArabic = i18n.language?.startsWith('ar');
  const latestProject = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    [projects],
  );
  const visualArabic = shellLocale === 'ar';

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      fetch('/api/profile').then((response) => response.json() as Promise<ProfileResponse>),
      fetch('/api/projects').then((response) => response.json() as Promise<ProjectsResponse>),
    ]).then(([profileResult, projectsResult]) => {
      if (cancelled) return;
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value.profile ?? null);
      }
      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value.data ?? []);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('i18nextLng');
    if (saved?.startsWith('en')) {
      setShellLocale('en');
      return;
    }
    if (saved?.startsWith('ar') || i18n.language?.startsWith('ar')) {
      setShellLocale('ar');
    }
  }, [i18n.language]);

  const localize = (value: { en: string; ar: string }) => (visualArabic ? value.ar : value.en);
  const profileName = profile?.displayName?.trim() || (visualArabic ? 'أحمد الباحث' : 'Local user');
  const profileMeta = profile
    ? `${profile.tools[0] ?? 'manual'} · ${profile.level}`
    : visualArabic ? 'ahmed@research.ai' : 'Local-first';

  return (
    <div dir="ltr" className="min-h-screen bg-[var(--pg-surface-0)] text-foreground">
      <div className="flex min-h-screen">
        <aside
          dir="ltr"
          className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-e border-[var(--pg-border-strong)] bg-[linear-gradient(180deg,oklch(0.18_0.045_265_/_0.94),oklch(0.11_0.026_265_/_0.94))] px-4 py-5 shadow-[24px_0_80px_oklch(0.06_0.03_265_/_0.34)] backdrop-blur-2xl lg:flex"
        >
          <div className="flex items-start justify-between gap-3">
            <ShellBrand />
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--pg-border-soft)] bg-white/[0.035] p-1">
              <ShellHelp isArabic={visualArabic} />
              <LocaleToggle />
            </div>
          </div>
          <nav className="mt-8 flex-1 space-y-5" aria-label={visualArabic ? 'التنقل الرئيسي' : 'Primary navigation'}>
            {navSections.map((section) => (
              <div key={section.key}>
                <div className="px-2 text-xs font-semibold text-[var(--pg-text-faint)]">
                  {localize(section.label)}
                </div>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const active = item.visualOnly
                      ? false
                      : 'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    const label = visualArabic
                      ? item.fallback.ar
                      : 'labelKey' in item && item.labelKey ? t(item.labelKey, item.fallback.en) : item.fallback.en;

                    return (
                      <Link
                        key={`${section.key}-${item.fallback.en}`}
                        href={item.href}
                        prefetch={false}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-semibold transition-all',
                          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          active
                            ? 'border border-[var(--pg-accent-blue)]/55 bg-[linear-gradient(135deg,var(--pg-accent-purple)_0%,var(--pg-accent-blue)_100%)]/20 text-white shadow-[0_0_34px_oklch(0.58_0.18_255_/_0.22),inset_0_0_28px_oklch(0.56_0.22_292_/_0.18)]'
                            : 'border border-transparent text-sidebar-foreground/72 hover:border-[var(--pg-border-strong)] hover:bg-white/[0.045] hover:text-sidebar-foreground',
                        )}
                      >
                        {active && <span className="absolute inset-y-2 right-0 w-1 rounded-full bg-[var(--pg-accent-blue)] shadow-[0_0_18px_var(--pg-accent-blue)]" />}
                        <Icon className="size-5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <WorkspaceSwitcher latestProject={latestProject} isArabic={visualArabic} />
          <UserCard name={profileName} meta={profileMeta} isArabic={visualArabic} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--pg-border-soft)] bg-background/86 px-4 backdrop-blur-xl lg:hidden">
            <ShellBrand compact />
            <div className="flex items-center gap-1">
              <ShellHelp isArabic={isArabic} />
              <LocaleToggle />
              <Link
                href="/settings"
                aria-label={t('nav.settings', 'Settings')}
                className="inline-flex size-8 items-center justify-center rounded-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <ProjectEventToasts />
      <Toaster />
    </div>
  );
}

function ShellBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Workflow className="size-5" />
      </span>
      <span className={cn('min-w-0', compact && 'sr-only')}>
        <span className="block truncate text-base font-semibold tracking-tight">PlanGraph</span>
        <span className="block truncate text-xs text-muted-foreground">AI Planning &amp; Execution</span>
      </span>
    </Link>
  );
}

function WorkspaceSwitcher({ latestProject, isArabic }: { latestProject?: ProjectMeta; isArabic: boolean }) {
  return (
    <div className="mb-4 rounded-2xl border border-[var(--pg-border-soft)] bg-white/[0.04] p-3 shadow-[inset_0_0_28px_oklch(0.58_0.18_255_/_0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--pg-text-faint)]">{isArabic ? 'مساحة العمل' : 'Workspace'}</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {latestProject?.name ?? (isArabic ? 'لا يوجد مشروع نشط' : 'No active project')}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {latestProject ? (isArabic ? 'مشروع محلي نشط' : 'Active local project') : (isArabic ? 'ابدأ من الاستكشاف' : 'Start from discovery')}
          </p>
        </div>
        <Link
          href="/discovery"
          prefetch={false}
          aria-label={isArabic ? 'مشروع جديد' : 'New project'}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground outline-none shadow-[0_0_22px_oklch(0.56_0.22_292_/_0.35)] transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" />
        </Link>
      </div>
      {latestProject && (
        <Link
          href={`/project/${latestProject.id}`}
          prefetch={false}
          className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-xl border border-[var(--pg-border-soft)] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isArabic ? 'فتح المشروع' : 'Open project'}
        </Link>
      )}
    </div>
  );
}

function UserCard({ name, meta, isArabic }: { name: string; meta: string; isArabic: boolean }) {
  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="rounded-2xl border border-[var(--pg-border-soft)] bg-white/[0.04] p-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--pg-accent-cyan)]/15 text-[var(--pg-accent-cyan)] shadow-[0_0_24px_oklch(0.68_0.14_210_/_0.2)]">
          <UserRound className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <p className="mt-3 break-words text-xs leading-5 text-[var(--pg-text-faint)]">
        {isArabic ? 'بياناتك ومشاريعك تبقى في مساحة العمل المحلية.' : 'Projects and preferences stay in the local workspace.'}
      </p>
    </div>
  );
}

function ShellHelp({ isArabic }: { isArabic: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={isArabic ? 'ما هو PlanGraph؟' : 'What is PlanGraph?'}
        className="inline-flex size-8 items-center justify-center rounded-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{isArabic ? 'ما هو PlanGraph؟' : "What's PlanGraph?"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex-col items-start gap-1 whitespace-normal">
          <span className="font-medium">{isArabic ? 'تخطيط محلي أولاً' : 'Local-first planning'}</span>
          <span className="text-xs text-muted-foreground">
            {isArabic
              ? 'يحوّل PlanGraph الأفكار أو المجلدات الحالية إلى خطوات Markdown قابلة للتنفيذ.'
              : 'PlanGraph turns ideas or existing folders into executable Markdown steps.'}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex-col items-start gap-1 whitespace-normal">
          <span className="font-medium">{isArabic ? 'أدواتك تبقى مسؤولة' : 'Your tools stay in charge'}</span>
          <span className="text-xs text-muted-foreground">
            {isArabic
              ? 'يعمل Claude Code أو Cursor أو Antigravity أو التنفيذ اليدوي عبر إعدادك المحلي.'
              : 'Claude Code, Cursor, Antigravity, or manual work run through your local setup.'}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
