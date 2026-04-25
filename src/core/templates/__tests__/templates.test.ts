import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { listTemplates, getTemplate, getTemplateForKind } from '../registry';
import type { Template } from '../types';

describe('templates registry', () => {
  test('listTemplates returns all 6 templates', () => {
    const all = listTemplates();
    assert.equal(all.length, 6);
  });

  test('getTemplate returns null for unknown id', () => {
    assert.equal(getTemplate('does-not-exist'), null);
  });

  test('getTemplateForKind returns null for unknown kind', () => {
    assert.equal(getTemplateForKind('unknown'), null);
  });

  test('getTemplateForKind returns null for ai-agent (no template yet)', () => {
    assert.equal(getTemplateForKind('ai-agent'), null);
  });

  const kindMappings: Array<[Parameters<typeof getTemplateForKind>[0], string]> = [
    ['web-app', 'nextjs-saas'],
    ['browser-extension', 'browser-extension'],
    ['rest-api', 'rest-api'],
    ['cli-tool', 'cli-tool'],
    ['telegram-bot', 'telegram-bot'],
    ['landing-page', 'landing-page'],
  ];

  for (const [kind, expectedId] of kindMappings) {
    test(`getTemplateForKind("${kind}") returns template with id "${expectedId}"`, () => {
      const template = getTemplateForKind(kind);
      assert.ok(template, `Expected a template for kind "${kind}"`);
      assert.equal(template.id, expectedId);
    });
  }
});

describe('each template structure', () => {
  const all = listTemplates();

  for (const template of all) {
    describe(`template: ${template.id}`, () => {
      test('has at least 8 base steps', () => {
        assert.ok(
          template.baseSteps.length >= 8,
          `${template.id} has only ${template.baseSteps.length} base steps (need ≥ 8)`,
        );
      });

      test('has protectedFiles defined and non-empty', () => {
        assert.ok(
          Array.isArray(template.protectedFiles) && template.protectedFiles.length > 0,
          `${template.id} must have at least one protected file`,
        );
      });

      test('has EN and AR name and description', () => {
        assert.ok(template.name.en, `${template.id}: missing name.en`);
        assert.ok(template.name.ar, `${template.id}: missing name.ar`);
        assert.ok(template.description.en, `${template.id}: missing description.en`);
        assert.ok(template.description.ar, `${template.id}: missing description.ar`);
      });

      test('has a defaultStack with at least one entry', () => {
        assert.ok(
          template.defaultStack.length >= 1,
          `${template.id} defaultStack is empty`,
        );
      });

      test('every base step has at least one recommendedLibrary', () => {
        for (const step of template.baseSteps) {
          assert.ok(
            step.recommendedLibraries.length >= 1,
            `${template.id} step "${step.id}": needs at least one recommendedLibrary`,
          );
        }
      });

      test('every base step has at least 3 EN success criteria', () => {
        for (const step of template.baseSteps) {
          assert.ok(
            step.successCriteria.en.length >= 3,
            `${template.id} step "${step.id}": needs ≥ 3 EN successCriteria (has ${step.successCriteria.en.length})`,
          );
        }
      });

      test('every base step has EN and AR text in title and goal', () => {
        for (const step of template.baseSteps) {
          assert.ok(step.title.en, `${template.id} step "${step.id}": missing title.en`);
          assert.ok(step.title.ar, `${template.id} step "${step.id}": missing title.ar`);
          assert.ok(step.goal.en, `${template.id} step "${step.id}": missing goal.en`);
          assert.ok(step.goal.ar, `${template.id} step "${step.id}": missing goal.ar`);
        }
      });

      test('step ids are unique within the template', () => {
        const allSteps = [...template.baseSteps, ...template.conditionalSteps];
        const ids = allSteps.map((s) => s.id);
        const unique = new Set(ids);
        assert.equal(
          unique.size,
          ids.length,
          `${template.id}: duplicate step ids found`,
        );
      });

      test('all conditional steps have includeWhen defined', () => {
        for (const step of template.conditionalSteps) {
          assert.ok(
            typeof step.includeWhen === 'function',
            `${template.id} conditional step "${step.id}" is missing includeWhen`,
          );
        }
      });

      test('includeWhen functions receive a features array and return boolean', () => {
        for (const step of template.conditionalSteps) {
          if (step.includeWhen) {
            const resultTrue = step.includeWhen(['database', 'auth', 'payments', 'admin',
              'content-script', 'options', 'rate-limiting', 'inline', 'pricing',
              'testimonials', 'faq', 'analytics']);
            const resultFalse = step.includeWhen([]);
            assert.equal(typeof resultTrue, 'boolean');
            assert.equal(resultFalse, false, `${template.id} step "${step.id}" includeWhen([]) should return false`);
          }
        }
      });
    });
  }
});

describe('template round-trips through registry', () => {
  test('getTemplate(id) returns the same object as listTemplates() entry', () => {
    for (const template of listTemplates()) {
      const fetched = getTemplate(template.id);
      assert.equal(fetched, template);
    }
  });
});

describe('template report', () => {
  test('print summary', () => {
    for (const t of listTemplates()) {
      const total = t.baseSteps.length + t.conditionalSteps.length;
      console.log(`  ${t.id}: ${t.baseSteps.length} base + ${t.conditionalSteps.length} conditional = ${total} steps`);
    }
    assert.ok(true);
  });
});
