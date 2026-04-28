import { NextResponse } from 'next/server';
import { getAdapter } from '@/core/adapters/registry';
import { buildRichPrompt } from '@/core/markdown/md-writer';
import { getProjectDir } from '@/core/storage/paths';
import { storage } from '@/core/storage/storage';
import type { ExecutorTool, Step } from '@/core/types';

type RouteParams = { params: Promise<{ id: string }> };

function pickStep(steps: Step[], stepId?: string): Step | undefined {
  if (stepId) return steps.find((step) => step.id === stepId);
  return steps.find((step) => step.status === 'in_progress')
    ?? steps.find((step) => step.status === 'ready')
    ?? steps.find((step) => step.status === 'not_started')
    ?? steps[0];
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      executor?: ExecutorTool;
      stepId?: string;
    };

    if (!body.executor) {
      return NextResponse.json({ error: 'executor is required' }, { status: 422 });
    }

    const project = await storage.readProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const adapter = getAdapter(body.executor);
    if (!adapter) {
      return NextResponse.json({ error: 'adapter not implemented yet' }, { status: 501 });
    }

    const step = pickStep(project.steps, body.stepId);
    if (!step) {
      return NextResponse.json({ error: 'No step available to prepare' }, { status: 422 });
    }

    const promptText = buildRichPrompt(
      step,
      project,
      body.executor,
      await storage.readMemory(id),
    );
    const result = await adapter.prepare({
      projectId: id,
      project,
      step,
      promptText,
      projectRoot: getProjectDir(id),
      storage,
    });

    await storage.appendAudit(
      {
        timestamp: new Date().toISOString(),
        action: 'EXECUTOR_INVOKED',
        projectId: id,
        stepId: step.id,
        details: {
          executor: body.executor,
          adapter: adapter.displayName,
          mode: 'prepare',
          autoRunning: false,
        },
      },
      id,
    );

    return NextResponse.json({
      data: {
        instructions: result.instructionsForUser ?? result.instructions,
        promptText: result.promptText,
        promptFilePath: result.promptFilePath,
        executor: adapter.displayName,
        stepId: step.id,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
