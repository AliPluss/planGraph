import * as fs from 'fs/promises';
import { SafeWriter } from '../security/safe-writer';
import { safeCommandRunner } from '../security/command-runner';
import { pathGuard } from '../security/path-guard';
import { buildRichPrompt } from '../markdown/md-writer';
import { buildReport } from '../markdown/report-parser';
import {
  appendExecutionChunk,
  createExecutionHandle,
  finishExecutionHandle,
} from './execution-handles';
import type { ExecutionHandle, ExecutorAdapter, ExecutionContext, ExecutionResult } from './types';

const writer = new SafeWriter();

function parseClaudeJson(output: string): {
  result?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
  total_cost_usd?: number;
} | null {
  const trimmed = output.trim();
  if (!trimmed) return null;
  const candidates = [trimmed, ...trimmed.split(/\r?\n/).reverse()];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // Claude output can include progress text before the final JSON line.
    }
  }
  return null;
}

async function ensurePlanGraphDir(projectRoot: string): Promise<{ promptFile: string }> {
  const plangraphDir = pathGuard.resolveSafe('.plangraph', projectRoot);
  const promptFile = pathGuard.resolveSafe('PROMPT.md', plangraphDir);

  await fs.mkdir(plangraphDir, { recursive: true });

  const gitignorePath = pathGuard.resolveSafe('.gitignore', plangraphDir);
  try { await fs.access(gitignorePath); } catch {
    await writer.writeText(gitignorePath, '*\n');
  }

  const readmePath = pathGuard.resolveSafe('README.md', plangraphDir);
  try { await fs.access(readmePath); } catch {
    await writer.writeText(
      readmePath,
      '# PlanGraph\n\nThis folder is managed by PlanGraph. It stores the active executor prompt for the current step and is ignored by git by default.\n',
    );
  }

  return { promptFile };
}

export const claudeCodeAdapter: ExecutorAdapter = {
  id: 'claude-code',
  displayName: 'Claude Code',
  supportsAutoRun: true,

  async prepare(ctx: ExecutionContext): Promise<ExecutionResult> {
    const { project, step, projectRoot } = ctx;
    const promptText = ctx.promptText || buildRichPrompt(
      step,
      project,
      'claude-code',
      await ctx.storage?.readMemory(ctx.projectId),
    );
    const { promptFile } = await ensurePlanGraphDir(projectRoot);

    await writer.writeText(promptFile, promptText);

    const pasteCommand = 'Read .plangraph/PROMPT.md and execute the step. Then write the report file as instructed.';
    const instructions = project.meta.locale === 'ar'
      ? `افتح الطرفية داخل ${projectRoot}. شغّل: \`claude\`. ثم الصق: \`${pasteCommand}\``
      : `Open a terminal in ${projectRoot}. Run: \`claude\`. Then paste: \`${pasteCommand}\``;

    return {
      instructions,
      instructionsForUser: instructions,
      promptText,
      promptFilePath: '.plangraph/PROMPT.md',
      autoRunning: false,
    };
  },

  async run(ctx: ExecutionContext): Promise<ExecutionHandle> {
    const { step, projectRoot } = ctx;
    const controller = new AbortController();
    const state = createExecutionHandle({
      projectId: ctx.projectId,
      stepId: step.id,
      stop: async () => controller.abort(),
    });
    const reportsDir = pathGuard.resolveSafe('reports', projectRoot);
    const reportFile = pathGuard.resolveSafe(`${step.id}_report.md`, reportsDir);

    await fs.mkdir(reportsDir, { recursive: true });

    void (async () => {
      const startMs = Date.now();
      let exitCode = 0;
      let fullOutput = '';
      let stderr = '';

      try {
        const result = await safeCommandRunner.runStream(
          'claude',
          ['--print', '--input-file', '.plangraph/PROMPT.md', '--output-format', 'json'],
          projectRoot,
          { timeoutMs: 10 * 60 * 1000, signal: controller.signal },
          (chunk) => appendExecutionChunk(state.id, chunk),
        );
        exitCode = result.exitCode;
        fullOutput = result.fullStdout;
        stderr = result.stderr;
      } catch (err) {
        exitCode = 1;
        fullOutput = `Execution error: ${String(err)}`;
        finishExecutionHandle(state.id, { status: controller.signal.aborted ? 'stopped' : 'failed', error: String(err) });
      }

      const durationMs = Date.now() - startMs;
      const parsed = parseClaudeJson(fullOutput);
      const tokens = parsed?.usage
        ? {
            input: parsed.usage.input_tokens ?? 0,
            output: parsed.usage.output_tokens ?? 0,
          }
        : undefined;
      const reportOutput = parsed?.result ?? fullOutput;
      const reportContent = buildReport(
        step.title,
        stderr ? `${reportOutput}\n\n---\nstderr:\n${stderr}` : reportOutput,
        exitCode,
        durationMs,
      );

      await writer.writeText(reportFile, reportContent);

      if (ctx.storage) {
        const latest = await ctx.storage.readProject(ctx.projectId);
        if (latest) {
          const stepIndex = latest.steps.findIndex((item) => item.id === step.id);
          if (stepIndex >= 0) {
            latest.steps[stepIndex] = {
              ...latest.steps[stepIndex],
              status: exitCode === 0 ? latest.steps[stepIndex].status : 'failed',
              executionLog: {
                tokens,
                costUsd: parsed?.total_cost_usd,
                durationMs,
              },
            };
            latest.meta.updatedAt = new Date().toISOString();
            await ctx.storage.writeProject(latest);
          }
        }
      }

      finishExecutionHandle(state.id, {
        status: exitCode === 0 ? 'completed' : 'failed',
        stderr,
        exitCode,
        tokens,
        costUsd: parsed?.total_cost_usd,
      });
    })();

    return {
      id: state.id,
      stop: state.stop,
    };
  },
};
