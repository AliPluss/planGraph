import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import { MemoryManager } from '@/core/memory/memory-manager';
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
      stepId?: string;
      category: MemoryEntry['category'];
      text: string;
      path?: string;
      status?: 'open' | 'resolved';
    };

    if (!body.category || !body.text?.trim()) {
      return NextResponse.json(
        { error: 'category and text are required' },
        { status: 422 },
      );
    }

    const project = await storage.readProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date().toISOString();
    const manager = new MemoryManager(storage);
    const stepId = body.stepId ?? 'project';
    let entry: MemoryEntry;
    if (body.category === 'decision') {
      entry = await manager.addDecision(id, stepId, body.text);
    } else if (body.category === 'convention') {
      entry = await manager.addConvention(id, body.text);
    } else if (body.category === 'issue') {
      entry = await manager.addIssue(id, stepId, body.text, body.status ?? 'open');
    } else if (body.category === 'file-map') {
      entry = await manager.addFileMapEntry(id, body.path ?? 'unknown', body.text);
    } else {
      entry = await manager.addNote(id, stepId, body.text);
    }

    project.memory.push(entry);
    project.meta.updatedAt = now;
    await storage.writeProject(project);
    await storage.appendAudit(
      { timestamp: now, action: 'MEMORY_ADDED', projectId: id, stepId },
      id,
    );

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
