import type { ExecutorTool } from '../types';
import type { ExecutorAdapter } from './types';
import { claudeCodeAdapter } from './claude-code-adapter';
import { manualAdapter } from './manual-adapter';

const adapters = new Map<ExecutorTool, ExecutorAdapter>([
  ['claude-code', claudeCodeAdapter],
  ['manual', manualAdapter],
]);

export function getAdapter(tool: ExecutorTool): ExecutorAdapter | undefined {
  return adapters.get(tool);
}

export function getRegisteredAdapters(): ExecutorAdapter[] {
  return [...adapters.values()];
}
