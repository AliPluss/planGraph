import { NextResponse } from 'next/server';
import { getProjectDir } from '@/core/storage/paths';
import { storage } from '@/core/storage/storage';
import { SnapshotManager } from '@/core/snapshots/snapshot-manager';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json() as { tag?: string; projectName?: string };
    if (!body.tag || !body.projectName) {
      return NextResponse.json({ error: 'tag and projectName are required' }, { status: 422 });
    }

    const project = await storage.readProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (body.projectName !== project.meta.name) {
      return NextResponse.json({ error: 'Project name confirmation does not match' }, { status: 422 });
    }

    const manager = new SnapshotManager(getProjectDir(id));
    await manager.rollbackConfirmed(body.tag);

    await storage.appendAudit(
      {
        timestamp: new Date().toISOString(),
        action: 'ROLLBACK_PERFORMED',
        projectId: id,
        details: { tag: body.tag },
      },
      id,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
