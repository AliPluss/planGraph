import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, parseReport } from '../report-parser';

describe('buildReport', () => {
  it('includes step title in heading', () => {
    const out = buildReport('Setup DB', 'created tables', 0, 1234);
    assert.ok(out.includes('Step Report: Setup DB'));
  });

  it('embeds exit code and duration', () => {
    const out = buildReport('T', 'output', 0, 5000);
    assert.ok(out.includes('**Exit code:** 0'));
    assert.ok(out.includes('**Duration:** 5000ms'));
  });

  it('marks success with checkmark', () => {
    const out = buildReport('T', 'ok', 0, 100);
    assert.ok(out.includes('✅ DONE'));
  });

  it('marks failure with X and exit code', () => {
    const out = buildReport('T', 'fail', 1, 100);
    assert.ok(out.includes('❌ ERROR (exit code 1)'));
  });

  it('uses placeholder when output is empty', () => {
    const out = buildReport('T', '', 0, 100);
    assert.ok(out.includes('(no output)'));
  });

  it('includes executor label', () => {
    const out = buildReport('T', 'x', 0, 100);
    assert.ok(out.includes('**Executor:** claude-code'));
  });
});

describe('parseReport', () => {
  it('round-trips a buildReport output', () => {
    const content = buildReport('My Step', 'All done.', 0, 3000);
    const summary = parseReport(content);
    assert.equal(summary.exitCode, 0);
    assert.equal(summary.durationMs, 3000);
    assert.equal(summary.status, 'success');
    assert.ok(summary.summary.includes('All done.'));
  });

  it('detects error status for non-zero exit code', () => {
    const content = buildReport('S', 'crash', 2, 500);
    const summary = parseReport(content);
    assert.equal(summary.status, 'error');
    assert.equal(summary.exitCode, 2);
  });

  it('truncates long summaries to 300 chars with ellipsis', () => {
    const longOutput = 'x'.repeat(400);
    const content = buildReport('S', longOutput, 0, 100);
    const summary = parseReport(content);
    assert.ok(summary.summary.length <= 304); // 300 + '…'
    assert.ok(summary.summary.endsWith('…'));
  });

  it('handles free-form human report gracefully', () => {
    const humanReport = `## What I did\n\nCreated the auth module and wrote tests.\n\n## Files changed\n- src/auth.ts`;
    const summary = parseReport(humanReport);
    assert.equal(summary.exitCode, 0);
    assert.equal(summary.status, 'success');
    assert.ok(summary.summary.length > 0);
  });

  it('returns durationMs 0 for reports without the field', () => {
    const summary = parseReport('Some free-form text without duration');
    assert.equal(summary.durationMs, 0);
  });
});
