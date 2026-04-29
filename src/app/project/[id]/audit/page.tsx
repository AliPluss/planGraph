import * as fs from 'fs/promises';
import * as path from 'path';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { AuditLogViewer } from '@/components/plangraph/audit/AuditLogViewer';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { inputSanitizer } from '@/core/security/input-sanitizer';
import { getAuditFile, getReportsDir } from '@/core/storage/paths';
import { storage } from '@/core/storage/storage';
import type { AuditEntry, Project, Step } from '@/core/types';

export const dynamic = 'force-dynamic';

async function readAuditTail(projectId: string, maxBytes = 512 * 1024): Promise<AuditEntry[]> {
  const auditPath = getAuditFile(projectId);
  try {
    const stat = await fs.stat(auditPath);
    const handle = await fs.open(auditPath, 'r');
    try {
      const bytesToRead = Math.min(stat.size, maxBytes);
      const buffer = Buffer.alloc(bytesToRead);
      await handle.read(buffer, 0, bytesToRead, stat.size - bytesToRead);
      return buffer
        .toString('utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as AuditEntry)
        .reverse()
        .map(sanitizeEntry);
    } finally {
      await handle.close();
    }
  } catch {
    return [];
  }
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return inputSanitizer.sanitizeForLog(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        inputSanitizer.sanitizeForLog(key),
        sanitizeValue(item),
      ]),
    );
  }
  return value;
}

function sanitizeEntry(entry: AuditEntry): AuditEntry {
  return {
    timestamp: inputSanitizer.sanitizeForLog(entry.timestamp),
    action: entry.action,
    projectId: entry.projectId ? inputSanitizer.sanitizeForLog(entry.projectId) : undefined,
    stepId: entry.stepId ? inputSanitizer.sanitizeForLog(entry.stepId) : undefined,
    details: entry.details ? sanitizeValue(entry.details) as Record<string, unknown> : undefined,
  };
}

type IssueSeverity = 'critical' | 'warning' | 'info';

interface IssueRow {
  id: string;
  check: string;
  target: string;
  severity: IssueSeverity;
  status: 'Pass' | 'Review';
  detail: string;
}

interface ReportCard {
  stepId: string;
  title: string;
  path: string;
  exists: boolean;
  validation: 'Passed' | 'Failed' | 'Not run';
  updatedAt?: string;
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await storage.readProject(id);
  if (!project) notFound();

