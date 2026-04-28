import * as fs from 'fs/promises';
import { SafeWriter } from '../security/safe-writer';
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

function buildSkill(ctx: ExecutionContext): string {
  const { project, step } = ctx;

  return `# PlanGraph Step Skill

Use this skill when the user asks Antigravity to execute the current PlanGraph step.

PlanGraph is a local-first planning tool. It writes one active prompt and expects the agent to complete only that step.

## Required workflow

1. Read .plangraph/PROMPT.md.
2. Read MEMORY.md before making changes.
3. Review the step artifact for ${step.id}: steps/${step.id}.md.
4. Work only inside this workspace.
5. Do not modify protected files unless .plangraph/PROMPT.md explicitly allows it.
6. Use Antigravity Plan Artifacts and Manager view to track the active step, not future steps.
7. When done, write reports/${step.id}_report.md.

## Current PlanGraph project

- Project: ${project.meta.name}
- Step: ${step.id} - ${step.title}
- Report file: reports/${step.id}_report.md

Stop after the report is written. PlanGraph's file watcher is the source of truth for completion.
`;
}

function buildAntigravityPrompt(ctx: ExecutionContext, memoryContent?: string): string {
  const { project, step } = ctx;
  const basePrompt = ctx.promptText || buildRichPrompt(step, project, 'antigravity', memoryContent);

  return `# Antigravity PlanGraph Task

Use the installed PlanGraph skill for this workspace. In Manager view, keep the plan scoped to the current step only.

Plan artifacts:
- Current step: ${step.id} - ${step.title}
- Step markdown: steps/${step.id}.md
- Memory: MEMORY.md
- Report target: reports/${step.id}_report.md

${basePrompt}
`;
}

export const antigravityAdapter: ExecutorAdapter = {
  id: 'antigravity',
  displayName: 'Antigravity',
  supportsAutoRun: false,

  async prepare(ctx: ExecutionContext): Promise<ExecutionResult> {
    const memoryContent = await ctx.storage?.readMemory(ctx.projectId);
    const promptText = buildAntigravityPrompt(ctx, memoryContent);
    const { promptFile } = await ensurePlanGraphDir(ctx.projectRoot);
    const skillPath = pathGuard.resolveSafe(
      '.gemini/antigravity/skills/plangraph-step/SKILL.md',
      ctx.projectRoot,
    );

    await writer.writeText(skillPath, buildSkill(ctx));
    await writer.writeText(promptFile, promptText);

    const instructions = 'Open this folder as a Workspace in Antigravity. The PlanGraph skill is installed. Ask: `Execute the current PlanGraph step.`';

    return {
      instructions,
      instructionsForUser: instructions,
      promptText,
      promptFilePath: '.plangraph/PROMPT.md',
    };
  },
};
