import * as fs from 'fs/promises';
import { SafeWriter } from '../security/safe-writer';
import { safeCommandRunner } from '../security/command-runner';
import { pathGuard } from '../security/path-guard';
import { buildRichPrompt } from '../markdown/md-writer';
import type { ExecutorAdapter, ExecutionContext, ExecutionResult } from './types';

const writer = new SafeWriter();

async function ensurePlanGraphDir(projectRoot: string): Promise<{ promptFile: string }> {
  const plangraphDir = pathGuard.resolveSafe('.plangraph', projectRoot);
  const promptFile = pathGuard.resolveSafe('PROMPT.md', plangraphDir);
  const gitignorePath = pathGuard.resolveSafe('.gitignore', plangraphDir);

  await fs.mkdir(plangraphDir, { recursive: true });

  try {
    await fs.access(gitignorePath);
  } catch {
    await writer.writeText(gitignorePath, '*\n');
  }

  return { promptFile };
}

function extractConventions(memoryContent?: string): string[] {
  const trimmed = memoryContent?.trim();
  if (!trimmed) return ['Follow existing project style and file organization.'];

  const conventionsSection = trimmed.match(/## Conventions\s*([\s\S]*?)(?:\n## |$)/i)?.[1] ?? '';
  const bullets = conventionsSection
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line && !line.startsWith('_('))
    .slice(0, 5);

  return bullets.length > 0 ? bullets : ['Follow decisions and conventions recorded in MEMORY.md.'];
}

function buildCursorRules(ctx: ExecutionContext, memoryContent?: string): string {
  const { project, step } = ctx;
  const conventions = extractConventions(memoryContent)
    .map((item) => `- ${item}`)
    .join('\n');
  const protectedFiles = step.protectedFiles.slice(0, 12).map((file) => `- ${file}`).join('\n') || '- None';
  const restrictions = step.restrictions.slice(0, 8).map((item) => `- ${item}`).join('\n') || '- Only complete the active PlanGraph step.';

  const content = `# PlanGraph Cursor Rules

PlanGraph is preparing Cursor Composer for project "${project.meta.name}".
Current step: ${step.id} - ${step.title}

When working on a PlanGraph step, only modify files relevant to that step. Read .plangraph/PROMPT.md for the active task.

Before changing files:
- Read MEMORY.md.
- Read .plangraph/PROMPT.md.
- Write reports/${step.id}_report.md when finished.

Project conventions:
${conventions}

Protected files:
${protectedFiles}

Restrictions:
${restrictions}
`;

  return content.length <= 1900
    ? content
    : `${content.slice(0, 1850)}\n- See .plangraph/PROMPT.md for the full active task.\n`;
}

function buildCursorPrompt(ctx: ExecutionContext, memoryContent?: string): string {
  const { project, step } = ctx;
  const basePrompt = ctx.promptText || buildRichPrompt(step, project, 'cursor', memoryContent);

  return `# Cursor Composer Task

Use Cursor Composer agent context. Prefer @file references when you need to open project artifacts.

Important context:
- @MEMORY.md
- @OVERVIEW.md
- @ROADMAP.md
- @steps/${step.id}.md

${basePrompt}
`;
}

export const cursorAdapter: ExecutorAdapter = {
  id: 'cursor',
  displayName: 'Cursor',
  supportsAutoRun: false,

  async prepare(ctx: ExecutionContext): Promise<ExecutionResult> {
    const memoryContent = await ctx.storage?.readMemory(ctx.projectId);
    const promptText = buildCursorPrompt(ctx, memoryContent);
    const { promptFile } = await ensurePlanGraphDir(ctx.projectRoot);
    const cursorRulesPath = pathGuard.resolveSafe('.cursorrules', ctx.projectRoot);

    await writer.writeText(cursorRulesPath, buildCursorRules(ctx, memoryContent));
    await writer.writeText(promptFile, promptText);

    if (process.env.PLANGRAPH_SKIP_CURSOR_LAUNCH !== '1') {
      try {
        await safeCommandRunner.run('cursor', [ctx.projectRoot], ctx.projectRoot, { timeoutMs: 3000 });
      } catch {
        // Cursor launch is best-effort. The setup files are the source of truth.
      }
    }

    const instructions = 'Cursor is set up for this step. Open the Composer and use: @.plangraph/PROMPT.md `Execute the step described in this file.`';

    return {
      instructions,
      instructionsForUser: instructions,
      promptText,
      promptFilePath: '.plangraph/PROMPT.md',
    };
  },
};