  const entries = await readAuditTail(id);
  const issues = buildIssueRows(project);
  const reports = await buildReportCards(project);
  const health = getHealth(project, issues, reports);
  const criticalCount = issues.filter((issue) => issue.severity === 'critical' && issue.status === 'Review').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning' && issue.status === 'Review').length;
  const passedChecks = issues.filter((issue) => issue.status === 'Pass').length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href={`/project/${id}`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Workspace
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pg-text-faint)]">
            Validation, audit, and reports
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{project.meta.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review project health, validation checks, execution reports, and the local audit trail without changing workspace data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/project/${id}/memory`} prefetch={false} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <FolderOpen className="size-3.5" />
            Open library
          </Link>
          <Link href={`/execution?project=${id}`} prefetch={false} className={buttonVariants({ size: 'sm' })}>
            <FileText className="size-3.5" />
            Execution reports
          </Link>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          icon={<ClipboardCheck className="size-4" />}
          label="Health score"
          value={`${health}%`}
          detail={health >= 85 ? 'Project checks look stable' : 'Review the checks below'}
          tone={health >= 85 ? 'green' : health >= 65 ? 'amber' : 'danger'}
        />
        <HealthCard
          icon={<ShieldAlert className="size-4" />}
          label="Critical issues"
          value={criticalCount.toString()}
          detail="Failed steps, blockers, and failed validation"
          tone={criticalCount > 0 ? 'danger' : 'green'}
        />
        <HealthCard
          icon={<TriangleAlert className="size-4" />}
          label="Warnings"
          value={warningCount.toString()}
          detail="Missing reports or steps needing review"
          tone={warningCount > 0 ? 'amber' : 'green'}
        />
        <HealthCard
          icon={<CheckCircle2 className="size-4" />}
          label="Checks passed"
          value={passedChecks.toString()}
          detail={`${issues.length} total checks tracked`}
          tone="cyan"
        />
      </section>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Checks and issues</PanelTitle>
            <PanelDescription>Derived from step status, validation reports, and expected local report files.</PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          <div className="overflow-hidden rounded-lg border border-[var(--pg-border-soft)]">
            <div className="grid grid-cols-[8rem_1fr_7rem] gap-3 border-b border-[var(--pg-border-soft)] bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid-cols-[11rem_minmax(0,1fr)_9rem_7rem]">
              <span>Check</span>
              <span>Detail</span>
              <span className="hidden md:block">Target</span>
              <span>Status</span>
            </div>
            {issues.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">No validation checks are available yet.</p>
            ) : (
              <div className="divide-y divide-[var(--pg-border-soft)]">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="grid grid-cols-[8rem_1fr_7rem] gap-3 px-4 py-3 text-sm md:grid-cols-[11rem_minmax(0,1fr)_9rem_7rem]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{issue.check}</p>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="min-w-0 leading-5 text-muted-foreground">{issue.detail}</p>
                    <p className="hidden min-w-0 truncate font-mono text-xs text-muted-foreground md:block">{issue.target}</p>
                    <Badge variant={issue.status === 'Pass' ? 'green' : severityVariant(issue.severity)}>
                      {issue.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PanelContent>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <AuditLogViewer entries={entries} />

        <Panel className="h-fit">
          <PanelHeader>
            <div>
              <PanelTitle>Reports</PanelTitle>
              <PanelDescription>Report cards show what PlanGraph can currently locate.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            {reports.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--pg-border-soft)] bg-background/25 p-4 text-sm text-muted-foreground">
                No report metadata has been recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <article key={report.stepId} className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold">{report.title}</h2>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{report.path}</p>
                      </div>
                      <Badge variant={report.exists ? 'green' : 'outline'}>{report.exists ? 'Found' : 'Expected'}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={report.validation === 'Passed' ? 'green' : report.validation === 'Failed' ? 'destructive' : 'outline'}>
                        {report.validation}
                      </Badge>
                      {report.updatedAt && <span>{report.updatedAt}</span>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/project/${id}/memory`}
                        prefetch={false}
                        className={buttonVariants({ variant: 'outline', size: 'xs' })}
                      >
                        Open report
                      </Link>
                      <Link
                        href={`/execution?project=${id}&step=${report.stepId}`}
                        prefetch={false}
                        className={buttonVariants({ variant: 'ghost', size: 'xs' })}
                      >
                        Execution view
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </PanelContent>
        </Panel>
      </section>
    </div>
  );
}

function buildIssueRows(project: Project): IssueRow[] {
  const rows: IssueRow[] = [
    {
      id: 'project-has-steps',
      check: 'Project structure',
      target: project.meta.id,
      severity: 'critical',
      status: project.steps.length > 0 ? 'Pass' : 'Review',
      detail: project.steps.length > 0 ? `${project.steps.length} graph steps are available.` : 'Project has no graph steps.',
    },
  ];

  for (const step of project.steps) {
    if (step.status === 'failed' || step.status === 'blocked') {
      rows.push({
        id: `${step.id}:status`,
        check: 'Step status',
        target: step.id,
        severity: 'critical',
        status: 'Review',
        detail: `${step.title} is ${step.status.replace(/_/g, ' ')}.`,
      });
    }

    if (step.status === 'needs_review') {
      rows.push({
        id: `${step.id}:review`,
        check: 'Needs review',
        target: step.id,
        severity: 'warning',
        status: 'Review',
        detail: `${step.title} completed with review required.`,
      });
    }

    if (step.status === 'done' && !step.reportFile) {
      rows.push({
        id: `${step.id}:missing-report`,
        check: 'Report present',
        target: step.id,
        severity: 'warning',
        status: 'Review',
        detail: `${step.title} is done but no report file is recorded on the step.`,
      });
    }

    if (step.validationReport) {
      rows.push(...validationRows(step));
    }
  }

  return rows;
}

