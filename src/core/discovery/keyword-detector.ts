import type { ProjectKind } from './types';

const KEYWORD_MAP: { keywords: string[]; kind: ProjectKind }[] = [
  {
    keywords: ['website', 'web app', 'webapp', 'web application', 'تطبيق ويب', 'موقع', 'تطبيق الويب'],
    kind: 'web-app',
  },
  {
    keywords: ['extension', 'browser extension', 'chrome extension', 'إضافة', 'متصفح', 'إضافة متصفح'],
    kind: 'browser-extension',
  },
  {
    keywords: ['api', 'rest api', 'rest', 'backend', 'server', 'microservice', 'واجهة برمجية', 'خادم'],
    kind: 'rest-api',
  },
  {
    keywords: ['cli', 'command line', 'terminal', 'command-line tool', 'سطر أوامر', 'أداة سطر الأوامر'],
    kind: 'cli-tool',
  },
  {
    keywords: ['discord', 'discord bot', 'دسكورد', 'بوت دسكورد'],
    kind: 'discord-bot',
  },
  {
    keywords: ['telegram', 'telegram bot', 'تليجرام', 'بوت تليجرام', 'بوت'],
    kind: 'telegram-bot',
  },
  {
    keywords: ['landing', 'landing page', 'marketing page', 'صفحة هبوط', 'تسويق', 'صفحة تسويقية'],
    kind: 'landing-page',
  },
  {
    keywords: ['three.js', 'threejs', '3d', '3d web', 'ثلاثي الأبعاد', 'webgl'],
    kind: '3d-web',
  },
  {
    keywords: ['n8n', 'workflow', 'automation', 'automate', 'أتمتة', 'سير عمل'],
    kind: 'n8n-workflow',
  },
  {
    keywords: ['agent', 'ai agent', 'llm agent', 'وكيل ذكي', 'وكيل', 'llm', 'intelligent agent'],
    kind: 'ai-agent',
  },
  {
    keywords: ['mobile', 'mobile app', 'ios', 'android', 'react native', 'flutter', 'تطبيق جوال', 'جوال', 'موبايل'],
    kind: 'mobile-app',
  },
];

export function detectKind(idea: string): ProjectKind {
  const lower = idea.toLowerCase();
  for (const { keywords, kind } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return kind;
    }
  }
  return 'unknown';
}
