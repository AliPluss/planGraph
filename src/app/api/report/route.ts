import { NextResponse } from 'next/server';
import { completeStepFromReport } from '@/core/adapters/report-service';
import type { ReportSummary } from '@/core/types';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      projectId?: string;
      stepId?: string;
      content?: string;
      reportSummary?: ReportSummary;
    };
    if (!body.projectId || !body.stepId || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'projectId, stepId, and content are required' }, { status: 422 });
    }

    const result = await completeStepFromReport(body.projectId, body.stepId, body.content, body.reportSummary);
    return NextResponse.json({ ok: true, data: result.project, validationReport: result.validationReport });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
