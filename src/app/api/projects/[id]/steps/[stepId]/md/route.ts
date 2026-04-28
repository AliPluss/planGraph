import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';

type RouteParams = { params: Promise<{ id: string; stepId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id, stepId } = await params;
  const content = await storage.readStepMd(id, stepId);

  if (content === null) {
    return NextResponse.json({ error: 'Step markdown not found' }, { status: 404 });
  }

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
