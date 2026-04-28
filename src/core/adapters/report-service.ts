import * as fs from 'fs/promises';
import * as path from 'path';
import { SafeWriter } from '../security/safe-writer';
import { inputSanitizer } from '../security/input-sanitizer';
import { pathGuard } from '../security/path-guard';
import { storage } from '../storage/storage';
import { getProjectDir } from '../storage/paths';
import type { Project, ReportSummary } from '../types';

const writer = new SafeWriter();

export async function completeStepFromReport(
  projectId: string,
  stepId: string,
  content: string,
  reportSummary?: ReportSummary,
): Promise<Project> {
  const project = await storage.readProject(projectId);
  if (!project) throw new Error('Project not found');

  const stepIndex = project.steps.findIndex((step) => step.id === stepId);
  if (stepIndex === -1) throw new Error('Step not found');

  const projectRoot = getProjectDir(projectId);
  const reportsDir = pathGuard.resolveSafe('reports', projectRoot);
  await fs.mkdir(reportsDir, { recursive: true });

  const reportFile = pathGuard.resolveSafe(`${stepId}_report.md`, reportsDir);
  const sanitized = inputSanitizer.sanitizeForLog(content);
  await writer.writeText(reportFile, sanitized);

  const now = new Date().toISOString();
  const nextStatus = reportSummary?.status === 'error' ? 'failed' : 'done';
  const relativeReportFile = path.join('reports', `${stepId}_report.md`).replace(/\\/g, '/');

  project.steps[stepIndex] = {
    ...project.steps[stepIndex],
    status: nextStatus,
    reportFile: relativeReportFile,
    completedAt: now,
    startedAt: project.steps[stepIndex].startedAt ?? now,
  };

  if (nextStatus === 'done') {
    const doneIds = new Set(project.steps.filter((step) => step.status === 'done').map((step) => step.id));
    for (let i = 0; i < project.steps.length; i++) {
      const step = project.steps[i];
      if (step.status !== 'not_started' && step.status !== 'blocked') continue;
      const depsDone = step.dependsOn.every((dep) => doneIds.has(dep));
      if (depsDone && step.dependsOn.length > 0) {
        project.steps[i] = { ...step, status: 'ready' };
      }
    }
  }

  project.meta.updatedAt = now;
  await storage.writeProject(project);

  await storage.appendAudit(
    {
      timestamp: now,
      action: 'REPORT_DETECTED',
      projectId,
      stepId,
      details: { reportFile: relativeReportFile },
    },
    projectId,
  );
  await storage.appendAudit(
    {
      timestamp: now,
      action: nextStatus === 'failed' ? 'STEP_FAILED' : 'STEP_COMPLETED',
      projectId,
      stepId,
      details: { status: nextStatus, reportFile: relativeReportFile },
    },
    projectId,
  );

  return project;
}
