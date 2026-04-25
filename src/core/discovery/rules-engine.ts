import { InputSanitizer } from '../security/input-sanitizer';
import { detectKind } from './keyword-detector';
import { commonQuestions, kindQuestions } from './question-bank';
import type { ProjectKind, Question, ScopeSummary } from './types';

const sanitizer = new InputSanitizer();

const BATCH_SIZE = 3;

const STACK_BY_KIND: Record<ProjectKind, string[]> = {
  'web-app': ['Next.js', 'TypeScript', 'Tailwind CSS'],
  'mobile-app': ['React Native', 'TypeScript', 'Expo'],
  'browser-extension': ['TypeScript', 'WebExtensions API'],
  'rest-api': ['Node.js', 'Express', 'TypeScript'],
  'cli-tool': ['Node.js', 'TypeScript', 'Commander.js'],
  'discord-bot': ['Node.js', 'discord.js', 'TypeScript'],
  'telegram-bot': ['Node.js', 'Telegraf', 'TypeScript'],
  'landing-page': ['HTML/CSS', 'JavaScript', 'Tailwind CSS'],
  '3d-web': ['Three.js', 'React Three Fiber', 'TypeScript'],
  'n8n-workflow': ['n8n', 'JSON'],
  'ai-agent': ['Python', 'LangChain', 'OpenAI SDK'],
  'unknown': ['TypeScript'],
};

const STEP_ESTIMATE: Record<ProjectKind, number> = {
  'web-app': 10,
  'mobile-app': 9,
  'browser-extension': 6,
  'rest-api': 7,
  'cli-tool': 5,
  'discord-bot': 6,
  'telegram-bot': 6,
  'landing-page': 4,
  '3d-web': 7,
  'n8n-workflow': 4,
  'ai-agent': 8,
  'unknown': 6,
};

const HOURS_ESTIMATE: Record<ProjectKind, { min: number; max: number }> = {
  'web-app': { min: 20, max: 60 },
  'mobile-app': { min: 30, max: 80 },
  'browser-extension': { min: 8, max: 24 },
  'rest-api': { min: 12, max: 40 },
  'cli-tool': { min: 4, max: 16 },
  'discord-bot': { min: 6, max: 20 },
  'telegram-bot': { min: 6, max: 20 },
  'landing-page': { min: 4, max: 12 },
  '3d-web': { min: 10, max: 30 },
  'n8n-workflow': { min: 4, max: 16 },
  'ai-agent': { min: 16, max: 50 },
  'unknown': { min: 8, max: 30 },
};

const TIMELINE_MULTIPLIER: Record<string, number> = {
  weekend: 0.7,
  '1-week': 1.0,
  '1-month': 1.5,
  longer: 2.0,
};

export class DiscoveryEngine {
  private idea: string;
  private sanitizedIdea: string = '';
  private detectedKind: ProjectKind = 'unknown';
  private answers: Record<string, unknown> = {};
  private allQuestions: Question[] = [];
  private askedIds: Set<string> = new Set();
  private done: boolean = false;

  constructor(idea: string) {
    this.idea = idea;
  }

  start(): { sanitizedIdea: string; detectedKind: ProjectKind; firstBatch: Question[] } {
    const { clean } = sanitizer.sanitizeIdea(this.idea);
    this.sanitizedIdea = clean;
    this.detectedKind = detectKind(clean);

    // Pre-fill q_kind answer based on detection
    this.answers['q_kind'] = this.detectedKind;

    // Build all questions: common first, then kind-specific
    this.allQuestions = [
      ...commonQuestions,
      ...(kindQuestions[this.detectedKind] ?? []),
    ];

    // First batch includes q_kind (confirmation) + first 2 common questions
    const firstBatch = this.allQuestions
      .filter((q) => !this.askedIds.has(q.id))
      .slice(0, BATCH_SIZE);

    firstBatch.forEach((q) => this.askedIds.add(q.id));
    return { sanitizedIdea: this.sanitizedIdea, detectedKind: this.detectedKind, firstBatch };
  }

