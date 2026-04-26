import type { Project, Step, ExecutorTool } from '../types';

export interface ExecutionContext {
  projectId: string;
  project: Project;
  step: Step;
  projectRoot: string;  // workspace/projects/<id>
}

export interface ExecutionResult {
  instructions: string;
  promptText: string;
  promptFilePath: string;  // relative path shown to user
}

export interface ExecutorAdapter {
  id: ExecutorTool;
  displayName: string;
  supportsAutoRun: boolean;
  prepare(ctx: ExecutionContext): Promise<ExecutionResult>;
}
