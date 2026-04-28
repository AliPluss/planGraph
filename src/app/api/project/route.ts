import { NextResponse } from 'next/server';
import { getCurrentStep, getProgress } from '@/core/analytics/project-analytics';
import { storage } from '@/core/storage/storage';

export async function GET() {
  const metas = await storage.listProjects();
  const projects = await Promise.all(
    metas.map(async (meta) => {
      const project = await storage.readProject(meta.id);
      if (!project) {
        return {
          ...meta,
          progress: { done: 0, total: 0, percent: 0 },
          currentStep: null,
        };
      }

      return {
        ...meta,
        progress: getProgress(project),
        currentStep: getCurrentStep(project),
      };
    }),
  );

  projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ data: projects });
}
