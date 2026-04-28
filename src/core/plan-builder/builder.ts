import type { Project, Step, Edge, Locale, ExecutorTool } from '../types';
import type { ScopeSummary } from '../discovery/types';
import type { StepBlueprint } from '../templates/types';
import { getTemplateForKind } from '../templates/registry';
import { buildPromptsForStep } from './prompt-builder';
import { topoSort } from './topo-sort';

export interface BuildOptions {
  name: string;
  rootPath: string;
  locale: Locale;
  executor: ExecutorTool;
}

const NODE_W = 220;
const NODE_H = 96;
const X_GAP = 80;
const Y_GAP = 40;

export function buildProject(summary: ScopeSummary, opts: BuildOptions): Project {
  const template = getTemplateForKind(summary.detectedKind);

  const allBlueprints: StepBlueprint[] = template
    ? [
        ...template.baseSteps,
        ...template.conditionalSteps.filter(
          (s) => !s.includeWhen || s.includeWhen(summary.features),
        ),
      ]
    : [];

  const sorted = topoSort(allBlueprints);
  const { locale, executor } = opts;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Build affects map (inverse of dependsOn)
  const affectsMap = new Map<string, string[]>();
  for (const bp of sorted) {
    for (const dep of bp.dependsOn ?? []) {
      if (!affectsMap.has(dep)) affectsMap.set(dep, []);
      affectsMap.get(dep)!.push(bp.id);
    }
  }

  const protectedFiles = template?.protectedFiles ?? [];
  const steps: Step[] = sorted.map((bp) =>
    blueprintToStep(bp, locale, affectsMap.get(bp.id) ?? [], protectedFiles),
  );

  // Edges from dependsOn
  const stepIds = new Set(sorted.map((b) => b.id));
  const edges: Edge[] = [];
  for (const bp of sorted) {
    for (const dep of bp.dependsOn ?? []) {
      if (stepIds.has(dep)) {
        edges.push({ id: `${dep}->${bp.id}`, source: dep, target: bp.id });
      }
    }
  }

  const project: Project = {
    meta: {
      id,
      name: opts.name,
      idea: summary.idea,
      rootPath: opts.rootPath,
      templateId: template?.id ?? 'generic',
      stack: summary.stack,
      mvpExclusions: summary.mvpExclusions,
      estimatedHours: summary.estimatedHours,
      locale,
      createdAt: now,
      updatedAt: now,
      selectedExecutor: executor,
    },
    steps,
    edges,
    executionOrder: sorted.map((b) => b.id),
    memory: [],
  };

  for (const step of project.steps) {
    step.prompts = buildPromptsForStep(step, project, {
      communicationStyle: 'concise',
      languages: summary.stack,
    });
  }

  assignPositions(steps, sorted);

  return project;
}

function blueprintToStep(
  bp: StepBlueprint,
  locale: Locale,
  affects: string[],
  protectedFiles: string[],
): Step {
  const l = locale;
  const goal = bp.goal[l] ?? bp.goal.en;

  return {
    id: bp.id,
    title: bp.title[l] ?? bp.title.en,
    type: bp.type,
    status: 'not_started',
    goal,
    contextFiles: bp.contextFiles ?? [],
    recommendedLibraries: bp.recommendedLibraries,
    successCriteria: bp.successCriteria[l] ?? bp.successCriteria.en,
    restrictions: bp.restrictions[l] ?? bp.restrictions.en,
    protectedFiles: [...protectedFiles],
    prompts: { manual: '' },
    dependsOn: bp.dependsOn ?? [],
    affects,
    mdFile: `${bp.id}.md`,
    position: { x: 0, y: 0 },
  };
}

function assignPositions(steps: Step[], sorted: StepBlueprint[]): void {
  // Compute layer depth (longest path from a root)
  const depths = new Map<string, number>();
  for (const bp of sorted) {
    let maxParent = -1;
    for (const dep of bp.dependsOn ?? []) {
      const d = depths.get(dep) ?? 0;
      if (d > maxParent) maxParent = d;
    }
    depths.set(bp.id, maxParent + 1);
  }

  // Group step IDs by depth
  const byDepth = new Map<number, string[]>();
  for (const [id, depth] of depths) {
    if (!byDepth.has(depth)) byDepth.set(depth, []);
    byDepth.get(depth)!.push(id);
  }

  // Assign x/y, centering each column vertically
  for (const [depth, ids] of byDepth) {
    const x = depth * (NODE_W + X_GAP);
    const colH = ids.length * NODE_H + (ids.length - 1) * Y_GAP;
    let y = -colH / 2;
    for (const id of ids) {
      const step = steps.find((s) => s.id === id);
      if (step) step.position = { x, y };
      y += NODE_H + Y_GAP;
    }
  }
}
