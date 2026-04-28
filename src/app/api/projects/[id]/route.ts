import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import type { ExecutorTool } from '@/core/types';

const EXECUTOR_TOOLS: ExecutorTool[] = ['claude-code', 'cursor', 'antigravity', 'copilot', 'manual'];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await storage.readProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ data: project });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      selectedExecutor?: ExecutorTool;
      name?: string;
      autoSnapshot?: boolean;
    };
    const project = await storage.readProject(id);

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (body.selectedExecutor !== undefined) {
      if (!EXECUTOR_TOOLS.includes(body.selectedExecutor)) {
        return NextResponse.json({ error: 'Invalid executor' }, { status: 422 });
      }
      project.meta.selectedExecutor = body.selectedExecutor;
    }

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: 'Project name cannot be empty' }, { status: 422 });
      }
      project.meta.name = name.slice(0, 100);
    }

    if (body.autoSnapshot !== undefined) {
      project.meta.autoSnapshot = body.autoSnapshot;
    }

    project.meta.updatedAt = new Date().toISOString();
    await storage.writeProject(project);

    return NextResponse.json({ data: project });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await storage.readProject(id);

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await storage.deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
