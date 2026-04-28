import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildProject } from '../builder.js';
import type { ScopeSummary } from '../../discovery/types.js';

const webAppSummary: ScopeSummary = {
  idea: 'A task management SaaS with auth and payments',
  detectedKind: 'web-app',
  answers: { q_webapp_auth: true, q_webapp_database: true, q_webapp_payments: true },
  features: ['auth', 'database', 'payments'],
  stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Stripe'],
  mvpExclusions: [],
  estimatedSteps: 10,
  estimatedHours: { min: 20, max: 60 },
};

const opts = {
  name: 'My Task App',
  rootPath: '/tmp/my-task-app',
  locale: 'en' as const,
  executor: 'claude-code' as const,
};

describe('buildProject', () => {
  it('sets correct meta fields', () => {
    const project = buildProject(webAppSummary, opts);
    assert.equal(project.meta.name, 'My Task App');
    assert.equal(project.meta.idea, webAppSummary.idea);
    assert.equal(project.meta.templateId, 'nextjs-saas');
    assert.equal(project.meta.locale, 'en');
    assert.equal(project.meta.selectedExecutor, 'claude-code');
    assert.ok(project.meta.id.length > 0);
  });

  it('includes base steps', () => {
    const project = buildProject(webAppSummary, opts);
    const ids = project.steps.map((s) => s.id);
    assert.ok(ids.includes('01_project_setup'), 'missing 01_project_setup');
    assert.ok(ids.includes('11_deployment'), 'missing 11_deployment');
  });

  it('includes conditional steps whose features match', () => {
    const project = buildProject(webAppSummary, opts);
    const ids = project.steps.map((s) => s.id);
    assert.ok(ids.includes('04_authentication'), 'missing auth step');
    assert.ok(ids.includes('03_database_schema'), 'missing db step');
    assert.ok(ids.includes('09_payments'), 'missing payments step');
  });

  it('excludes conditional steps whose features are absent', () => {
    const noAdmin = { ...webAppSummary, features: ['auth', 'database'] };
    const project = buildProject(noAdmin, opts);
    const ids = project.steps.map((s) => s.id);
    assert.ok(!ids.includes('08_admin_panel'), 'admin should be excluded');
  });

  it('has no duplicate step IDs', () => {
    const project = buildProject(webAppSummary, opts);
    const ids = project.steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('builds edges from dependsOn', () => {
    const project = buildProject(webAppSummary, opts);
    const edge = project.edges.find(
      (e) => e.source === '01_project_setup' && e.target === '03_database_schema',
    );
    assert.ok(edge, '01_project_setup->03_database_schema edge missing');
  });

  it('does not create edges for out-of-set dependencies', () => {
    const minimal: ScopeSummary = {
      ...webAppSummary,
      features: [],
    };
    const project = buildProject(minimal, opts);
    // auth depends on 03_database_schema; if DB isn't included, no auth edge to schema
    const authStep = project.steps.find((s) => s.id === '04_authentication');
    if (!authStep) return; // auth excluded, nothing to check
    for (const edge of project.edges) {
      assert.ok(
        project.steps.some((s) => s.id === edge.source),
        `edge source ${edge.source} not in steps`,
      );
      assert.ok(
        project.steps.some((s) => s.id === edge.target),
        `edge target ${edge.target} not in steps`,
      );
    }
  });

  it('executionOrder respects topological sort', () => {
    const project = buildProject(webAppSummary, opts);
    const order = project.executionOrder;
    const idx = (id: string) => order.indexOf(id);
    assert.ok(idx('01_project_setup') < idx('03_database_schema'));
    assert.ok(idx('03_database_schema') < idx('04_authentication'));
    assert.ok(idx('04_authentication') < idx('08_admin_panel') || !order.includes('08_admin_panel'));
  });

  it('assigns positions to every step', () => {
    const project = buildProject(webAppSummary, opts);
    for (const step of project.steps) {
      assert.ok(step.position !== undefined, `${step.id} has no position`);
      assert.equal(typeof step.position!.x, 'number');
      assert.equal(typeof step.position!.y, 'number');
    }
  });

  it('uses locale for step titles (AR)', () => {
    const project = buildProject(webAppSummary, { ...opts, locale: 'ar' });
    const setup = project.steps.find((s) => s.id === '01_project_setup');
    assert.ok(setup, 'setup step missing');
    assert.equal(setup!.title, 'إعداد المشروع');
  });

  it('returns empty steps for a kind with no template', () => {
    const unknown: ScopeSummary = { ...webAppSummary, detectedKind: 'unknown', features: [] };
    const project = buildProject(unknown, opts);
    assert.equal(project.steps.length, 0);
    assert.equal(project.edges.length, 0);
    assert.equal(project.executionOrder.length, 0);
  });

  it('sets affects as inverse of dependsOn', () => {
    const project = buildProject(webAppSummary, opts);
    const setup = project.steps.find((s) => s.id === '01_project_setup')!;
    assert.ok(setup.affects.includes('02_design_system') || setup.affects.includes('03_database_schema'));
  });

  it('sets claudeCode prompt when executor is claude-code', () => {
    const project = buildProject(webAppSummary, opts);
    const step = project.steps[0];
    assert.ok(step.prompts.claudeCode, 'claudeCode prompt missing');
    assert.ok(step.prompts.cursor, 'cursor prompt missing');
    assert.ok(step.prompts.antigravity, 'antigravity prompt missing');
    assert.ok(step.prompts.copilot, 'copilot prompt missing');
    assert.ok(step.prompts.manual, 'manual prompt missing');
  });

  it('carries template protected files into every generated step', () => {
    const project = buildProject(webAppSummary, opts);
    for (const step of project.steps) {
      assert.ok(step.protectedFiles.includes('.env'), `${step.id} missing .env protection`);
      assert.ok(step.protectedFiles.includes('.git/**'), `${step.id} missing .git protection`);
    }
  });

  it('generates rich executor-aware prompts', () => {
    const project = buildProject(webAppSummary, opts);
    const step = project.steps[0];

    assert.match(step.prompts.manual, /Project context/);
    assert.match(step.prompts.manual, /Protected files/);
    assert.match(step.prompts.manual, /reports\/01_project_setup_report\.md/);

    assert.match(step.prompts.claudeCode ?? '', /SYSTEM:/);
    assert.match(step.prompts.claudeCode ?? '', /<user_input>/);
    assert.match(step.prompts.cursor ?? '', /@workspace\/projects/);
    assert.match(step.prompts.antigravity ?? '', /PlanGraph Skill Task/);
  });
});
