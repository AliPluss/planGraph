import { EventEmitter } from 'events';

export type LiveRunStatus = 'running' | 'completed' | 'failed' | 'stopped';

export interface LiveRunState {
  id: string;
  projectId: string;
  stepId: string;
  startedAt: string;
  completedAt?: string;
  status: LiveRunStatus;
  chunks: string[];
  stderr: string;
  exitCode?: number;
  tokens?: { input: number; output: number };
  costUsd?: number;
  error?: string;
  emitter: EventEmitter;
  stop: () => Promise<void>;
}

const handles = new Map<string, LiveRunState>();

export function createExecutionHandle(params: {
  projectId: string;
  stepId: string;
  stop: () => Promise<void>;
}): LiveRunState {
  const id = crypto.randomUUID();
  const state: LiveRunState = {
    id,
    projectId: params.projectId,
    stepId: params.stepId,
    startedAt: new Date().toISOString(),
    status: 'running',
    chunks: [],
    stderr: '',
    emitter: new EventEmitter(),
    stop: params.stop,
  };
  handles.set(id, state);
  return state;
}

export function getExecutionHandle(id: string): LiveRunState | undefined {
  return handles.get(id);
}

export function appendExecutionChunk(id: string, chunk: string): void {
  const state = handles.get(id);
  if (!state) return;
  state.chunks.push(chunk);
  state.emitter.emit('chunk', chunk);
}

export function finishExecutionHandle(
  id: string,
  patch: Pick<LiveRunState, 'status'> & Partial<LiveRunState>,
): void {
  const state = handles.get(id);
  if (!state) return;
  Object.assign(state, patch, { completedAt: new Date().toISOString() });
  state.emitter.emit('done', state);
}
