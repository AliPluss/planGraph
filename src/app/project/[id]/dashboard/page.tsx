import * as fs from 'fs/promises';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, FileText, GitBranch, WalletCards } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SnapshotPanel } from '@/components/plangraph/dashboard/SnapshotPanel';
import {
  getCurrentStep,
  getProgress,
  getStats,
  getStatusDistribution,
} from '@/core/analytics/project-analytics';
import { getAuditFile } from '@/core/storage/paths';
import { storage } from '@/core/storage/storage';
import type { AuditEntry, StepStatus } from '@/core/types';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<StepStatus, string> = {
  not_started: 'Not started',
  ready: 'Ready',
  in_progress: 'In progress',
  done: 'Done',
  failed: 'Failed',
  needs_review: 'Needs review',
  blocked: 'Blocked',
};

const STATUS_COLORS: Record<StepStatus, string> = {
  not_started: 'bg-slate-300',
  ready: 'bg-sky-500',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-600',
  failed: 'bg-red-600',
  needs_review: 'bg-orange-500',
  blocked: 'bg-zinc-500',
};

async function readRecentAudit(projectId: string, maxEntries = 10): Promise<AuditEntry[]> {
  const auditPath = getAuditFile(projectId);
  try {
    const stat = await fs.stat(auditPath);
    const handle = await fs.open(auditPath, 'r');
    try {
      const bytesToRead = Math.min(stat.size, 64 * 1024);
      const buffer = Buffer.alloc(bytesToRead);
      await handle.read(buffer, 0, bytesToRead, stat.size - bytesToRead);
      return buffer
        .toString('utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-maxEntries)
        .reverse()
        .map((line) => JSON.parse(line) as AuditEntry);
    } finally {
      await handle.close();
    }
  } catch {
    return [];
  }
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '< 1m';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`;
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await storage.readProject(id);

  if (!project) notFound();

  const progress = getProgress(project);
  const currentStep = getCurrentStep(project);
  const stats = getStats(project);
  const distribution = getStatusDistribution(project);
  const auditEntries = await readRecentAudit(id);
  const snapshotCount = project.steps.filter((step) => step.snapshotBefore).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href={`/project/${id}`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Workspace
          </Link>
          <Link
            href={`/project/${id}/audit`}
            className="mb-3 ms-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Audit
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{project.meta.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {project.meta.templateId.replace(/-/g, ' ')}
            </Badge>
            {currentStep && <Badge variant="outline">Current: {currentStep.title}</Badge>}
          </div>
        </div>

        <div className="w-full max-w-md rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} />
          <p className="mt-2 text-xs text-muted-foreground">
            {progress.done} of {progress.total} steps completed
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="m-0 space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<FileText className="size-4" />} label="Files changed" value={stats.filesChanged?.toString() ?? '—'} />
            <MetricCard icon={<Clock className="size-4" />} label="Time spent" value={formatDuration(stats.totalDurationMs)} />
            <MetricCard icon={<WalletCards className="size-4" />} label="Tokens used" value={stats.tokensUsed?.toLocaleString() ?? '—'} />
            <MetricCard icon={<GitBranch className="size-4" />} label="Snapshots" value={snapshotCount.toString()} />
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Status distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-4 overflow-hidden rounded-full bg-muted">
                {(Object.keys(distribution) as StepStatus[]).map((status) => {
                  const count = distribution[status];
                  if (count === 0 || progress.total === 0) return null;
                  return (
                    <div
                      key={status}
                      className={STATUS_COLORS[status]}
                      style={{ width: `${(count / progress.total) * 100}%` }}
                      title={`${STATUS_LABELS[status]}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(distribution) as StepStatus[]).map((status) => (
                  <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`size-2 rounded-full ${STATUS_COLORS[status]}`} />
                    {STATUS_LABELS[status]}: {distribution[status]}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {auditEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit entries yet.</p>
              ) : (
                <ol className="space-y-3">
                  {auditEntries.map((entry, index) => (
                    <li key={`${entry.timestamp}-${index}`} className="rounded-md border px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {(entry.stepId || entry.details) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.stepId ? `Step: ${entry.stepId}` : ''}
                          {entry.details?.status ? ` Status: ${String(entry.details.status)}` : ''}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="snapshots" className="m-0">
          <SnapshotPanel
            projectId={id}
            projectName={project.meta.name}
            autoSnapshot={project.meta.autoSnapshot !== false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
