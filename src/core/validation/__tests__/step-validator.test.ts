import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { SnapshotManager } from '../../snapshots/snapshot-manager';
import { StepValidator } from '../step-validator';
import type { Step } from '../../types';

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: '01_setup',
    title: 'Setup',
    type: 'setup',
    status: 'in_progress',
    goal: 'Set up the project.',
    contextFiles: [],
    recommendedLibraries: [],
    successCriteria: [],
    restrictions: [],
    protectedFiles: ['.env', 'secrets/**'],
    prompts: { manual: 'Do the setup.' },
    dependsOn: [],
    affects: [],
    mdFile: 'steps/01_setup.md',
    ...overrides,
  };
}

async function makeRepo(): Promise<{ root: string; snapshotManager: SnapshotManager; tag: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'plangraph-validator-'));
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.mkdir(path.join(root, 'secrets'), { recursive: true });
  await fs.writeFile(path.join(root, 'README.md'), '# Test\n', 'utf8');
  await fs.writeFile(path.join(root, 'secrets', 'token.txt'), 'placeholder\n', 'utf8');
  const snapshotManager = new SnapshotManager(root);
  const { tag } = await snapshotManager.snapshot('before-01_setup');
  return { root, snapshotManager, tag };
}

test('StepValidator flags protected file edits, secret leaks, and missing reports', async () => {
  const { root, snapshotManager, tag } = await makeRepo();
  await fs.writeFile(path.join(root, 'secrets', 'token.txt'), 'TOKEN=sk-ant-test-secret\n', 'utf8');

  const validator = new StepValidator(root, snapshotManager);
  const report = await validator.validate(makeStep(), tag);

  assert.equal(report.passed, false);
  assert.deepEqual(report.checks.protectedFiles.violations, ['secrets/token.txt']);
  assert.equal(report.checks.secretLeaks.matches[0]?.pattern, 'sk-ant-');
  assert.equal(report.checks.reportPresent.passed, false);
});

test('StepValidator passes clean changes with a non-empty report', async () => {
  const { root, snapshotManager, tag } = await makeRepo();
  await fs.writeFile(path.join(root, 'src.txt'), 'clean change\n', 'utf8');
  await fs.writeFile(path.join(root, 'reports', '01_setup_report.md'), 'Done.\n', 'utf8');

  const validator = new StepValidator(root, snapshotManager);
  const report = await validator.validate(makeStep(), tag);

  assert.equal(report.passed, true);
  assert.equal(report.checks.protectedFiles.violations.length, 0);
  assert.equal(report.checks.secretLeaks.matches.length, 0);
  assert.equal(report.checks.reportPresent.passed, true);
});
