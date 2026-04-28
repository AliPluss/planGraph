'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArchiveRestore,
  CircleHelp,
  Compass,
  FolderKanban,
  LayoutDashboard,
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
      { href: '/', labelKey: 'nav.home', fallback: { en: 'Dashboard', ar: 'لوحة التحكم' }, icon: LayoutDashboard, exact: true },
      { href: '/project', labelKey: 'nav.projects', fallback: { en: 'Projects', ar: 'المشاريع' }, icon: FolderKanban },
      { href: '/discovery', fallback: { en: 'Planning chat', ar: 'محادثة التخطيط' }, icon: Compass },
    ],
  },
  {
    key: 'operations',
    label: { en: 'Operations', ar: 'التشغيل' },
    items: [
      { href: '/import', fallback: { en: 'Import & snapshots', ar: 'الاستيراد واللقطات' }, icon: ArchiveRestore },
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

  const isArabic = i18n.language?.startsWith('ar');
  const latestProject = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    [projects],
  );

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

  const localize = (value: { en: string; ar: string }) => (isArabic ? value.ar : value.en);
  const profileName = profile?.displayName?.trim() || (isArabic ? 'مستخدم محلي' : 'Local user');
  const profileMeta = profile
    ? `${profile.level} · ${profile.tools[0] ?? 'manual'}`
    : isArabic ? 'محلي أولاً' : 'Local-first';

  return (
    <div className="min-h-screen bg-[var(--pg-surface-0)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-e border-[var(--pg-border-soft)] bg-sidebar/90 px-3 py-4 backdrop-blur-xl lg:flex">
          <ShellBrand />
          <WorkspaceSwitcher latestProject={latestProject} isArabic={isArabic} />
          <nav className="mt-5 flex-1 space-y-5" aria-label={isArabic ? 'التنقل الرئيسي' : 'Primary navigation'}>
            {navSections.map((section) => (
              <div key={section.key}>
                <div className="px-2 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--pg-text-faint)]">
                  {localize(section.label)}
                </div>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    const label = item.labelKey ? t(item.labelKey, localize(item.fallback)) : localize(item.fallback);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          active
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                            : 'text-sidebar-foreground/74 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <UserCard name={profileName} meta={profileMeta} isArabic={isArabic} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--pg-border-soft)] bg-background/86 px-4 backdrop-blur-xl lg:hidden">
            <ShellBrand compact />
            <div className="flex items-center gap-1">
              <ShellHelp />
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

          <header className="sticky top-0 z-40 hidden h-14 items-center justify-between border-b border-[var(--pg-border-soft)] bg-background/70 px-5 backdrop-blur-xl lg:flex">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--pg-text-faint)]">
                {isArabic ? 'مساحة عمل محلية' : 'Local workspace'}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {latestProject?.rootPath ?? (isArabic ? 'لا يوجد مشروع نشط بعد' : 'No active project yet')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <ShellHelp />
              <LocaleToggle />
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
        <span className="block truncate text-xs text-muted-foreground">Executable planning</span>
      </span>
    </Link>
  );
}

function WorkspaceSwitcher({ latestProject, isArabic }: { latestProject?: ProjectMeta; isArabic: boolean }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--pg-border-soft)] bg-[var(--pg-surface-glass)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--pg-text-faint)]">{isArabic ? 'المشروع الحالي' : 'Current project'}</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {latestProject?.name ?? (isArabic ? 'لم يتم اختيار مشروع' : 'No project selected')}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {latestProject?.templateId.replace(/-/g, ' ') ?? (isArabic ? 'ابدأ من الاستكشاف' : 'Start from discovery')}
          </p>
        </div>
        <Link
          href="/discovery"
          prefetch={false}
          aria-label={isArabic ? 'مشروع جديد' : 'New project'}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" />
        </Link>
      </div>
      {latestProject && (
        <Link
          href={`/project/${latestProject.id}`}
          prefetch={false}
          className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-md border border-[var(--pg-border-soft)] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isArabic ? 'فتح المشروع' : 'Open project'}
        </Link>
      )}
    </div>
  );
}

function UserCard({ name, meta, isArabic }: { name: string; meta: string; isArabic: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-[var(--pg-surface-glass)] p-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pg-accent-cyan)]/15 text-[var(--pg-accent-cyan)]">
          <UserRound className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--pg-text-faint)]">
        {isArabic ? 'بياناتك ومشاريعك تبقى في مساحة العمل المحلية.' : 'Projects and preferences stay in the local workspace.'}
      </p>
    </div>
  );
}

function ShellHelp() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="What is PlanGraph?"
        className="inline-flex size-8 items-center justify-center rounded-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>What&apos;s PlanGraph?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex-col items-start gap-1 whitespace-normal">
          <span className="font-medium">Local-first planning</span>
          <span className="text-xs text-muted-foreground">
            PlanGraph turns ideas or existing folders into executable Markdown steps.
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex-col items-start gap-1 whitespace-normal">
          <span className="font-medium">Your tools stay in charge</span>
          <span className="text-xs text-muted-foreground">
            Claude Code, Cursor, Antigravity, or manual work run through your local setup.
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
