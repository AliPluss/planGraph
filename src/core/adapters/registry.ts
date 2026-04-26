import type { ExecutorTool } from '../types';
import type { ExecutorAdapter } from './types';
import { manualAdapter } from './manual-adapter';

const adapters = new Map<ExecutorTool, ExecutorAdapter>([
  ['manual', manualAdapter],
]);

export function getAdapter(tool: ExecutorTool): ExecutorAdapter {
  return adapters.get(tool) ?? manualAdapter;
}
