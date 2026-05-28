'use client';

import { useState, type ReactNode } from 'react';
import Form from 'next/form';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownAZ,
  Boxes,
  ChevronDown,
  CircleDot,
  Clock3,
  Edit3,
  Filter,
  GitBranch,
  Grid2X2,
  Layers3,
  List,
  Play,
  Plus,
  Search,
  Sparkles,
  Workflow,
} from 'lucide-react';
import type { Project, ProjectMeta, Step } from '@/core/types';
import { getStepRoleIcon, getStepVisual } from '@/components/plangraph/graph/StepNode';

export type ProjectGalleryItem = ProjectMeta & {
  progress: { done: number; total: number; percent: number };
  currentStep: Step | null;
  status: 'active' | 'blocked' | 'complete' | 'draft';
  stepCount: number;
  blockedCount: number;
  stackPreview: string[];
  project: Project | null;
};

export type TemplateGalleryItem = {
  id: string;
  kind: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  defaultStack: string[];
  stageCount: number;
};

type ProjectsTemplatesViewProps = {
  projects: ProjectGalleryItem[];
  filteredProjects: ProjectGalleryItem[];
  selectedProject: ProjectGalleryItem | null;
  templates: TemplateGalleryItem[];
  query: string;
  statusFilter: string;
  sortBy: string;
};

const copy = {
  en: {
    greeting: 'Welcome back, Ahmed',
    greetingSub: 'A focused view of your projects and templates',
    title: 'Projects and Templates',
    subtitle: 'Explore active plans, reuse templates, and open the next graph workspace.',
    projectSwitch: 'AI research workspace',
    newProject: 'New Project',
    allProjects: 'All Projects',
    templatesTab: 'Templates',
    archiveTab: 'Archive',
    search: 'Search projects...',
    apply: 'Apply',
    all: 'All',
    sort: 'Sort: recent update',
    grid: 'Grid view',
    list: 'List view',
    selected: 'Selected project',
    totalProgress: 'Total progress',
    nodes: 'Nodes',
    steps: 'Steps',
    collaborators: 'Team',
    description: 'Description',
    currentStep: 'Current step',
    stack: 'Stack',
    blocked: 'Blocked',
    related: 'Featured templates',
    activity: 'Latest activity',
    open: 'Open Project',
    openMemory: 'Memory',
    openAudit: 'Audit',
    featured: 'Featured Templates',
    showAll: 'View all templates',
    useTemplate: 'Use template',
    noProjects: 'No matching projects',
    noProjectsSub: 'Clear filters or start a new project from discovery.',
    updated: 'updated',
    ago: 'ago',
  },
  ar: {
    greeting: 'مرحباً أحمد',
    greetingSub: 'نظرة مركزة على مشاريعك وقوالبك',
    title: 'المشاريع والقوالب',
    subtitle: 'استكشف خططك الحالية، وأعد استخدام القوالب، وافتح مساحة المخطط التالية.',
    projectSwitch: 'مساحة بحث الذكاء الاصطناعي',
    newProject: 'مشروع جديد',
    allProjects: 'كل المشاريع',
    templatesTab: 'القوالب',
    archiveTab: 'الأرشيف',
    search: 'ابحث في المشاريع...',
    apply: 'تطبيق',
    all: 'الكل',
    sort: 'ترتيب: آخر تحديث',
    grid: 'عرض شبكي',
    list: 'عرض قائمة',
    selected: 'مشروع محدد',
    totalProgress: 'التقدم الكلي',
    nodes: 'العقد',
    steps: 'الخطوات',
    collaborators: 'الفريق',
    description: 'الوصف',
    currentStep: 'الخطوة الحالية',
    stack: 'التقنيات',
    blocked: 'المعطلة',
    related: 'قوالب مميزة',
    activity: 'النشاط الأخير',
    open: 'فتح المشروع',
    openMemory: 'الذاكرة',
    openAudit: 'التدقيق',
    featured: 'قوالب مميزة',
    showAll: 'عرض جميع القوالب',
    useTemplate: 'استخدام القالب',
    noProjects: 'لا توجد مشاريع مطابقة',
    noProjectsSub: 'امسح الفلاتر أو ابدأ مشروعاً جديداً من الاستكشاف.',
    updated: 'آخر تحديث',
    ago: 'مضت',
  },
};

