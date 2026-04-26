'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import Link from 'next/link';
import type { ProjectMeta, Step } from '@/core/types';

interface ProjectListItem extends ProjectMeta {
  stepsDone: number;
  stepsTotal: number;
}

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) {
          router.replace('/onboarding');
        } else {
          setChecking(false);
          loadProjects();
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  function loadProjects() {
    fetch('/api/projects')
      .then((r) => r.json())
      .then(async ({ data }: { data?: ProjectMeta[] }) => {
        if (!data) return;
        // Enrich each meta with step progress from full project
        const enriched = await Promise.all(
          data.map(async (meta) => {
            try {
              const res = await fetch(`/api/projects/${meta.id}`);
              const { data: proj } = await res.json() as { data?: { steps: Step[] } };
              const steps: Step[] = proj?.steps ?? [];
              return {
                ...meta,
                stepsDone: steps.filter((s) => s.status === 'done').length,
                stepsTotal: steps.length,
              };
            } catch {
              return { ...meta, stepsDone: 0, stepsTotal: 0 };
            }
          }),
        );
        // Sort by most recently updated
        enriched.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setProjects(enriched);
      })
      .catch(() => {});
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 p-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">{t('home.welcome')}</h1>
        <p className="text-muted-foreground text-lg mb-6">{t('app.tagline')}</p>
        <Link
          href="/discovery"
          prefetch={false}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('home.newProject')}
        </Link>
      </div>

      {/* Recent projects */}
      <div className="w-full max-w-2xl">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t('home.recentProjects')}
        </h2>

        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('home.noProjects')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} t={t} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  t,
}: {
  project: ProjectListItem;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const pct = project.stepsTotal > 0
    ? Math.round((project.stepsDone / project.stepsTotal) * 100)
    : 0;

  return (
    <li>
      <Link
        href={`/project/${project.id}`}
        prefetch={false}
        className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {project.name}
            </span>
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize shrink-0">
              {project.templateId.replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {t('home.projectStepsDone', { done: project.stepsDone, total: project.stepsTotal })}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </Link>
    </li>
  );
}
