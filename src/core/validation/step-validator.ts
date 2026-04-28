import * as fs from 'fs/promises';
import * as path from 'path';
import picomatch from 'picomatch';
import { safeCommandRunner } from '../security/command-runner';
import { pathGuard } from '../security/path-guard';
import type { Step, ValidationReport } from '../types';
import type { SnapshotManager } from '../snapshots/snapshot-manager';

interface ValidateOptions {
  projectProtectedFiles?: string[];
  signal?: AbortSignal;
}

const SECRET_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'sk-ant-', pattern: /sk-ant-[A-Za-z0-9_-]+/ },
  { label: 'sk-', pattern: /sk-[A-Za-z0-9_-]{8,}/ },
  { label: 'AIza', pattern: /AIza[0-9A-Za-z_-]{20,}/ },
  { label: 'RSA private key', pattern: /-----BEGIN RSA PRIVATE KEY-----/ },
  { label: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
];

function normalizeGitPath(filePath: string): string {
  return filePath.trim().replace(/\\/g, '/');
}

function toSummary(report: ValidationReport): string {
  if (report.passed) {
    return 'Validation passed: no protected files or secret leaks were detected.';
  }

  const failed: string[] = [];
  if (!report.checks.protectedFiles.passed) failed.push('protected files changed');
  if (!report.checks.secretLeaks.passed) failed.push('secret-like content detected');
  if (report.checks.buildStillWorks.ran && !report.checks.buildStillWorks.passed) failed.push('build failed');
  if (!report.checks.reportPresent.passed) failed.push('completion report missing');

  return `Validation needs review: ${failed.join(', ')}.`;
}

export class StepValidator {
  constructor(
    private readonly rootPath: string,
    private readonly snapshotManager: SnapshotManager,
  ) {}

  async validate(
    step: Step,
    snapshotTagBefore: string,
    options: ValidateOptions = {},
  ): Promise<ValidationReport> {
    const changedFiles = await this.getChangedFiles(snapshotTagBefore);
    const protectedGlobs = [...step.protectedFiles, ...(options.projectProtectedFiles ?? [])];
    const protectedFiles = this.checkProtectedFiles(changedFiles, protectedGlobs);
    const secretLeaks = await this.checkSecretLeaks(changedFiles);
    const reportPresent = await this.checkReportPresent(step.id);
    const buildStillWorks = await this.checkBuildStillWorks(options.signal);

    const report: ValidationReport = {
      passed:
        protectedFiles.passed &&
        secretLeaks.passed &&
        (!buildStillWorks.ran || buildStillWorks.passed) &&
        reportPresent.passed,
      checks: {
        protectedFiles,
        secretLeaks,
        buildStillWorks,
        reportPresent,
      },
      summary: '',
    };
    report.summary = toSummary(report);
    return report;
  }

  private async getChangedFiles(snapshotTagBefore: string): Promise<string[]> {
    await this.snapshotManager.ensureRepo({ allowNestedRepo: true });
    const committedResult = await safeCommandRunner.run(
      'git',
      ['diff', snapshotTagBefore, 'HEAD', '--name-only'],
      this.rootPath,
      { timeoutMs: 30_000 },
    );
    if (committedResult.exitCode !== 0) {
      throw new Error(`git diff failed: ${committedResult.stderr || committedResult.stdout}`);
    }

    const workingTreeResult = await safeCommandRunner.run(
      'git',
      ['diff', snapshotTagBefore, '--name-only'],
      this.rootPath,
      { timeoutMs: 30_000 },
    );
    if (workingTreeResult.exitCode !== 0) {
      throw new Error(`git diff failed: ${workingTreeResult.stderr || workingTreeResult.stdout}`);
    }

    const untrackedResult = await safeCommandRunner.run(
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      this.rootPath,
      { timeoutMs: 30_000 },
    );
    if (untrackedResult.exitCode !== 0) {
      throw new Error(`git ls-files failed: ${untrackedResult.stderr || untrackedResult.stdout}`);
    }

    return Array.from(new Set([
      committedResult.stdout,
      workingTreeResult.stdout,
      untrackedResult.stdout,
    ].join('\n')
      .split(/\r?\n/)
      .map(normalizeGitPath)
      .filter(Boolean)));
  }

  private checkProtectedFiles(
    changedFiles: string[],
    protectedGlobs: string[],
  ): ValidationReport['checks']['protectedFiles'] {
    const uniqueGlobs = Array.from(new Set(protectedGlobs.map(normalizeGitPath).filter(Boolean)));
    if (uniqueGlobs.length === 0) {
      return { passed: true, violations: [] };
    }

    const matcher = picomatch(uniqueGlobs, { dot: true, nocase: process.platform === 'win32' });
    const violations = changedFiles.filter((file) => matcher(file));
    return { passed: violations.length === 0, violations };
  }

  private async checkSecretLeaks(
    changedFiles: string[],
  ): Promise<ValidationReport['checks']['secretLeaks']> {
    const matches: Array<{ file: string; pattern: string }> = [];

    for (const file of changedFiles) {
      const absolutePath = pathGuard.resolveSafe(file, this.rootPath);
      const stat = await this.statOrNull(absolutePath);
      if (!stat?.isFile()) continue;
      if (stat.size > 512 * 1024) continue;

      const buffer = await fs.readFile(absolutePath);
      if (buffer.includes(0)) continue;
      const content = buffer.toString('utf8');

      for (const secretPattern of SECRET_PATTERNS) {
        if (secretPattern.pattern.test(content)) {
          matches.push({ file, pattern: secretPattern.label });
        }
      }
    }

    return { passed: matches.length === 0, matches };
  }

  private async checkBuildStillWorks(
    signal?: AbortSignal,
  ): Promise<ValidationReport['checks']['buildStillWorks']> {
    const packageJsonPath = pathGuard.resolveSafe('package.json', this.rootPath);
    try {
      const raw = await fs.readFile(packageJsonPath, 'utf8');
      const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
      if (!parsed.scripts?.build) {
        return { ran: false, passed: true };
      }
    } catch {
      return { ran: false, passed: true };
    }

    try {
      const result = await safeCommandRunner.run('npm', ['run', 'build'], this.rootPath, {
        timeoutMs: 90_000,
        signal,
      });
      const output = `${result.stdout}\n${result.stderr}`.trim().slice(-4000);
      return { ran: true, passed: result.exitCode === 0, output };
    } catch (error) {
      return { ran: true, passed: false, output: String(error) };
    }
  }

  private async checkReportPresent(
    stepId: string,
  ): Promise<ValidationReport['checks']['reportPresent']> {
    const relativePath = path.join('reports', `${stepId}_report.md`).replace(/\\/g, '/');
    const reportPath = pathGuard.resolveSafe(relativePath, this.rootPath);
    try {
      const content = await fs.readFile(reportPath, 'utf8');
      return { passed: content.trim().length > 0, path: relativePath };
    } catch {
      return { passed: false, path: relativePath };
    }
  }

  private async statOrNull(filePath: string) {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }
}
