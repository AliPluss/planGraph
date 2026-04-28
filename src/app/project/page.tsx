import Link from 'next/link';
import { storage } from '@/core/storage/storage';

export default async function ProjectsIndexPage() {
  const projects = await storage.listProjects();
  const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const latest = sorted[0];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continue an existing PlanGraph workspace or start a new project.
          </p>
        </div>
        <div className="flex gap-2">
          {latest && (
            <Link
              href={`/project/${latest.id}`}
              prefetch={false}
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              Continue last project
            </Link>
          )}
          <Link
            href="/discovery"
            prefetch={false}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New project
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {sorted.map((project) => (
            <li key={project.id}>
              <Link
                href={`/project/${project.id}`}
                prefetch={false}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{project.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{project.templateId.replace(/-/g, ' ')}</span>
                    <span>•</span>
                    <span>{project.selectedExecutor}</span>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={project.updatedAt}>
                  {new Date(project.updatedAt).toLocaleDateString()}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
