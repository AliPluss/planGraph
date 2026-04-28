'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import type { ProjectMeta, Step } from '@/core/types';

export interface DashboardProject extends ProjectMeta {
  progress: { done: number; total: number; percent: number };
  currentStep: Step | null;
}

function relativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ProjectGrid() {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    const res = await fetch('/api/project');
    const json = await res.json() as { data?: DashboardProject[]; error?: string };
    if (!res.ok) throw new Error(json.error ?? 'Could not load projects');
    setProjects(json.data ?? []);
  };

  useEffect(() => {
    loadProjects()
      .catch((error: unknown) => toast.error(String(error)))
      .finally(() => setLoading(false));
  }, []);

  const hasProjects = projects.length > 0;
  const lastProject = useMemo(() => projects[0], [projects]);

  async function renameProject(project: DashboardProject) {
    const nextName = window.prompt('Rename project', project.name)?.trim();
    if (!nextName || nextName === project.name) return;

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nextName }),
    });

    if (!res.ok) {
      toast.error('Rename failed');
      return;
    }

    toast.success('Project renamed');
    await loadProjects();
  }

  async function deleteProject(project: DashboardProject) {
    if (!window.confirm(`Delete "${project.name}"? The project will move to workspace/.trash.`)) return;

    const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }

    toast.success('Project deleted');
    await loadProjects();
  }

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-44 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!hasProjects) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="text-sm font-medium">No projects yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Start with a new project and your plan will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lastProject && (
        <Link
          href={`/project/${lastProject.id}`}
          className="inline-flex rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Continue last project: <span className="ms-1 text-foreground">{lastProject.name}</span>
        </Link>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="rounded-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{project.name}</CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {project.templateId.replace(/-/g, ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(project.updatedAt)}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
                  aria-label="Project actions"
                >
                    <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { window.location.href = `/project/${project.id}`; }}>
                    <FolderOpen className="size-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void renameProject(project)}>
                    <Pencil className="size-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => void deleteProject(project)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <CardContent className="space-y-4">
              <Link href={`/project/${project.id}`} className="block space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {project.progress.done} / {project.progress.total} steps done
                  </span>
                  <span className="font-medium">{project.progress.percent}%</span>
                </div>
                <Progress value={project.progress.percent} />
              </Link>

              <div className="min-h-10 rounded-md bg-muted px-3 py-2">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Current step</p>
                <p className="mt-0.5 line-clamp-1 text-sm">
                  {project.currentStep?.title ?? 'All steps completed'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
