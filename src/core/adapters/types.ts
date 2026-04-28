import type { Project, Step, ExecutorTool, ReportSummary } from '../types';
import type { Storage } from '../storage/storage';

export type { ReportSummary };

export interface ExecutionContext {
  projectId: string;
  project: Project;
  step: Step;
  projectRoot: string;  // workspace/projects/<id>
  storage?: Storage;
}

export interface ExecutionResult {
  instructions: string;
  promptText: string;
  promptFilePath: string;  // relative path shown to user
  autoRunning?: boolean;
}

export interface ExecutorAdapter {
  id: ExecutorTool;
  displayName: string;
  supportsAutoRun: boolean;
  prepare(ctx: ExecutionContext): Promise<ExecutionResult>;
  executeAsync?(ctx: ExecutionContext): Promise<void>;
}
