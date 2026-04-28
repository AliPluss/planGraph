import { NextResponse } from 'next/server';
import { MemoryManager } from '@/core/memory/memory-manager';
import { storage } from '@/core/storage/storage';
import type { MemoryEntry } from '@/core/types';

const manager = new MemoryManager(storage);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 422 });
  }

  const project = await storage.readProject(projectId);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const content = await storage.readMemory(projectId);
  return NextResponse.json({ content });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      projectId: string;
      category: MemoryEntry['category'];
      stepId?: string;
      text: string;
      path?: string;
      status?: 'open' | 'resolved';
    };

    if (!body.projectId || !body.category || !body.text?.trim()) {
      return NextResponse.json(
        { error: 'projectId, category, and text are required' },
        { status: 422 },
      );
    }

    const project = await storage.readProject(body.projectId);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const stepId = body.stepId ?? 'project';
    let entry: MemoryEntry;
    if (body.category === 'decision') {
      entry = await manager.addDecision(body.projectId, stepId, body.text);
    } else if (body.category === 'convention') {
      entry = await manager.addConvention(body.projectId, body.text);
    } else if (body.category === 'issue') {
      entry = await manager.addIssue(body.projectId, stepId, body.text, body.status ?? 'open');
    } else if (body.category === 'file-map') {
      entry = await manager.addFileMapEntry(body.projectId, body.path ?? 'unknown', body.text);
    } else {
      entry = await manager.addNote(body.projectId, stepId, body.text);
    }

    const now = new Date().toISOString();
    project.memory.push(entry);
    project.meta.updatedAt = now;
    await storage.writeProject(project);
    await storage.appendAudit(
      { timestamp: now, action: 'MEMORY_ADDED', projectId: body.projectId, stepId },
      body.projectId,
    );

    return NextResponse.json({
      entry,
      content: await storage.readMemory(body.projectId),
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
