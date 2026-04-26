import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import type { StepStatus } from '@/core/types';

type RouteParams = { params: Promise<{ id: string; stepId: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id, stepId } = await params;
    const body = await req.json() as { status: StepStatus };

    if (!body.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 422 });
    }

    const project = await storage.readProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const stepIndex = project.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    const step = project.steps[stepIndex];
    const now = new Date().toISOString();
    const newStatus = body.status;

    // Apply timestamps
    const updates: Partial<typeof step> = { status: newStatus };
    if (newStatus === 'in_progress' && !step.startedAt) {
      updates.startedAt = now;
    }
    if (newStatus === 'done' || newStatus === 'failed') {
      updates.completedAt = now;
    }
    if (newStatus === 'not_started') {
      updates.startedAt = undefined;
      updates.completedAt = undefined;
    }

    project.steps[stepIndex] = { ...step, ...updates };

    // Propagate readiness: when a step is done, unlock dependent steps
    if (newStatus === 'done') {
      const doneIds = new Set(project.steps.filter((s) => s.status === 'done').map((s) => s.id));
      for (let i = 0; i < project.steps.length; i++) {
        const s = project.steps[i];
        if (s.status !== 'not_started' && s.status !== 'blocked') continue;
        const allDepsDone = s.dependsOn.every((dep) => doneIds.has(dep));
        if (allDepsDone && s.dependsOn.length > 0) {
          project.steps[i] = { ...s, status: 'ready' };
        }
      }
    }

    // Propagate blocked: when a step fails, block its direct dependents that are ready/not_started
    if (newStatus === 'failed') {
      for (let i = 0; i < project.steps.length; i++) {
        const s = project.steps[i];
        if (s.status !== 'ready' && s.status !== 'not_started') continue;
        if (s.dependsOn.includes(stepId)) {
          project.steps[i] = { ...s, status: 'blocked' };
        }
      }
    }

    project.meta.updatedAt = now;
    await storage.writeProject(project);

    const auditAction =
      newStatus === 'in_progress' ? 'STEP_STARTED' :
      newStatus === 'done'        ? 'STEP_COMPLETED' :
      newStatus === 'failed'      ? 'STEP_FAILED'    : 'STEP_STARTED';

    await storage.appendAudit(
      { timestamp: now, action: auditAction, projectId: id, stepId, details: { status: newStatus } },
      id,
    );

    return NextResponse.json({ data: project });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
