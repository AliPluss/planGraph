'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { DashboardProject } from './ProjectGrid';

type Snapshot = Record<string, string>;

function snapshot(projects: DashboardProject[]): Snapshot {
  return Object.fromEntries(
    projects.map((project) => {
      const completed = project.progress.done;
      const current = project.currentStep?.id ?? 'complete';
      return [project.id, `${completed}:${current}:${project.updatedAt}`];
    }),
  );
}

export default function ProjectEventToasts() {
  const previous = useRef<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/project');
        const json = await res.json() as { data?: DashboardProject[] };
        if (cancelled || !json.data) return;

        const next = snapshot(json.data);
        if (previous.current) {
          for (const project of json.data) {
            const before = previous.current[project.id];
            const after = next[project.id];
            const previousDone = Number(before?.split(':')[0] ?? project.progress.done);
            if (after !== before && project.progress.done > previousDone) {
              toast.success(`Step completed in ${project.name}`);
            }
          }
        }
        previous.current = next;
      } catch {
        // Dashboard event polling is best-effort only.
      }
    }

    void poll();
    const interval = window.setInterval(() => void poll(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
