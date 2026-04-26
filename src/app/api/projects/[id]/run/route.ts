import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import { getProjectDir } from '@/core/storage/paths';
import { getAdapter } from '@/core/adapters/registry';
import type { ExecutorTool } from '@/core/types';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as { stepId: string };

    if (!body.stepId) {
      return NextResponse.json({ error: 'stepId is required' }, { status: 422 });
    }

    const project = await storage.readProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const step = project.steps.find((s) => s.id === body.stepId);
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

    const executor = project.meta.selectedExecutor as ExecutorTool;
    const adapter = getAdapter(executor);
    const projectRoot = getProjectDir(id);

    const result = await adapter.prepare({
      projectId: id,
      project,
      step,
      projectRoot,
    });

    await storage.appendAudit(
      {
        timestamp: new Date().toISOString(),
        action: 'EXECUTOR_INVOKED',
        projectId: id,
        stepId: body.stepId,
        details: { executor, adapter: adapter.displayName },
      },
      id,
    );

    return NextResponse.json({
      data: {
        instructions: result.instructions,
        promptText: result.promptText,
        promptFilePath: result.promptFilePath,
        executor: adapter.displayName,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
