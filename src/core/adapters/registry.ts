import type { ExecutorTool } from '../types';
import type { ExecutorAdapter } from './types';
import { manualAdapter } from './manual-adapter';
import { claudeCodeAdapter } from './claude-code-adapter';

const adapters = new Map<ExecutorTool, ExecutorAdapter>([
  ['manual', manualAdapter],
  ['claude-code', claudeCodeAdapter],
]);

export function getAdapter(tool: ExecutorTool): ExecutorAdapter {
  return adapters.get(tool) ?? manualAdapter;
}