const statusLabels = {
  en: { all: 'All', active: 'Active', blocked: 'Blocked', complete: 'Complete', draft: 'Draft' },
  ar: { all: 'كل الحالات', active: 'نشط', blocked: 'متعطل', complete: 'مكتمل', draft: 'مسودة' },
};

const sortLabels = {
  en: {
    updated: 'Recently updated',
    name: 'Name',
    progress: 'Progress',
    created: 'Newest created',
  },
  ar: {
    updated: 'آخر تحديث',
    name: 'الاسم',
    progress: 'التقدم',
    created: 'الأحدث إنشاءً',
  },
};

export default function ProjectsTemplatesView({
  projects,
  filteredProjects,
  selectedProject,
  templates,
  query,
  statusFilter,
  sortBy,
}: ProjectsTemplatesViewProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isArabic = locale === 'ar';
  const text = copy[locale];
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[radial-gradient(circle_at_78%_0%,oklch(0.56_0.22_292_/_0.18),transparent_34%),radial-gradient(circle_at_30%_12%,oklch(0.58_0.18_255_/_0.16),transparent_32%),linear-gradient(180deg,oklch(0.13_0.03_265),oklch(0.1_0.025_265))] px-4 py-4 text-foreground sm:px-5 lg:px-6"
    >
      <div className="mx-auto grid w-full max-w-[1760px] gap-4 xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]">
        <section className="min-w-0 space-y-4">
          <TopBar text={text} isArabic={isArabic} selectedProject={selectedProject} locale={locale} />

          <section className="rounded-2xl border border-[var(--pg-border-soft)] bg-[linear-gradient(180deg,oklch(0.21_0.035_265_/_0.8),oklch(0.15_0.03_265_/_0.62))] p-4 shadow-[0_24px_80px_oklch(0.04_0.02_265_/_0.38),inset_0_1px_0_oklch(1_0_0_/_0.05)] backdrop-blur-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--pg-accent-purple)]/35 bg-[var(--pg-accent-purple)]/15 text-[var(--pg-accent-purple)] shadow-[0_0_26px_oklch(0.56_0.22_292_/_0.28)]">
                    <Boxes className="size-5" />
                  </span>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{text.subtitle}</p>
              </div>
              <Link
                href="/discovery"
                prefetch={false}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--pg-accent-purple),var(--pg-accent-blue))] px-5 text-sm font-semibold text-white shadow-[0_0_36px_oklch(0.56_0.22_292_/_0.34)] transition-opacity hover:opacity-90"
              >
                <Plus className="size-5" />
                {text.newProject}
              </Link>
            </div>

            <div className="mt-5 border-b border-[var(--pg-border-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <div className="flex items-center gap-5 text-sm font-semibold">
                  <span className="border-b-2 border-[var(--pg-accent-purple)] px-1 pb-3 text-foreground">
                    {text.allProjects}
                  </span>
                  <a href="#templates" className="px-1 pb-3 text-muted-foreground transition hover:text-foreground">
                    {text.templatesTab}
                  </a>
                  <span className="cursor-not-allowed px-1 pb-3 text-muted-foreground/45" aria-disabled="true">
                    {text.archiveTab}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {filteredProjects.length} / {projects.length}
                </span>
              </div>
            </div>

            <Form className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_9.5rem_10rem_auto_auto]" action="/project" scroll={false}>
              <label className="relative block">
                <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder={text.search}
                  className="h-11 w-full rounded-xl border border-[var(--pg-border-soft)] bg-background/45 ps-11 pe-4 text-sm outline-none transition focus-visible:border-[var(--pg-accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--pg-accent-blue)]/30"
                />
              </label>
              <SelectField name="status" value={statusFilter} icon={Filter} autoSubmit>
                {Object.entries(statusLabels[locale]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <SelectField name="sort" value={sortBy} icon={ArrowDownAZ} autoSubmit>
                {Object.entries(sortLabels[locale]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--pg-border-soft)] bg-background/55 px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <Filter className="size-4" />
                {text.apply}
              </button>
              <div className="flex h-11 overflow-hidden rounded-xl border border-[var(--pg-border-soft)] bg-background/45">
                <button
                  type="button"
                  aria-label={text.grid}
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex w-11 items-center justify-center transition ${viewMode === 'grid' ? 'bg-[var(--pg-accent-purple)]/20 text-[var(--pg-accent-purple)]' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                >
                  <Grid2X2 className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={text.list}
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`inline-flex w-11 items-center justify-center transition ${viewMode === 'list' ? 'bg-[var(--pg-accent-purple)]/20 text-[var(--pg-accent-purple)]' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                >
                  <List className="size-4" />
                </button>
              </div>
            </Form>

            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(statusLabels[locale]).map(([value, label]) => (
                <Link
                  key={value}
                  href={statusFilterHref(value, { query, sortBy })}
                  scroll={false}
                  prefetch={false}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === value
                      ? 'border-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/18 text-white shadow-[0_0_18px_oklch(0.56_0.22_292_/_0.2)]'
                      : 'border-[var(--pg-border-soft)] bg-background/25 text-muted-foreground hover:border-[var(--pg-border-strong)] hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <ProjectGrid
              projects={filteredProjects}
              selectedProject={selectedProject}
              text={text}
              locale={locale}
              query={query}
              statusFilter={statusFilter}
              sortBy={sortBy}
              viewMode={viewMode}
            />
          </section>

          <TemplatesRow templates={templates} text={text} locale={locale} />
        </section>

        <ProjectDetails project={selectedProject} projects={projects} templates={templates} text={text} locale={locale} />
      </div>
    </main>
  );
}

function TopBar({
  text,
  isArabic,
  selectedProject,
  locale,
}: {
  text: (typeof copy)['en'];
  isArabic: boolean;
  selectedProject: ProjectGalleryItem | null;
  locale: 'ar' | 'en';
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(18rem,28rem)_1fr] lg:items-center">
      <div className="flex h-14 items-center justify-between rounded-2xl border border-[var(--pg-border-soft)] bg-background/45 px-4 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04)] backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[var(--pg-accent-blue)]/15 text-[var(--pg-accent-blue)]">
            <Workflow className="size-4" />
          </span>
          <span className="truncate text-sm font-semibold">{selectedProject?.name ?? text.projectSwitch}</span>
        </div>
        {selectedProject && <StatusBadge status={selectedProject.status} locale={locale} />}
      </div>
      <div className={`hidden lg:block ${isArabic ? 'text-left' : 'text-right'}`}>
        <p className="text-lg font-semibold">{text.greeting} <span aria-hidden>👋</span></p>
        <p className="mt-1 text-sm text-muted-foreground">{text.greetingSub}</p>
      </div>
    </div>
  );
}

function SelectField({
  name,
  value,
  icon: Icon,
  autoSubmit,
  children,
}: {
  name: string;
  value: string;
  icon: typeof Filter;
  autoSubmit?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <select
        name={name}
        defaultValue={value}
        onChange={(event) => {
          if (autoSubmit) event.currentTarget.form?.requestSubmit();
        }}
        className="h-11 w-full appearance-none rounded-xl border border-[var(--pg-border-soft)] bg-background/45 ps-9 pe-8 text-sm outline-none focus-visible:border-[var(--pg-accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--pg-accent-blue)]/30"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </label>
  );
}

function ProjectGrid({
  projects,
  selectedProject,
  text,
  locale,
  query,
  statusFilter,
  sortBy,
  viewMode,
}: {
  projects: ProjectGalleryItem[];
  selectedProject: ProjectGalleryItem | null;
  text: (typeof copy)['en'];
  locale: 'ar' | 'en';
  query: string;
  statusFilter: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}) {
  if (projects.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-[var(--pg-border-strong)] bg-background/25 px-6 py-12 text-center">
        <p className="text-sm font-semibold">{text.noProjects}</p>
        <p className="mt-2 text-sm text-muted-foreground">{text.noProjectsSub}</p>
      </div>
    );
  }

  return (
      <div className={viewMode === 'grid' ? 'mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3' : 'mt-5 grid gap-3'}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          selected={selectedProject?.id === project.id}
          locale={locale}
          href={projectSelectionHref(project.id, { query, statusFilter, sortBy })}
          viewMode={viewMode}
        />
      ))}
      <NewProjectTile locale={locale} />
    </div>
  );
}

function ProjectCard({
  project,
  selected,
  locale,
  href,
  viewMode,
}: {
  project: ProjectGalleryItem;
  selected: boolean;
  locale: 'ar' | 'en';
  href: string;
  viewMode: 'grid' | 'list';
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      className={`group relative overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,oklch(0.2_0.035_265_/_0.74),oklch(0.15_0.03_265_/_0.62))] transition ${
        selected
          ? 'border-[var(--pg-accent-purple)] shadow-[0_0_0_1px_oklch(0.56_0.22_292_/_0.28),0_18px_54px_oklch(0.56_0.22_292_/_0.2)]'
          : 'border-[var(--pg-border-soft)] hover:border-[var(--pg-border-strong)]'
      }`}
      aria-current={selected ? 'true' : undefined}
    >
      <div className={viewMode === 'list' ? 'grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_18rem]' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {selected && (
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--pg-accent-purple)] text-white">
                  <CircleDot className="size-3.5" />
                </span>
              )}
              <h2 className="truncate text-base font-semibold">{project.name}</h2>
            </div>
          </div>
          <StatusBadge status={project.status} locale={locale} />
        </div>

        <GraphPreview project={project} compact={viewMode === 'list'} />

        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{project.idea}</p>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{project.progress.done} / {project.progress.total}</span>
            <span className="font-semibold">{project.progress.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--pg-accent-purple),var(--pg-accent-blue))] shadow-[0_0_16px_oklch(0.56_0.22_292_/_0.36)]"
              style={{ width: `${project.progress.percent}%` }}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-[var(--pg-border-soft)] divide-x-reverse rounded-xl border border-[var(--pg-border-soft)] bg-background/24 px-3 py-2 text-xs">
          <MetaBlock label={locale === 'ar' ? 'العقد' : 'Nodes'} value={String(project.stepCount)} />
          <MetaBlock label={locale === 'ar' ? 'آخر تحديث' : 'Updated'} value={relativeTime(project.updatedAt, locale)} />
          <MetaBlock label={locale === 'ar' ? 'الفريق' : 'Team'} value={`+${Math.max(1, project.stackPreview.length)}`} />
        </div>

        {project.stackPreview.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.stackPreview.map((stack) => (
              <span key={stack} className="rounded-md border border-[var(--pg-border-soft)] bg-background/24 px-2 py-1 text-[0.65rem] font-medium text-muted-foreground">
                {stack}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function GraphPreview({ project, compact = false }: { project: ProjectGalleryItem; compact?: boolean }) {
  const nodes = project.project?.steps.slice(0, 8) ?? [];
  const rootColor = 'oklch(0.67 0.24 292)';
  const deliveryColor = 'oklch(0.7 0.18 145)';

  return (
    <div className={`pg-canvas-grid relative mt-4 overflow-hidden rounded-xl border border-[var(--pg-border-soft)] bg-background/30 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.05)] ${compact ? 'h-28 md:mt-0 md:h-full md:min-h-32' : 'h-32'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,oklch(0.56_0.22_292_/_0.18),transparent_34%),radial-gradient(circle_at_76%_72%,oklch(0.68_0.14_210_/_0.12),transparent_32%)]" />
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M18 32 C58 32 58 64 98 64 S142 30 178 30 S222 72 264 72" fill="none" stroke="oklch(0.78 0.055 265 / 0.52)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M98 64 C104 88 124 96 150 98 S206 96 230 112" fill="none" stroke="oklch(0.72 0.05 265 / 0.38)" strokeWidth="1.3" strokeDasharray="4 5" strokeLinecap="round" />
      </svg>
      {nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Draft graph</div>
      ) : (
        <>
          <PreviewNode
            title={project.name}
            label="ROOT"
            left="50%"
            top="18%"
            color={rootColor}
            large
          />
          {nodes.slice(0, 6).map((step, index) => {
            const positions = [
              ['20%', '48%'],
              ['50%', '47%'],
              ['80%', '48%'],
              ['28%', '74%'],
              ['58%', '75%'],
              ['84%', '74%'],
            ];
            const visual = getStepVisual(step);
            const Icon = getStepRoleIcon(visual.role);
            return (
              <PreviewNode
                key={step.id}
                title={step.title}
                label={`N-${String(index + 1).padStart(2, '0')}`}
                left={positions[index][0]}
                top={positions[index][1]}
                color={visual.accent}
                icon={<Icon className="size-3.5" />}
              />
            );
          })}
          <PreviewNode
            title={localeLabel(project.progress.percent)}
            label={`${project.progress.percent}%`}
            left="50%"
            top="92%"
            color={deliveryColor}
          />
        </>
      )}
    </div>
  );
}

