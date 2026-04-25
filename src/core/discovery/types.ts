export type ProjectKind =
  | 'web-app' | 'mobile-app' | 'browser-extension'
  | 'rest-api' | 'cli-tool' | 'discord-bot'
  | 'telegram-bot' | 'landing-page' | '3d-web'
  | 'n8n-workflow' | 'ai-agent' | 'unknown';

export interface Question {
  id: string;
  text: { en: string; ar: string };
  hint?: { en: string; ar: string };
  type: 'single' | 'multi' | 'text' | 'boolean';
  options?: { value: string; label: { en: string; ar: string } }[];
  showWhen?: (answers: Record<string, unknown>) => boolean;
}

export interface ScopeSummary {
  idea: string;
  detectedKind: ProjectKind;
  answers: Record<string, unknown>;
  features: string[];
  stack: string[];
  mvpExclusions: string[];
  estimatedSteps: number;
  estimatedHours: { min: number; max: number };
}
