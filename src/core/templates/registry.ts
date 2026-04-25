import type { Template } from './types';
import type { ProjectKind } from '../types';
import nextjsSaas from './library/nextjs-saas';
import browserExtension from './library/browser-extension';
import restApi from './library/rest-api';
import cliTool from './library/cli-tool';
import telegramBot from './library/telegram-bot';
import landingPage from './library/landing-page';

export const templates: Record<string, Template> = {
  [nextjsSaas.id]: nextjsSaas,
  [browserExtension.id]: browserExtension,
  [restApi.id]: restApi,
  [cliTool.id]: cliTool,
  [telegramBot.id]: telegramBot,
  [landingPage.id]: landingPage,
};

const kindToTemplateId: Partial<Record<ProjectKind, string>> = {
  'web-app': 'nextjs-saas',
  'browser-extension': 'browser-extension',
  'rest-api': 'rest-api',
  'cli-tool': 'cli-tool',
  'telegram-bot': 'telegram-bot',
  'landing-page': 'landing-page',
};

export function getTemplate(id: string): Template | null {
  return templates[id] ?? null;
}

export function getTemplateForKind(kind: ProjectKind): Template | null {
  const id = kindToTemplateId[kind];
  if (!id) return null;
  return templates[id] ?? null;
}

export function listTemplates(): Template[] {
  return Object.values(templates);
}
