import * as fs from 'fs/promises';
import * as path from 'path';
import { SafeWriter } from '../security/safe-writer';
import { withRecentMemory } from '../plan-builder/prompt-builder';
import type { Project, Step } from '../types';
import {
  getProjectDir,
  getProjectFile,
  getStepFile,
  getMemoryFile,
} from '../storage/paths';
import { storage as defaultStorage, type Storage } from '../storage/storage';

export class MarkdownWriter {
  private writer = new SafeWriter();

  constructor(private storage: Storage = defaultStorage) {}

  async writeProject(project: Project): Promise<void> {
    const dir = getProjectDir(project.meta.id);
    const stepsDir = path.join(dir, 'steps');
    const reportsDir = path.join(dir, 'reports');

    await fs.mkdir(stepsDir, { recursive: true });
    await fs.mkdir(reportsDir, { recursive: true });

    const projectFile = getProjectFile(project.meta.id);
    try {
      await fs.access(projectFile);
    } catch {
      await this.storage.writeProject(project);
    }

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
  const stack = getProjectStack(p).map((item) => `- ${item}`).join('\n') || '- Not specified';
  const exclusions = getProjectExclusions(p).map((item) => `- ${item}`).join('\n') || '- None';
  const effort = getProjectEffort(p);

  return `# ${p.meta.name}

${p.meta.idea}

## Detected project kind
${p.meta.templateId}

## Stack
${stack}

## Steps (${p.steps.length} total)
${steps}

## Excluded from MVP
${exclusions}

## Estimated effort
${effort}

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
        .map((l) => `| ${l.name} | ${l.purpose} | ${l.required ? 'yes' : 'no'} | ${l.alternative ?? '—'} | ${l.rationale ?? '—'} |`)
        .join('\n')
    : '| — | — | — | — | — |';

  const criteria = step.successCriteria.map((c) => `- [ ] ${c}`).join('\n');
  const restrictions = step.restrictions.map((r) => `- ${r}`).join('\n') || '—';
  const protectedFiles = step.protectedFiles.map((file) => `- ${file}`).join('\n') || '- None';
  const contextFiles = step.contextFiles.map((file) => `- ${file}`).join('\n');
  const deps = step.dependsOn.length > 0 ? step.dependsOn.join(', ') : '—';
  const affects = step.affects.length > 0 ? step.affects.join(', ') : '—';

  const promptSection = buildPromptSection(step, project, executor);

  return `# ${step.id}: ${step.title}

**Type:** ${step.type}  •  **Status:** ${step.status}  •  **Estimated:** ${getStepEffort(step, project)} hours

---

## 🎯 Goal
${step.goal}

## 📚 Read before starting
- workspace/projects/${pid}/MEMORY.md
- workspace/projects/${pid}/OVERVIEW.md
${contextFiles}

## 🔗 Dependencies
- Depends on: ${deps}
- Affects: ${affects}

## 📦 Recommended libraries
| Library | Purpose | Required | Alternative | Why |
|---------|---------|----------|-------------|-----|
${libs}

## ✅ Success criteria
${criteria}

## 🚫 Restrictions
${restrictions}

## 🛡️ Protected files (do NOT modify)
${protectedFiles}

## 🤖 Execution prompts
${promptSection}

## 📊 Status
_Last updated: ${new Date().toISOString()}_

## 📝 Execution log
_(populated after execution)_
`;
}

export function buildRichPrompt(step: Step, project: Project, executor: string, memoryContent?: string): string {
  const key = executor === 'claude-code' ? 'claudeCode' : executor;
  const prompt = step.prompts[key as keyof typeof step.prompts] ?? step.prompts.manual;
  return withRecentMemory(prompt, memoryContent);
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

function buildPromptSection(step: Step, project: Project, selectedExecutor: string): string {
  const entries: Array<[string, string | undefined]> = [
    ['Claude Code', step.prompts.claudeCode],
    ['Cursor', step.prompts.cursor],
    ['Antigravity', step.prompts.antigravity],
    ['GitHub Copilot', step.prompts.copilot],
    ['Generic / Manual', step.prompts.manual],
  ];

  const sorted = entries.sort(([labelA], [labelB]) => {
    const selectedLabel = formatExecutor(selectedExecutor);
    if (labelA === selectedLabel) return -1;
    if (labelB === selectedLabel) return 1;
    return 0;
  });

  return sorted
    .filter(([, prompt]) => Boolean(prompt))
    .map(([label, prompt]) => `### For ${label}\n\`\`\`\n${prompt}\n\`\`\``)
    .join('\n\n');
}

function getProjectStack(p: Project): string[] {
  const details = p.meta as Project['meta'] & { stack?: string[] };
  if (Array.isArray(details.stack)) return details.stack;
  const libraries = new Set<string>();
  for (const step of p.steps) {
    for (const lib of step.recommendedLibraries) libraries.add(lib.name);
  }
  return [...libraries];
}

function getProjectExclusions(p: Project): string[] {
  const details = p.meta as Project['meta'] & { mvpExclusions?: string[] };
  return Array.isArray(details.mvpExclusions) ? details.mvpExclusions : [];
}

function getProjectEffort(p: Project): string {
  const details = p.meta as Project['meta'] & { estimatedHours?: { min: number; max: number } };
  if (details.estimatedHours) {
    return `${details.estimatedHours.min}-${details.estimatedHours.max} hours`;
  }
  return `${p.steps.length * 2}-${p.steps.length * 6} hours`;
}

function getStepEffort(step: Step, project: Project): number {
  const details = project.meta as Project['meta'] & { estimatedHours?: { min: number; max: number } };
  if (!details.estimatedHours || project.steps.length === 0) return 2;
  return Math.max(1, Math.round(details.estimatedHours.max / project.steps.length));
}
