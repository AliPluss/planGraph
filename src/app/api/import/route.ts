import * as fs from 'fs/promises';
import * as path from 'path';
import { NextResponse } from 'next/server';
import { scan } from '@/core/importer/project-scanner';
import { buildProject, type BuildOptions } from '@/core/plan-builder/builder';
import { mdWriter } from '@/core/markdown/md-writer';
import { pathGuard } from '@/core/security/path-guard';
import { storage } from '@/core/storage/storage';
import type { ScopeSummary } from '@/core/discovery/types';
import type { ExecutorTool, Locale } from '@/core/types';

type ImportBody = {
  rootPath?: string;
  create?: boolean;
  name?: string;
  answers?: {
    remainingWork?: string;
    priority?: string;
    constraints?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ImportBody;
    const rootPath = body.rootPath?.trim();
    if (!rootPath) {
      return NextResponse.json({ error: 'rootPath is required' }, { status: 422 });
    }

    const root = path.resolve(rootPath);
    pathGuard.resolveSafe('.', root);

    const stat = await fs.stat(root);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'rootPath must be a directory' }, { status: 422 });
    }

    const result = await scan(root);
    if (!body.create) {
      return NextResponse.json({ data: result });
    }

    const profile = await storage.readProfile();
    const summary = buildScopeSummary(root, result, body.answers);
    const opts: BuildOptions = {
      name: body.name?.trim().slice(0, 100) || path.basename(root) || 'Imported project',
      rootPath: root,
      locale: profile?.preferredLocale ?? 'en',
      executor: profile?.tools?.[0] ?? 'manual',
    };

    const project = buildProject(summary, opts);
    project.meta.idea = summary.idea;
    project.meta.stack = result.stack;
    project.meta.templateId = `imported-${project.meta.templateId}`;
    project.meta.updatedAt = new Date().toISOString();
    project.memory.push({
      stepId: 'import',
      category: 'note',
      text: `Imported from ${root}. Scanner found: ${result.summary}`,
      createdAt: new Date().toISOString(),
    });

    await storage.writeProject(project);
    await mdWriter.writeProject(project);
    await storage.appendAudit(
      {
        timestamp: new Date().toISOString(),
        action: 'PROJECT_IMPORTED',
        projectId: project.meta.id,
        details: {
          rootPath: root,
          detectedKind: result.detectedKind,
          missingFeatures: result.missingFeatures,
        },
      },
      project.meta.id,
    );

    return NextResponse.json({ data: { id: project.meta.id, scan: result } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function buildScopeSummary(
  root: string,
  result: Awaited<ReturnType<typeof scan>>,
  answers: ImportBody['answers'],
): ScopeSummary {
  const requested = splitList(answers?.remainingWork);
  const features = requested.length > 0 ? requested : result.missingFeatures;
  const constraints = splitList(answers?.constraints);
  const priority = answers?.priority?.trim();
  const stack = result.stack.length > 0 ? result.stack : ['Existing codebase'];

  return {
    idea: [
      `Continue the existing project at ${root}.`,
      result.summary,
      priority ? `Primary priority: ${priority}.` : '',
      constraints.length ? `Constraints: ${constraints.join(', ')}.` : '',
    ].filter(Boolean).join(' '),
    detectedKind: result.detectedKind === 'unknown' ? 'web-app' : result.detectedKind,
    answers: {
      import: true,
      missingFeatures: result.missingFeatures,
      presentFeatures: result.presentFeatures,
      priority,
      constraints,
    },
    features: features.length > 0 ? features : ['final polish'],
    stack,
    mvpExclusions: result.presentFeatures.map((feature) => `Already present: ${feature}`),
    estimatedSteps: Math.max(4, Math.min(10, features.length + 3)),
    estimatedHours: { min: Math.max(4, features.length * 2), max: Math.max(10, features.length * 5) },
  };
}

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}