function validationRows(step: Step): IssueRow[] {
  const report = step.validationReport;
  if (!report) return [];

  const rows: IssueRow[] = [
    {
      id: `${step.id}:protected-files`,
      check: 'Protected files',
      target: step.id,
      severity: 'critical',
      status: report.checks.protectedFiles.passed ? 'Pass' : 'Review',
      detail: report.checks.protectedFiles.passed
        ? 'No protected file violations were reported.'
        : report.checks.protectedFiles.violations.join(', '),
    },
    {
      id: `${step.id}:secret-leaks`,
      check: 'Secret leaks',
      target: step.id,
      severity: 'critical',
      status: report.checks.secretLeaks.passed ? 'Pass' : 'Review',
      detail: report.checks.secretLeaks.passed
        ? 'No secret patterns were reported.'
        : report.checks.secretLeaks.matches.map((match) => `${match.file}: ${match.pattern}`).join(', '),
    },
    {
      id: `${step.id}:build`,
      check: 'Build still works',
      target: step.id,
      severity: 'warning',
      status: !report.checks.buildStillWorks.ran || report.checks.buildStillWorks.passed ? 'Pass' : 'Review',
      detail: report.checks.buildStillWorks.ran
        ? report.checks.buildStillWorks.passed ? 'Build check passed.' : report.checks.buildStillWorks.output ?? 'Build check failed.'
        : 'Build check was skipped.',
    },
    {
      id: `${step.id}:report-present`,
      check: 'Report present',
      target: step.id,
      severity: 'warning',
      status: report.checks.reportPresent.passed ? 'Pass' : 'Review',
      detail: report.checks.reportPresent.path ?? `reports/${step.id}_report.md`,
    },
  ];

  return rows;
}

async function buildReportCards(project: Project): Promise<ReportCard[]> {
  const reportSteps = project.steps.filter((step) => step.reportFile || step.validationReport || step.executionLog || step.status === 'done');
  const reportsDir = getReportsDir(project.meta.id);

  return Promise.all(reportSteps.map(async (step) => {
    const reportPath = step.reportFile ?? `reports/${step.id}_report.md`;
    const fileName = path.basename(reportPath);
    let exists = false;
    let updatedAt: string | undefined;

    try {
      const stat = await fs.stat(path.join(reportsDir, fileName));
      exists = stat.isFile();
      updatedAt = stat.mtime.toLocaleString();
    } catch {
      exists = false;
    }

    return {
      stepId: step.id,
      title: step.title,
      path: reportPath,
      exists,
      validation: step.validationReport ? step.validationReport.passed ? 'Passed' : 'Failed' : 'Not run',
      updatedAt,
    };
  }));
}

function getHealth(project: Project, issues: IssueRow[], reports: ReportCard[]): number {
  const doneRatio = project.steps.length === 0
    ? 0
    : project.steps.filter((step) => step.status === 'done').length / project.steps.length;
  const criticalPenalty = issues.filter((issue) => issue.status === 'Review' && issue.severity === 'critical').length * 18;
  const warningPenalty = issues.filter((issue) => issue.status === 'Review' && issue.severity === 'warning').length * 7;
  const missingReportPenalty = reports.filter((report) => !report.exists).length * 3;
  return Math.max(0, Math.min(100, Math.round(55 + doneRatio * 45 - criticalPenalty - warningPenalty - missingReportPenalty)));
}

function HealthCard({
  detail,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  tone: 'cyan' | 'danger' | 'green' | 'amber';
  value: string;
}) {
  const toneClass = {
    amber: 'bg-[var(--pg-accent-amber)]/12 text-[var(--pg-accent-amber)]',
    cyan: 'bg-[var(--pg-accent-cyan)]/12 text-[var(--pg-accent-cyan)]',
    danger: 'bg-[var(--pg-accent-danger)]/12 text-[var(--pg-accent-danger)]',
    green: 'bg-[var(--pg-accent-green)]/12 text-[var(--pg-accent-green)]',
  }[tone];

  return (
    <article className="pg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`inline-flex size-9 items-center justify-center rounded-lg ${toneClass}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
    </article>
  );
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return (
    <Badge variant={severityVariant(severity)} className="mt-1 capitalize">
      {severity}
    </Badge>
  );
}

function severityVariant(severity: IssueSeverity): 'amber' | 'cyan' | 'destructive' {
  if (severity === 'critical') return 'destructive';
  if (severity === 'warning') return 'amber';
  return 'cyan';
}
