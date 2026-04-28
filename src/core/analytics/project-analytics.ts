import type { Project, Step, StepStatus } from '@/core/types';

export function getProgress(project: Project): { done: number; total: number; percent: number } {
  const total = project.steps.length;
  const done = project.steps.filter((step) => step.status === 'done').length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

export function getCurrentStep(project: Project): Step | null {
  return (
    project.steps.find((step) => step.status === 'in_progress') ??
    project.steps.find((step) => step.status === 'ready') ??
    project.steps.find((step) => step.status === 'not_started') ??
    null
  );
}

export function getNextSteps(project: Project, n = 3): Step[] {
  const candidates = project.executionOrder
    .map((stepId) => project.steps.find((step) => step.id === stepId))
    .filter((step): step is Step => Boolean(step))
    .filter((step) => step.status === 'ready' || step.status === 'not_started');

  return candidates.slice(0, n);
}

export function getStats(project: Project): {
  filesChanged?: number;
  tokensUsed?: number;
  costUsd?: number;
  totalDurationMs?: number;
} {
  const stats = project.steps.reduce(
    (acc, step) => {
      const log = step.executionLog;
      if (!log) return acc;

      acc.totalDurationMs += log.durationMs ?? 0;
      acc.tokensUsed += (log.tokens?.input ?? 0) + (log.tokens?.output ?? 0);
      acc.costUsd += log.costUsd ?? 0;
      acc.hasExecutionLog = true;
      return acc;
    },
    { tokensUsed: 0, costUsd: 0, totalDurationMs: 0, hasExecutionLog: false },
  );

  return {
    filesChanged: undefined,
    tokensUsed: stats.hasExecutionLog ? stats.tokensUsed : undefined,
    costUsd: stats.hasExecutionLog ? stats.costUsd : undefined,
    totalDurationMs: stats.hasExecutionLog ? stats.totalDurationMs : undefined,
  };
}

export function getStatusDistribution(project: Project): Record<StepStatus, number> {
  return project.steps.reduce<Record<StepStatus, number>>(
    (acc, step) => {
      acc[step.status] += 1;
      return acc;
    },
    {
      not_started: 0,
      ready: 0,
      in_progress: 0,
      done: 0,
      failed: 0,
      needs_review: 0,
      blocked: 0,
    },
  );
}
