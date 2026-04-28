import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { antigravityAdapter } from '../antigravity-adapter';
import { cursorAdapter } from '../cursor-adapter';
import type { ExecutionContext } from '../types';
import type { Project, Step } from '../../types';

function makeStep(): Step {
  return {
    id: '01_setup',
    title: 'Set up project',
    type: 'setup',
    status: 'ready',
    goal: 'Create the initial project files.',
    contextFiles: ['package.json'],
    recommendedLibraries: [],
    successCriteria: ['Project boots'],
    restrictions: ['Do not edit secrets'],
    protectedFiles: ['.env', '.git/**'],
    prompts: {
      manual: 'Manual prompt. When done, write reports/01_setup_report.md.',
      cursor: 'Cursor prompt. When done, write reports/01_setup_report.md.',
      antigravity: 'Antigravity prompt. When done, write reports/01_setup_report.md.',
    },
    dependsOn: [],
    affects: [],
    mdFile: 'steps/01_setup.md',
  };
}

async function makeContext(): Promise<ExecutionContext> {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'plangraph-adapter-'));
  const step = makeStep();
  const project: Project = {
    meta: {
      id: 'test-project',
      name: 'Test Project',
      idea: 'Build a test project',
      rootPath: projectRoot,
      templateId: 'web-app',
      locale: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedExecutor: 'cursor',
    },
    steps: [step],
    edges: [],
    executionOrder: [step.id],
    memory: [],
  };

  await fs.writeFile(path.join(projectRoot, 'MEMORY.md'), '# Memory\n\n## Conventions\n- Use TypeScript.\n', 'utf8');

  return {
    projectId: project.meta.id,
    project,
    step,
    promptText: '',
    projectRoot,
  };
}

describe('prepared adapters', () => {
  it('writes Cursor rules and active prompt inside the project root', async () => {
    process.env.PLANGRAPH_SKIP_CURSOR_LAUNCH = '1';
    const ctx = await makeContext();
    const result = await cursorAdapter.prepare(ctx);

    const rules = await fs.readFile(path.join(ctx.projectRoot, '.cursorrules'), 'utf8');
    const prompt = await fs.readFile(path.join(ctx.projectRoot, '.plangraph', 'PROMPT.md'), 'utf8');

    assert.match(rules, /When working on a PlanGraph step/);
    assert.ok(rules.length < 2048);
    assert.match(prompt, /Cursor Composer Task/);
    assert.equal(result.promptFilePath, '.plangraph/PROMPT.md');
  });

  it('writes Antigravity skill and active prompt inside the project root', async () => {
    const ctx = await makeContext();
    const result = await antigravityAdapter.prepare(ctx);

    const skill = await fs.readFile(
      path.join(ctx.projectRoot, '.gemini', 'antigravity', 'skills', 'plangraph-step', 'SKILL.md'),
      'utf8',
    );
    const prompt = await fs.readFile(path.join(ctx.projectRoot, '.plangraph', 'PROMPT.md'), 'utf8');

    assert.match(skill, /PlanGraph Step Skill/);
    assert.match(skill, /reports\/01_setup_report\.md/);
    assert.match(prompt, /Antigravity PlanGraph Task/);
    assert.equal(result.promptFilePath, '.plangraph/PROMPT.md');
  });
});