  submit(questionId: string, answer: unknown): {
    nextBatch?: Question[];
    done?: boolean;
    summary?: ScopeSummary;
  } {
    this.answers[questionId] = answer;

    // If the user changed the kind, rebuild questions for the new kind
    if (questionId === 'q_kind' && answer !== this.detectedKind) {
      this.detectedKind = answer as ProjectKind;
      this.allQuestions = [
        ...commonQuestions,
        ...(kindQuestions[this.detectedKind] ?? []),
      ];
    }

    const remaining = this.allQuestions.filter(
      (q) =>
        !this.askedIds.has(q.id) &&
        (!q.showWhen || q.showWhen(this.answers)),
    );

    if (remaining.length === 0) {
      this.done = true;
      return { done: true, summary: this.buildSummary() };
    }

    const nextBatch = remaining.slice(0, BATCH_SIZE);
    nextBatch.forEach((q) => this.askedIds.add(q.id));
    return { nextBatch };
  }

  buildSummary(): ScopeSummary {
    const kind = this.detectedKind;
    const baseStack = [...(STACK_BY_KIND[kind] ?? [])];

    // Enrich stack based on answers
    const features: string[] = [];
    const mvpExclusions: string[] = [];

    if (this.answers['q_webapp_auth'] === true) features.push('auth');
    if (this.answers['q_webapp_auth'] === false) mvpExclusions.push('authentication');

    if (this.answers['q_webapp_database'] === true) {
      features.push('database');
      baseStack.push('Prisma', 'PostgreSQL');
    }

    if (this.answers['q_webapp_payments'] === true) {
      features.push('payments');
      baseStack.push('Stripe');
    } else if (this.answers['q_webapp_payments'] === false) {
      mvpExclusions.push('payments');
    }

    if (this.answers['q_tg_database'] === true) features.push('database');
    if (this.answers['q_discord_database'] === true) features.push('database');

    if (this.answers['q_ext_permissions'] === true) features.push('permissions');
    if (this.answers['q_landing_form'] === true) features.push('form');
    if (this.answers['q_landing_cms'] === true) features.push('cms');
    if (this.answers['q_landing_animations'] === true) {
      features.push('animations');
      baseStack.push('Framer Motion');
    }
    if (this.answers['q_3d_animation'] === true) features.push('animation');
    if (this.answers['q_3d_interaction'] === true) features.push('interaction');
    if (this.answers['q_n8n_ai'] === true) features.push('ai-nodes');
    if (this.answers['q_agent_memory'] === true) {
      features.push('memory');
      baseStack.push('vector-db');
    }
    if (this.answers['q_mobile_offline'] === true) features.push('offline');

    // Enrich stack based on kind-specific answers
    const apiLang = this.answers['q_api_language'];
    if (apiLang === 'python-fastapi') baseStack.push('FastAPI', 'Python');
    if (apiLang === 'go') baseStack.push('Go');

    const mobileFramework = this.answers['q_mobile_framework'];
    if (mobileFramework === 'flutter') baseStack.splice(0, 9999, 'Flutter', 'Dart');
    if (mobileFramework === 'react-native') baseStack.push('Expo');

    const agentFramework = this.answers['q_agent_framework'];
    if (agentFramework === 'llamaindex') baseStack.push('LlamaIndex');
    if (agentFramework === 'autogen') baseStack.push('AutoGen');

    // Timeline-based step estimate
    const timeline = this.answers['q_timeline'] as string | undefined;
    const multiplier = timeline ? (TIMELINE_MULTIPLIER[timeline] ?? 1.0) : 1.0;
    const baseSteps = STEP_ESTIMATE[kind] ?? 6;
    const estimatedSteps = Math.round(baseSteps * multiplier);
    const baseHours = HOURS_ESTIMATE[kind] ?? { min: 8, max: 30 };
    const estimatedHours = {
      min: Math.round(baseHours.min * multiplier),
      max: Math.round(baseHours.max * multiplier),
    };

    // Deduplicate stack
    const stack = [...new Set(baseStack)];

    return {
      idea: this.sanitizedIdea,
      detectedKind: kind,
      answers: { ...this.answers },
      features,
      stack,
      mvpExclusions,
      estimatedSteps,
      estimatedHours,
    };
  }

  getAnswers(): Record<string, unknown> {
    return { ...this.answers };
  }

  isDone(): boolean {
    return this.done;
  }
}
