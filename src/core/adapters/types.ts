import type { Project, Step, ExecutorTool, ReportSummary } from '../types';
import type { Storage } from '../storage/storage';

export type { ReportSummary };

export interface ExecutionContext {
  projectId: string;
  project: Project;
  step: Step;
  promptText: string;
  projectRoot: string;
  storage?: Storage;
}

export interface ExecutionHandle {
  id: string;
  stop(): Promise<void>;
}

export interface ExecutionResult {
  instructions: string;
  instructionsForUser?: string;
  promptText: string;
  promptFilePath: string;
  autoRunning?: boolean;
  handleId?: string;
}

export interface ExecutorAdapter {
  id: ExecutorTool;
  displayName: string;
  supportsAutoRun: boolean;
  prepare(ctx: ExecutionContext): Promise<ExecutionResult>;
  run?(ctx: ExecutionContext): Promise<ExecutionHandle>;
  executeAsync?(ctx: ExecutionContext): Promise<void>;
}
