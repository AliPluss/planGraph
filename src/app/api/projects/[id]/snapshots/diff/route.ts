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
    const body = await req.json() as { tag?: string };
    if (!body.tag) {
      return NextResponse.json({ error: 'tag is required' }, { status: 422 });
    }

    const project = await storage.readProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const manager = new SnapshotManager(getProjectDir(id));
    const diff = await manager.diff(body.tag);
    return NextResponse.json({ data: { diff } });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
