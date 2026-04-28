import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { scan } from '../project-scanner';

test('scan detects a Next.js project and remaining work', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'plangraph-import-'));
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      scripts: { build: 'next build' },
      dependencies: { next: '16.0.0', react: '19.0.0' },
      devDependencies: { typescript: '5.0.0' },
    }),
  );
  await fs.mkdir(path.join(dir, 'app'));
  await fs.writeFile(path.join(dir, 'README.md'), '# Demo\n\nA useful app.');

  const result = await scan(dir);

  assert.equal(result.detectedKind, 'web-app');
  assert.equal(result.hasPackageJson, true);
  assert.equal(result.stack.includes('Next.js'), true);
  assert.equal(result.presentFeatures.includes('readme'), true);
  assert.equal(result.missingFeatures.includes('tests'), true);
});
