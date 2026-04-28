import type { ExecutorTool } from '../types';
import type { ExecutorAdapter } from './types';
import { manualAdapter } from './manual-adapter';

const adapters = new Map<ExecutorTool, ExecutorAdapter>([
  ['manual', manualAdapter],
]);

export function getAdapter(tool: ExecutorTool): ExecutorAdapter | undefined {
  return adapters.get(tool);
}

export function getRegisteredAdapters(): ExecutorAdapter[] {
  return [...adapters.values()];
}
