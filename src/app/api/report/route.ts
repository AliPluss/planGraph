import { NextResponse } from 'next/server';
import { completeStepFromReport } from '@/core/adapters/report-service';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { projectId?: string; stepId?: string; content?: string };
    if (!body.projectId || !body.stepId || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'projectId, stepId, and content are required' }, { status: 422 });
    }

    const project = await completeStepFromReport(body.projectId, body.stepId, body.content);
    return NextResponse.json({ ok: true, data: project });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
