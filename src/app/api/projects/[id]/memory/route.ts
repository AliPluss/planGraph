import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import type { MemoryEntry } from '@/core/types';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = await storage.readProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: project.memory });
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      stepId: string;
      category: MemoryEntry['category'];
      text: string;
    };

    if (!body.stepId || !body.category || !body.text?.trim()) {
      return NextResponse.json(
        { error: 'stepId, category, and text are required' },
        { status: 422 },
      );
    }

    const project = await storage.readProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      stepId: body.stepId,
      category: body.category,
      text: body.text.trim(),
      createdAt: now,
    };

    project.memory.push(entry);
    project.meta.updatedAt = now;
    await storage.writeProject(project);
    await storage.appendMemory(id, entry);
    await storage.appendAudit(
      { timestamp: now, action: 'MEMORY_ADDED', projectId: id, stepId: body.stepId },
      id,
    );

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
