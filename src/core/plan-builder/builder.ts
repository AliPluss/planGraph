import type { Project, Step, Edge, Locale, ExecutorTool, ToolPrompts } from '../types';
import type { ScopeSummary } from '../discovery/types';
import type { StepBlueprint } from '../templates/types';
import { getTemplateForKind } from '../templates/registry';

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

  const steps: Step[] = sorted.map((bp) =>
    blueprintToStep(bp, locale, executor, affectsMap.get(bp.id) ?? []),
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

  assignPositions(steps, sorted);

  return {
    meta: {
      id,
      name: opts.name,
      idea: summary.idea,
      rootPath: opts.rootPath,
      templateId: template?.id ?? 'generic',
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
}

function blueprintToStep(
  bp: StepBlueprint,
  locale: Locale,
  executor: ExecutorTool,
  affects: string[],
): Step {
  const l = locale;
  const goal = bp.goal[l] ?? bp.goal.en;
  const criteria = (bp.successCriteria[l] ?? bp.successCriteria.en)
    .map((c) => `- ${c}`)
    .join('\n');
  const mainPrompt = `${goal}\n\nSuccess criteria:\n${criteria}`;

  const prompts: ToolPrompts = { manual: mainPrompt };
  if (executor === 'claude-code') prompts.claudeCode = mainPrompt;
  else if (executor === 'cursor') prompts.cursor = mainPrompt;
  else if (executor === 'antigravity') prompts.antigravity = mainPrompt;
  else if (executor === 'copilot') prompts.copilot = mainPrompt;

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
    protectedFiles: [],
    prompts,
    dependsOn: bp.dependsOn ?? [],
    affects,
    mdFile: `${bp.id}.md`,
    position: { x: 0, y: 0 },
  };
}

function topoSort(blueprints: StepBlueprint[]): StepBlueprint[] {
  const ids = new Set(blueprints.map((b) => b.id));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const bp of blueprints) {
    inDegree.set(bp.id, 0);
    adj.set(bp.id, []);
  }
  for (const bp of blueprints) {
    for (const dep of bp.dependsOn ?? []) {
      if (!ids.has(dep)) continue;
      adj.get(dep)!.push(bp.id);
      inDegree.set(bp.id, (inDegree.get(bp.id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const result: StepBlueprint[] = [];
  const byId = new Map(blueprints.map((b) => [b.id, b]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const bp = byId.get(id);
    if (bp) result.push(bp);
    for (const next of adj.get(id) ?? []) {
      const newDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  // Append cycle-forming steps in their original order
  const done = new Set(result.map((b) => b.id));
  for (const bp of blueprints) {
    if (!done.has(bp.id)) result.push(bp);
  }

  return result;
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
