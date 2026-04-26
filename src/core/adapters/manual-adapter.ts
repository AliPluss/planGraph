import * as fs from 'fs/promises';
import * as path from 'path';
import { SafeWriter } from '../security/safe-writer';
import { buildRichPrompt } from '../markdown/md-writer';
import type { ExecutorAdapter, ExecutionContext, ExecutionResult } from './types';

const writer = new SafeWriter();

export const manualAdapter: ExecutorAdapter = {
  id: 'manual',
  displayName: 'Manual',
  supportsAutoRun: false,

  async prepare(ctx: ExecutionContext): Promise<ExecutionResult> {
    const { project, step, projectRoot } = ctx;
    const promptText = buildRichPrompt(step, project, 'manual');
    const plangraphDir = path.join(projectRoot, '.plangraph');
    const promptFile = path.join(plangraphDir, 'PROMPT.md');

    await fs.mkdir(plangraphDir, { recursive: true });

    // Write a .gitignore so prompts aren't accidentally committed
    const gitignorePath = path.join(plangraphDir, '.gitignore');
    try { await fs.access(gitignorePath); } catch {
      await writer.writeText(gitignorePath, '*\n');
    }

    await writer.writeText(promptFile, promptText);

    const relativePromptPath = `.plangraph/PROMPT.md`;
    const reportPath = `workspace/projects/${ctx.projectId}/reports/${step.id}_report.md`;

    const instructions = `Open your preferred AI tool and paste the prompt from:\n${relativePromptPath}\n\nWhen the step is complete, write the report to:\n${reportPath}`;

    return { instructions, promptText, promptFilePath: relativePromptPath };
  },
};
