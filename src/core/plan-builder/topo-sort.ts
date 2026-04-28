export interface SortableStep {
  id: string;
  dependsOn?: string[];
}

export function topoSort<T extends SortableStep>(items: T[]): T[] {
  const ids = new Set(items.map((item) => item.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const byId = new Map(items.map((item) => [item.id, item]));

  for (const item of items) {
    inDegree.set(item.id, 0);
    adjacency.set(item.id, []);
  }

  for (const item of items) {
    for (const dependency of item.dependsOn ?? []) {
      if (!ids.has(dependency)) continue;
      adjacency.get(dependency)!.push(item.id);
      inDegree.set(item.id, (inDegree.get(item.id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: T[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const item = byId.get(id);
    if (item) sorted.push(item);

    for (const next of adjacency.get(id) ?? []) {
      const degree = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }

  if (sorted.length !== items.length) {
    const sortedIds = new Set(sorted.map((item) => item.id));
    const cycleIds = items
      .filter((item) => !sortedIds.has(item.id))
      .map((item) => item.id)
      .join(', ');
    throw new Error(`Cycle detected in plan steps: ${cycleIds}`);
  }

  return sorted;
}
