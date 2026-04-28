import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import { getProjectDir } from '@/core/storage/paths';
import { getAdapter } from '@/core/adapters/registry';
import { buildRichPrompt } from '@/core/markdown/md-writer';
import type { ExecutorTool } from '@/core/types';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as { stepId: string; executor?: ExecutorTool };

    if (!body.stepId) {
      return NextResponse.json({ error: 'stepId is required' }, { status: 422 });
    }

    const project = await storage.readProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const step = project.steps.find((s) => s.id === body.stepId);
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

    const executor = body.executor ?? project.meta.selectedExecutor as ExecutorTool;
    const adapter = getAdapter(executor);
    if (!adapter) {
      return NextResponse.json({ error: 'adapter not implemented yet' }, { status: 501 });
    }
    const projectRoot = getProjectDir(id);
    const promptText = buildRichPrompt(
      step,
      project,
      executor,
      await storage.readMemory(id),
    );

    const now = new Date().toISOString();
    const stepIndex = project.steps.findIndex((s) => s.id === body.stepId);
    project.steps[stepIndex] = {
      ...step,
      status: 'in_progress',
      startedAt: step.startedAt ?? now,
    };
    project.meta.selectedExecutor = executor;
    project.meta.updatedAt = now;
    await storage.writeProject(project);

    const ctx = { projectId: id, project, step: project.steps[stepIndex], promptText, projectRoot, storage };
    const result = await adapter.prepare(ctx);

    // Fire-and-forget for adapters that support auto-execution
    if (adapter.executeAsync) {
      void adapter.executeAsync(ctx).catch((err: unknown) => {
        console.error('[run] executeAsync error:', String(err));
      });
    }

    await storage.appendAudit(
      {
        timestamp: now,
        action: 'STEP_STARTED',
        projectId: id,
        stepId: body.stepId,
        details: { executor },
      },
      id,
    );
    await storage.appendAudit(
      {
        timestamp: now,
        action: 'EXECUTOR_INVOKED',
        projectId: id,
        stepId: body.stepId,
        details: { executor, adapter: adapter.displayName, autoRunning: result.autoRunning ?? false },
      },
      id,
    );

    return NextResponse.json({
      data: {
        instructions: result.instructions,
        supportsAutoRun: adapter.supportsAutoRun,
        promptText: result.promptText,
        promptFilePath: result.promptFilePath,
        executor: adapter.displayName,
        autoRunning: result.autoRunning ?? false,
        handleId: result.handleId,
        project,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
