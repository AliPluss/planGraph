import * as fs from 'fs/promises';
import * as path from 'path';
import { SafeWriter } from '../security/safe-writer';
import { safeCommandRunner } from '../security/command-runner';
import { buildRichPrompt } from '../markdown/md-writer';
import { buildReport } from '../markdown/report-parser';
import type { ExecutorAdapter, ExecutionContext, ExecutionResult } from './types';

const writer = new SafeWriter();

export const claudeCodeAdapter: ExecutorAdapter = {
  id: 'claude-code',
  displayName: 'Claude Code',
  supportsAutoRun: true,

  async prepare(ctx: ExecutionContext): Promise<ExecutionResult> {
    const { project, step, projectRoot } = ctx;
    const promptText = buildRichPrompt(
      step,
      project,
      'claude-code',
      await ctx.storage?.readMemory(ctx.projectId),
    );
    const plangraphDir = path.join(projectRoot, '.plangraph');
    const promptFile = path.join(plangraphDir, 'PROMPT.md');

    await fs.mkdir(plangraphDir, { recursive: true });

    const gitignorePath = path.join(plangraphDir, '.gitignore');
    try { await fs.access(gitignorePath); } catch {
      await writer.writeText(gitignorePath, '*\n');
    }

    await writer.writeText(promptFile, promptText);

    return {
      instructions: 'Claude Code is running this step automatically. The report will appear here when complete.',
      promptText,
      promptFilePath: '.plangraph/PROMPT.md',
      autoRunning: true,
    };
  },

  async executeAsync(ctx: ExecutionContext): Promise<void> {
    const { project, step, projectRoot } = ctx;
    const promptText = buildRichPrompt(
      step,
      project,
      'claude-code',
      await ctx.storage?.readMemory(ctx.projectId),
    );
    const reportsDir = path.join(projectRoot, 'reports');
    const reportFile = path.join(reportsDir, `${step.id}_report.md`);

    await fs.mkdir(reportsDir, { recursive: true });

    const startMs = Date.now();
    let exitCode = 0;
    let fullOutput = '';

    try {
      const result = await safeCommandRunner.runStream(
        'claude',
        ['--print', promptText],
        projectRoot,
        { timeoutMs: 10 * 60 * 1000 },
        (chunk) => { fullOutput += chunk; },
      );
      exitCode = result.exitCode;
      fullOutput = result.fullStdout;
      if (result.stderr) {
        fullOutput += `\n\n---\nstderr:\n${result.stderr}`;
      }
    } catch (err) {
      exitCode = 1;
      fullOutput = `Execution error: ${String(err)}`;
    }

    const durationMs = Date.now() - startMs;
    const reportContent = buildReport(step.title, fullOutput, exitCode, durationMs);
    await writer.writeText(reportFile, reportContent);
  },
};
