import { NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import { buildProject, type BuildOptions } from '@/core/plan-builder/builder';
import type { ScopeSummary } from '@/core/discovery/types';

export async function GET() {
  const projects = await storage.listProjects();
  return NextResponse.json({ data: projects });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      summary: ScopeSummary;
      name: string;
      rootPath?: string;
      locale?: string;
      executor?: string;
    };

    if (!body.summary || !body.name?.trim()) {
      return NextResponse.json({ error: 'summary and name are required' }, { status: 422 });
    }

    const profile = await storage.readProfile();

    const opts: BuildOptions = {
      name: body.name.trim().slice(0, 100),
      rootPath: body.rootPath?.trim() || `./workspace/projects/${body.name.trim().toLowerCase().replace(/\s+/g, '-')}`,
      locale: (body.locale as 'en' | 'ar') ?? profile?.preferredLocale ?? 'en',
      executor: (body.executor as BuildOptions['executor']) ?? profile?.tools?.[0] ?? 'manual',
    };

    const project = buildProject(body.summary, opts);
    await storage.writeProject(project);

    await storage.appendAudit(
      {
        timestamp: new Date().toISOString(),
        action: 'PROJECT_CREATED',
        projectId: project.meta.id,
        details: { name: opts.name, templateId: project.meta.templateId, stepCount: project.steps.length },
      },
      project.meta.id,
    );

    return NextResponse.json({ data: { id: project.meta.id } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
