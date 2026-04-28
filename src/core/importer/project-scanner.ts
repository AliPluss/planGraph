import * as fs from 'fs/promises';
import * as path from 'path';
import type { ProjectKind } from '../types';

const MAX_READ_BYTES = 256 * 1024;

export interface ScanResult {
  detectedKind: ProjectKind;
  stack: string[];
  hasGit: boolean;
  hasPackageJson: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | null;
  presentFeatures: string[];
  missingFeatures: string[];
  summary: string;
}

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export async function scan(rootPath: string): Promise<ScanResult> {
  const root = path.resolve(rootPath);
  const entries = await safeReadDir(root);
  const names = new Set(entries.map((entry) => entry.name));
  const packageJson = await readPackageJson(path.join(root, 'package.json'));
  const deps = collectDeps(packageJson);

  const hasGit = names.has('.git');
  const hasPackageJson = Boolean(packageJson);
  const stack = detectStack(deps, names, packageJson);
  const detectedKind = detectKind(deps, names, packageJson);
  const presentFeatures = await detectPresentFeatures(root, names, deps, packageJson);
  const missingFeatures = detectMissingFeatures(names, deps, packageJson, presentFeatures);
  const readmeIntro = await readFirstParagraph(path.join(root, 'README.md'));

  const summaryParts = [
    readmeIntro,
    `Detected ${labelKind(detectedKind)} with ${stack.length ? stack.join(', ') : 'no framework markers'}.`,
    missingFeatures.length
      ? `Remaining work candidates: ${missingFeatures.join(', ')}.`
      : 'No obvious gaps were detected; use the import questions to focus the plan.',
  ].filter(Boolean);

  return {
    detectedKind,
    stack,
    hasGit,
    hasPackageJson,
    packageManager: detectPackageManager(names),
    presentFeatures,
    missingFeatures,
    summary: summaryParts.join(' '),
  };
}

async function safeReadDir(dir: string): Promise<import('fs').Dirent[]> {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function readPackageJson(filePath: string): Promise<PackageJson | null> {
  const content = await readSmallText(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

async function readSmallText(filePath: string): Promise<string | null> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > MAX_READ_BYTES) return null;
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function collectDeps(pkg: PackageJson | null): Set<string> {
  return new Set([
    ...Object.keys(pkg?.dependencies ?? {}),
    ...Object.keys(pkg?.devDependencies ?? {}),
  ]);
}

function detectStack(deps: Set<string>, names: Set<string>, pkg: PackageJson | null): string[] {
  const stack = new Set<string>();
  if (deps.has('next')) stack.add('Next.js');
  if (deps.has('react')) stack.add('React');
  if (deps.has('typescript') || names.has('tsconfig.json')) stack.add('TypeScript');
  if (deps.has('tailwindcss') || names.has('tailwind.config.ts') || names.has('tailwind.config.js')) stack.add('Tailwind CSS');
  if (deps.has('prisma') || names.has('prisma')) stack.add('Prisma');
  if (deps.has('@prisma/client')) stack.add('Prisma Client');
  if (deps.has('express')) stack.add('Express');
  if (deps.has('fastify')) stack.add('Fastify');
  if (deps.has('zod')) stack.add('Zod');
  if (deps.has('vitest')) stack.add('Vitest');
  if (deps.has('jest')) stack.add('Jest');
  if (deps.has('playwright')) stack.add('Playwright');
  if (deps.has('clerk') || deps.has('@clerk/nextjs')) stack.add('Clerk');
  if (pkg?.scripts?.build) stack.add('Build script');
  return [...stack];
}

function detectKind(deps: Set<string>, names: Set<string>, pkg: PackageJson | null): ProjectKind {
  if (deps.has('next') || names.has('app') || names.has('pages')) return 'web-app';
  if (deps.has('express') || deps.has('fastify')) return 'rest-api';
  if (names.has('manifest.json') || names.has('extension')) return 'browser-extension';
  if (pkg?.scripts?.start && !deps.has('react')) return 'cli-tool';
  return 'unknown';
}

async function detectPresentFeatures(
  root: string,
  names: Set<string>,
  deps: Set<string>,
  pkg: PackageJson | null,
): Promise<string[]> {
  const features = new Set<string>();
  if (names.has('.git')) features.add('git');
  if (pkg?.scripts?.build) features.add('build');
  if (pkg?.scripts?.test || deps.has('vitest') || deps.has('jest') || deps.has('playwright')) features.add('tests');
  if (names.has('.github')) features.add('ci');
  if (names.has('.env.example')) features.add('env-example');
  if (deps.has('prisma') || deps.has('@prisma/client') || names.has('prisma')) features.add('database');
  if (deps.has('@clerk/nextjs') || deps.has('next-auth') || deps.has('@auth/core')) features.add('auth');
  if (names.has('README.md')) features.add('readme');
  if (await hasAnyDirectory(root, ['tests', '__tests__', 'e2e'])) features.add('test-folders');
  return [...features];
}

function detectMissingFeatures(
  names: Set<string>,
  deps: Set<string>,
  pkg: PackageJson | null,
  present: string[],
): string[] {
  const presentSet = new Set(present);
  const missing = new Set<string>();
  if (!pkg?.scripts?.test && !presentSet.has('test-folders')) missing.add('tests');
  if (!pkg?.scripts?.build) missing.add('build script');
  if (!presentSet.has('ci')) missing.add('CI workflow');
  if (!presentSet.has('env-example')) missing.add('environment example');
  if (!presentSet.has('readme')) missing.add('README');
  if ((deps.has('next') || deps.has('react')) && !presentSet.has('auth')) missing.add('auth decision');
  if ((deps.has('next') || deps.has('express') || deps.has('fastify')) && !presentSet.has('database')) missing.add('data layer decision');
  if (!names.has('.gitignore')) missing.add('gitignore');
  return [...missing];
}

function detectPackageManager(names: Set<string>): ScanResult['packageManager'] {
  if (names.has('pnpm-lock.yaml')) return 'pnpm';
  if (names.has('yarn.lock')) return 'yarn';
  if (names.has('package-lock.json')) return 'npm';
  return null;
}

async function readFirstParagraph(readmePath: string): Promise<string | null> {
  const content = await readSmallText(readmePath);
  if (!content) return null;
  const paragraph = content
    .replace(/^# .+$/m, '')
    .split(/\r?\n\r?\n/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .find(Boolean);
  return paragraph ? paragraph.slice(0, 500) : null;
}

async function hasAnyDirectory(root: string, names: string[]): Promise<boolean> {
  for (const name of names) {
    try {
      const stat = await fs.stat(path.join(root, name));
      if (stat.isDirectory()) return true;
    } catch {
      // keep scanning
    }
  }
  return false;
}

function labelKind(kind: ProjectKind): string {
  return kind === 'unknown' ? 'a custom project' : `a ${kind.replace(/-/g, ' ')}`;
}
