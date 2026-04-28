import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import { getProjectDir } from '@/core/storage/paths';
import { getAdapter } from '@/core/adapters/registry';
import { buildRichPrompt } from '@/core/markdown/md-writer';
import type { ExecutorTool } from '@/core/types';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      projectId?: string;
      stepId?: string;
      executor?: ExecutorTool;
      mode?: 'open-terminal' | 'subprocess';
    };
    if (!body.projectId || !body.stepId || !body.executor) {
      return NextResponse.json({ error: 'projectId, stepId, and executor are required' }, { status: 422 });
    }

    const project = await storage.readProject(body.projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const stepIndex = project.steps.findIndex((step) => step.id === body.stepId);
    if (stepIndex === -1) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

    const adapter = getAdapter(body.executor);
    if (!adapter) {
      return NextResponse.json({ error: 'adapter not implemented yet' }, { status: 501 });
    }

    const now = new Date().toISOString();
    const step = project.steps[stepIndex];
    project.steps[stepIndex] = { ...step, status: 'in_progress', startedAt: step.startedAt ?? now };
    project.meta.selectedExecutor = body.executor;
    project.meta.updatedAt = now;
    await storage.writeProject(project);

    const promptText = buildRichPrompt(
      project.steps[stepIndex],
      project,
      body.executor,
      await storage.readMemory(body.projectId),
    );

    const result = await adapter.prepare({
      projectId: body.projectId,
      project,
      step: project.steps[stepIndex],
      promptText,
      projectRoot: getProjectDir(body.projectId),
      storage,
    });
    if (body.executor === 'claude-code' && body.mode === 'subprocess' && adapter.run) {
      const handle = await adapter.run({
        projectId: body.projectId,
        project,
        step: project.steps[stepIndex],
        promptText,
        projectRoot: getProjectDir(body.projectId),
        storage,
      });
      result.autoRunning = true;
      result.handleId = handle.id;
    }

    await storage.appendAudit(
      {
        timestamp: now,
        action: 'STEP_STARTED',
        projectId: body.projectId,
        stepId: body.stepId,
        details: { executor: body.executor },
      },
      body.projectId,
    );
    await storage.appendAudit(
      {
        timestamp: now,
        action: 'EXECUTOR_INVOKED',
        projectId: body.projectId,
        stepId: body.stepId,
        details: {
          executor: body.executor,
          adapter: adapter.displayName,
          mode: body.mode ?? 'open-terminal',
          autoRunning: result.autoRunning ?? false,
        },
      },
      body.projectId,
    );

    return NextResponse.json({
      ok: true,
      instructions: result.instructionsForUser ?? result.instructions,
      supportsAutoRun: adapter.supportsAutoRun,
      autoRunning: result.autoRunning ?? false,
      handleId: result.handleId,
      project,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
