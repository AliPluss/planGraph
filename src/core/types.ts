export type ProjectKind =
  | 'web-app' | 'mobile-app' | 'browser-extension'
  | 'rest-api' | 'cli-tool' | 'discord-bot'
  | 'telegram-bot' | 'landing-page' | '3d-web'
  | 'n8n-workflow' | 'ai-agent' | 'unknown';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExecutorTool = 'claude-code' | 'cursor' | 'antigravity' | 'copilot' | 'manual';
export type Locale = 'ar' | 'en';
export type CommunicationStyle = 'detailed' | 'concise';

export interface UserProfile {
  displayName?: string;
  level: SkillLevel;
  languages: string[];
  tools: ExecutorTool[];
  preferredLocale: Locale;
  communicationStyle: CommunicationStyle;
  createdAt: string;
  updatedAt: string;
}

export type StepStatus =
  | 'not_started' | 'ready' | 'in_progress'
  | 'done' | 'failed' | 'needs_review' | 'blocked';

export type StepType =
  | 'planning' | 'setup' | 'implementation'
  | 'integration' | 'verification' | 'delivery';

export interface RecommendedLibrary {
  name: string;
  purpose: string;
  required: boolean;
  alternative?: string;
  rationale?: string;
}

export interface ToolPrompts {
  claudeCode?: string;
  cursor?: string;
  antigravity?: string;
  copilot?: string;
  manual: string;
}

export interface Step {
  id: string;
  title: string;
  type: StepType;
  status: StepStatus;
  goal: string;
  contextFiles: string[];
  recommendedLibraries: RecommendedLibrary[];
  successCriteria: string[];
  restrictions: string[];
  protectedFiles: string[];
  prompts: ToolPrompts;
  dependsOn: string[];
  affects: string[];
  mdFile: string;
  reportFile?: string;
  startedAt?: string;
  completedAt?: string;
  position?: { x: number; y: number };
  executionLog?: {
    tokens?: { input: number; output: number };
    costUsd?: number;
    durationMs: number;
  };
  snapshotBefore?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface MemoryEntry {
  stepId: string;
  category: 'decision' | 'convention' | 'issue' | 'file-map' | 'note';
  text: string;
  createdAt: string;
  status?: 'open' | 'resolved';
  path?: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  idea: string;
  rootPath: string;
  templateId: string;
  stack?: string[];
  mvpExclusions?: string[];
  estimatedHours?: { min: number; max: number };
  locale: Locale;
  createdAt: string;
  updatedAt: string;
  selectedExecutor: ExecutorTool;
  autoSnapshot?: boolean;
}

export interface Project {
  meta: ProjectMeta;
  steps: Step[];
  edges: Edge[];
  executionOrder: string[];
  memory: MemoryEntry[];
}

export type AuditAction =
  | 'PROFILE_CREATED' | 'PROFILE_UPDATED'
  | 'PROJECT_CREATED' | 'PROJECT_OPENED' | 'PROJECT_IMPORTED'
  | 'STEP_STARTED' | 'STEP_COMPLETED' | 'STEP_FAILED'
  | 'MEMORY_ADDED' | 'SNAPSHOT_CREATED' | 'ROLLBACK_PERFORMED'
  | 'EXECUTOR_INVOKED' | 'REPORT_DETECTED';

export interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  projectId?: string;
  stepId?: string;
  details?: Record<string, unknown>;
}

export interface ReportSummary {
  status: 'success' | 'error';
  summary: string;
  durationMs: number;
  exitCode: number;
}