function PreviewNode({
  title,
  label,
  left,
  top,
  color,
  icon,
  large = false,
}: {
  title: string;
  label: string;
  left: string;
  top: string;
  color: string;
  icon?: ReactNode;
  large?: boolean;
}) {
  return (
    <span
      title={title}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-lg border font-semibold shadow-[0_0_18px_currentColor] ${large ? 'h-8 min-w-20 px-2 text-[0.62rem]' : 'h-7 min-w-12 px-2 text-[0.6rem]'}`}
      style={{ left, top, borderColor: color, color, background: 'oklch(0.12 0.032 265 / 0.88)' }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function localeLabel(percent: number) {
  return percent === 100 ? 'Complete' : 'Delivery';
}

function NewProjectTile({ locale }: { locale: 'ar' | 'en' }) {
  return (
    <Link
      href="/discovery"
      prefetch={false}
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--pg-border-strong)] bg-background/18 p-5 text-center transition hover:border-[var(--pg-accent-purple)] hover:bg-[var(--pg-accent-purple)]/8"
    >
      <span className="inline-flex size-14 items-center justify-center rounded-full border border-[var(--pg-accent-purple)]/45 bg-[var(--pg-accent-purple)]/12 text-[var(--pg-accent-purple)] shadow-[0_0_26px_oklch(0.56_0.22_292_/_0.24)]">
        <Plus className="size-7" />
      </span>
      <span className="mt-4 text-base font-semibold">{locale === 'ar' ? 'مشروع جديد' : 'New Project'}</span>
      <span className="mt-2 max-w-48 text-xs leading-5 text-muted-foreground">
        {locale === 'ar' ? 'ابدأ خطة حقيقية من الاستكشاف.' : 'Start a real plan from discovery.'}
      </span>
    </Link>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <p className="text-[0.68rem] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function TemplatesRow({
  templates,
  text,
  locale,
}: {
  templates: TemplateGalleryItem[];
  text: (typeof copy)['en'];
  locale: 'ar' | 'en';
}) {
  return (
    <section id="templates" className="scroll-mt-4 rounded-2xl border border-[var(--pg-border-soft)] bg-[linear-gradient(180deg,oklch(0.2_0.035_265_/_0.72),oklch(0.15_0.03_265_/_0.58))] p-4 shadow-[0_24px_80px_oklch(0.04_0.02_265_/_0.28)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            {text.featured}
            <Sparkles className="size-5 text-[var(--pg-accent-purple)]" />
          </h2>
        </div>
        <Link href="/discovery" prefetch={false} className="rounded-xl border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2 text-xs font-semibold text-[var(--pg-accent-purple)]">
          {text.showAll}
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {templates.map((template, index) => (
          <Link
            key={template.id}
            href={`/discovery?template=${encodeURIComponent(template.id)}`}
            prefetch={false}
            className="rounded-xl border border-[var(--pg-border-soft)] bg-background/28 p-4 transition hover:border-[var(--pg-border-strong)] hover:bg-muted/35"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--pg-accent-purple)]/15 text-[var(--pg-accent-purple)]">
              {index % 4 === 0 ? <Sparkles className="size-5" /> : index % 4 === 1 ? <Search className="size-5" /> : index % 4 === 2 ? <Layers3 className="size-5" /> : <Workflow className="size-5" />}
            </span>
            <h3 className="mt-4 line-clamp-1 text-sm font-semibold">{template.name[locale]}</h3>
            <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{template.description[locale]}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{template.stageCount} {locale === 'ar' ? 'مراحل' : 'stages'}</span>
              <span>{text.useTemplate}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProjectDetails({
  project,
  projects,
  templates,
  text,
  locale,
}: {
  project: ProjectGalleryItem | null;
  projects: ProjectGalleryItem[];
  templates: TemplateGalleryItem[];
  text: (typeof copy)['en'];
  locale: 'ar' | 'en';
}) {
  if (!project) {
    return (
      <aside className="rounded-2xl border border-[var(--pg-border-soft)] bg-background/35 p-5">
        <h2 className="text-lg font-semibold">{text.selected}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text.noProjectsSub}</p>
      </aside>
    );
  }

  const related = templates.slice(0, 3);
  const recentSteps = project.project?.steps.slice(0, 3) ?? [];
  const currentStep = project.currentStep ?? project.project?.steps.find((step) => step.status !== 'done') ?? null;

  return (
    <aside className="space-y-4 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto xl:pe-1">
      <section className="rounded-2xl border border-[var(--pg-border-soft)] bg-[linear-gradient(145deg,oklch(0.21_0.04_265_/_0.86),oklch(0.14_0.03_265_/_0.72))] p-5 shadow-[0_24px_80px_oklch(0.04_0.02_265_/_0.38),inset_0_1px_0_oklch(1_0_0_/_0.05)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--pg-accent-purple)]">{text.selected}</p>
            <h2 className="mt-4 text-2xl font-semibold leading-snug">{project.name}</h2>
            <p className="mt-2 text-xs text-muted-foreground">{text.updated} {relativeTime(project.updatedAt, locale)}</p>
          </div>
          <StatusBadge status={project.status} locale={locale} />
        </div>

        <div className="mt-5 rounded-xl border border-[var(--pg-border-soft)] bg-background/26 p-4">
          <GraphPreview project={project} />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--pg-border-soft)] bg-background/26 p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span>{text.totalProgress}</span>
            <span>{project.progress.percent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-background/70">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--pg-accent-purple),var(--pg-accent-blue),oklch(0.78_0.08_245))]" style={{ width: `${project.progress.percent}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <Metric label={text.nodes} value={String(project.stepCount)} />
            <Metric label={text.steps} value={String(project.progress.total)} />
            <Metric label={text.collaborators} value={`+${Math.max(2, project.stackPreview.length)}`} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoCard
            icon={<GitBranch className="size-4" />}
            label={text.currentStep}
            value={currentStep?.title ?? (locale === 'ar' ? 'لا توجد خطوة نشطة' : 'No active step')}
          />
          <InfoCard
            icon={<Clock3 className="size-4" />}
            label={text.blocked}
            value={String(project.blockedCount)}
            tone={project.blockedCount > 0 ? 'danger' : 'success'}
          />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--pg-border-soft)] bg-background/22 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{text.description}</h3>
            <Link href={`/project/${project.id}/memory`} prefetch={false} className="text-xs font-semibold text-[var(--pg-accent-purple)]">
              {locale === 'ar' ? 'عرض المزيد' : 'Show more'}
            </Link>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{project.idea}</p>
        </div>

        {project.stackPreview.length > 0 && (
          <div className="mt-4 rounded-xl border border-[var(--pg-border-soft)] bg-background/22 p-4">
            <h3 className="text-sm font-semibold">{text.stack}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.stackPreview.map((stack) => (
                <span key={stack} className="rounded-lg border border-[var(--pg-border-soft)] bg-background/28 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {stack}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[var(--pg-border-soft)] bg-background/22 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{text.related}</h3>
            <span className="text-xs font-semibold text-[var(--pg-accent-purple)]">({related.length})</span>
          </div>
          <div className="space-y-2">
            {related.map((template, index) => (
              <Link key={template.id} href="/discovery" prefetch={false} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/24 px-3 py-2 transition hover:border-[var(--pg-border-strong)] hover:bg-muted/30">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[var(--pg-accent-cyan)]/15 text-[var(--pg-accent-cyan)]">
                    {index + 1}
                  </span>
                  <span className="truncate text-xs font-medium">{template.name[locale]}</span>
                </div>
                <span className="rounded-md bg-[var(--pg-accent-green)]/15 px-2 py-1 text-[0.65rem] font-semibold text-[var(--pg-accent-green)]">
                  {locale === 'ar' ? 'فتح' : 'Open'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--pg-border-soft)] bg-background/22 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{text.activity}</h3>
            <Link href={`/project/${project.id}/audit`} prefetch={false} className="text-xs font-semibold text-[var(--pg-accent-purple)]">
              {locale === 'ar' ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          <div className="space-y-3">
            {(recentSteps.length ? recentSteps : projects.slice(0, 3)).map((item, index) => (
              <div key={'id' in item ? item.id : index} className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-background/45">
                  {index === 0 ? <Edit3 className="size-3.5" /> : index === 1 ? <Plus className="size-3.5" /> : <Workflow className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{'title' in item ? item.title : item.name}</span>
                <span>{relativeTime(project.updatedAt, locale)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <Link href={`/project/${project.id}`} prefetch={false} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--pg-accent-purple),var(--pg-accent-blue))] text-sm font-semibold text-white shadow-[0_0_34px_oklch(0.56_0.22_292_/_0.3)]">
            <Play className="size-4" />
            {text.open}
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/project/${project.id}/memory`} prefetch={false} className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--pg-border-soft)] bg-background/24 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {text.openMemory}
            </Link>
            <Link href={`/project/${project.id}/audit`} prefetch={false} className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--pg-border-soft)] bg-background/24 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {text.openAudit}
            </Link>
          </div>
        </div>
      </section>
    </aside>
  );
}

function InfoCard({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--pg-accent-green)] bg-[var(--pg-accent-green)]/12'
      : tone === 'danger'
        ? 'text-[var(--pg-accent-danger)] bg-[var(--pg-accent-danger)]/12'
        : 'text-[var(--pg-accent-cyan)] bg-[var(--pg-accent-cyan)]/12';

  return (
    <div className="rounded-xl border border-[var(--pg-border-soft)] bg-background/22 p-3">
      <div className={`inline-flex size-8 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status, locale }: { status: ProjectGalleryItem['status']; locale: 'ar' | 'en' }) {
  const colors = {
    active: 'bg-[var(--pg-accent-green)]/15 text-[var(--pg-accent-green)]',
    blocked: 'bg-[var(--pg-accent-danger)]/15 text-[var(--pg-accent-danger)]',
    complete: 'bg-[var(--pg-accent-blue)]/15 text-[var(--pg-accent-cyan)]',
    draft: 'bg-[var(--pg-accent-amber)]/15 text-[var(--pg-accent-amber)]',
  };

  return (
    <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${colors[status]}`}>
      {statusLabels[locale][status]}
    </span>
  );
}

function projectSelectionHref(
  selected: string,
  filters: { query: string; statusFilter: string; sortBy: string },
) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
  if (filters.sortBy !== 'updated') params.set('sort', filters.sortBy);
  params.set('selected', selected);
  return `/project?${params.toString()}`;
}

function statusFilterHref(status: string, filters: { query: string; sortBy: string }) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (status !== 'all') params.set('status', status);
  if (filters.sortBy !== 'updated') params.set('sort', filters.sortBy);
  return params.size ? `/project?${params.toString()}` : '/project';
}

function relativeTime(iso: string, locale: 'ar' | 'en') {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60000));
  if (minutes < 60) return locale === 'ar' ? `${minutes} د` : `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return locale === 'ar' ? `${hours} س` : `${hours}h`;
  const days = Math.round(hours / 24);
  return locale === 'ar' ? `${days} ي` : `${days}d`;
}
