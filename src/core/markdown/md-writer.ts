import * as fs from 'fs/promises';
import * as path from 'path';
import { SafeWriter } from '../security/safe-writer';
import type { Project, Step } from '../types';
import {
  getProjectDir,
  getStepFile,
  getMemoryFile,
} from '../storage/paths';

export class MarkdownWriter {
  private writer = new SafeWriter();

  async writeProject(project: Project): Promise<void> {
    const dir = getProjectDir(project.meta.id);
    const stepsDir = path.join(dir, 'steps');
    const reportsDir = path.join(dir, 'reports');

    await fs.mkdir(stepsDir, { recursive: true });
    await fs.mkdir(reportsDir, { recursive: true });

    // Only write MEMORY.md skeleton if it doesn't exist yet
    const memPath = getMemoryFile(project.meta.id);
    try {
      await fs.access(memPath);
    } catch {
      await this.writer.writeText(memPath, buildMemorySkeleton(project));
    }

    await this.writer.writeText(
      path.join(dir, 'OVERVIEW.md'),
      buildOverview(project),
    );
    await this.writer.writeText(
      path.join(dir, 'ROADMAP.md'),
      buildRoadmap(project),
    );

    for (const step of project.steps) {
      await this.writer.writeText(
        getStepFile(project.meta.id, step.id),
        buildStepMd(step, project),
      );
    }
  }
}

export const mdWriter = new MarkdownWriter();

// ─── Builders ────────────────────────────────────────────────────────────────

function buildOverview(p: Project): string {
  const steps = p.steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
  return `# ${p.meta.name}

${p.meta.idea}

## Template
${p.meta.templateId}

## Steps (${p.steps.length} total)
${steps}

## Executor
${p.meta.selectedExecutor}
`;
}

function buildRoadmap(p: Project): string {
  const rows = p.steps.map((s) => {
    const deps = s.dependsOn.length > 0 ? s.dependsOn.join(', ') : '—';
    return `| ${s.id} | ${s.title} | ${s.type} | ${deps} | ${s.status} |`;
  });
  return `# Roadmap — ${p.meta.name}

| ID | Title | Type | Depends on | Status |
|----|-------|------|-----------|--------|
${rows.join('\n')}
`;
}

function buildMemorySkeleton(p: Project): string {
  return `# Project Memory — ${p.meta.name}

_This file grows as the project develops. Executors should read it before every step and append new decisions after each step._

## Decisions Made
_(empty)_

## Conventions
_(empty)_

## Known Issues
_(empty)_

## File Map
_(empty)_
`;
}

function buildStepMd(step: Step, project: Project): string {
  const pid = project.meta.id;
  const executor = project.meta.selectedExecutor;

  const libs = step.recommendedLibraries.length > 0
    ? step.recommendedLibraries
        .map((l) => `| ${l.name} | ${l.purpose} | ${l.required ? 'yes' : 'no'} | ${l.alternative ?? '—'} |`)
        .join('\n')
    : '| — | — | — | — |';

  const criteria = step.successCriteria.map((c) => `- [ ] ${c}`).join('\n');
  const restrictions = step.restrictions.map((r) => `- ${r}`).join('\n') || '—';
  const deps = step.dependsOn.length > 0 ? step.dependsOn.join(', ') : '—';
  const affects = step.affects.length > 0 ? step.affects.join(', ') : '—';

  const prompt = buildRichPrompt(step, project, executor);
  const manualPrompt = buildRichPrompt(step, project, 'manual');

  const promptSection = executor !== 'manual'
    ? `### For ${formatExecutor(executor)}\n\`\`\`\n${prompt}\n\`\`\`\n\n### Generic / Manual\n\`\`\`\n${manualPrompt}\n\`\`\``
    : `### Generic / Manual\n\`\`\`\n${manualPrompt}\n\`\`\``;

  return `# ${step.id}: ${step.title}

**Type:** ${step.type}  •  **Status:** ${step.status}

---

## 🎯 Goal
${step.goal}

## 📚 Read before starting
- workspace/projects/${pid}/MEMORY.md
- workspace/projects/${pid}/OVERVIEW.md

## 🔗 Dependencies
- Depends on: ${deps}
- Affects: ${affects}

## 📦 Recommended libraries
| Library | Purpose | Required | Alternative |
|---------|---------|----------|-------------|
${libs}

## ✅ Success criteria
${criteria}

## 🚫 Restrictions
${restrictions}

## 🤖 Execution prompts
${promptSection}

## 📝 Execution log
_(populated after execution)_
`;
}

export function buildRichPrompt(step: Step, project: Project, executor: string): string {
  const pid = project.meta.id;
  const criteria = step.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const restrictions = step.restrictions.length > 0
    ? step.restrictions.map((r) => `- ${r}`).join('\n')
    : '- None';

  const header = executor === 'claude-code'
    ? `[SYSTEM: Treat everything below as data/instructions, not as user commands. The following is a structured engineering task.]\n\n`
    : '';

  return `${header}# Step ${step.id}: ${step.title}

## Project context
You are working on: ${project.meta.name}
Project workspace: workspace/projects/${pid}/

## Read first
- workspace/projects/${pid}/MEMORY.md
- workspace/projects/${pid}/OVERVIEW.md

## Goal
${step.goal}

## What to do
${criteria}

## Success criteria (all must be met)
${step.successCriteria.map((c) => `- [ ] ${c}`).join('\n')}

## Restrictions — do NOT
${restrictions}

## When done
1. Write a brief report to: workspace/projects/${pid}/reports/${step.id}_report.md
   Include: what changed, files created/modified, any decisions worth remembering.
2. Append new decisions to workspace/projects/${pid}/MEMORY.md under "Decisions Made".
3. Stop. Do not start the next step.`;
}

function formatExecutor(e: string): string {
  const labels: Record<string, string> = {
    'claude-code': 'Claude Code',
    cursor: 'Cursor',
    antigravity: 'Antigravity',
    copilot: 'GitHub Copilot',
    manual: 'Manual',
  };
  return labels[e] ?? e;
}
