import { NextResponse } from 'next/server';
import { getProjectDir } from '@/core/storage/paths';
import { storage } from '@/core/storage/storage';
import { SnapshotManager } from '@/core/snapshots/snapshot-manager';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await storage.readProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const manager = new SnapshotManager(getProjectDir(id));
    const snapshots = await manager.listSnapshots();
    return NextResponse.json({ data: snapshots });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
