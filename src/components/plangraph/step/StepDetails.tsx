'use client';

import { useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Copy,
  Check,
  Play,
  Loader2,
  BookOpen,
  Boxes,
  ClipboardList,
  FileText,
  Library,
  ListChecks,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ExecutorTool, MemoryEntry, Step, StepStatus } from '@/core/types';

const STATUS_BADGE: Record<StepStatus, string> = {
  not_started:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ready:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  done:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  failed:       'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  needs_review: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  blocked:      'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400',
};

const MEMORY_CATEGORY_CLASS: Record<MemoryEntry['category'], string> = {
  decision:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  convention: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  issue:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'file-map':  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  note:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PROMPT_TABS: Array<{ key: keyof Step['prompts']; label: string }> = [
  { key: 'claudeCode', label: 'Claude Code' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'antigravity', label: 'Antigravity' },
  { key: 'copilot', label: 'Copilot' },
  { key: 'manual', label: 'Manual' },
];

interface StepDetailsProps {
  projectId: string;
  step: Step;
  locale: 'en' | 'ar';
  executor: ExecutorTool;
  onClose: () => void;
  onStatusChange: (status: StepStatus) => void;
  updating: boolean;
  memories: MemoryEntry[];
  onAddMemory: (category: MemoryEntry['category'], text: string) => Promise<void>;
  addingMemory: boolean;
  onRun: (stepId: string) => void;
  runLoading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function StepDetails({
  projectId,
  step,
  locale,
  executor,
  onClose,
  onStatusChange,
  updating,
  memories,
  onAddMemory,
  addingMemory,
  onRun,
  runLoading,
  t,
}: StepDetailsProps) {
  const isRtl = locale === 'ar';

  return (
    <div
      className={cn(
        'absolute top-0 z-10 flex h-full w-[28rem] max-w-[calc(100vw-1.5rem)] flex-col border-border bg-background/95 shadow-[var(--pg-shadow-panel)] backdrop-blur-xl',
        isRtl ? 'left-0 border-r' : 'right-0 border-l',
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div className="min-w-0">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Execution node
          </div>
          <div className="line-clamp-2 text-base font-semibold leading-snug">{step.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[step.status]}`}>
              {t(`project.stepPanel.status.${step.status}`)}
            </span>
            <Badge variant="outline" className="text-[11px] capitalize">{step.type}</Badge>
            <Badge variant="secondary" className="text-[11px]">{executorLabel(executor)}</Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded hover:bg-muted"
          aria-label="Close step details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border/70 px-3 py-2">
          <TabsList className="grid w-full grid-cols-4 bg-muted/60">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <OverviewTab step={step} executor={executor} t={t} />
        </TabsContent>

        <TabsContent value="prompt" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <PromptsTab step={step} executor={executor} t={t} />
        </TabsContent>

        <TabsContent value="status" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <StatusTab
            step={step}
            updating={updating}
            runLoading={runLoading}
            onRun={onRun}
            onStatusChange={onStatusChange}
            memories={memories}
            onAddMemory={onAddMemory}
            addingMemory={addingMemory}
            t={t}
          />
        </TabsContent>

        <TabsContent value="markdown" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <MarkdownTab projectId={projectId} step={step} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({
  step,
  executor,
  t,
}: {
  step: Step;
  executor: ExecutorTool;
  t: StepDetailsProps['t'];
}) {
  const required = step.recommendedLibraries.filter((lib) => lib.required);
  const optional = step.recommendedLibraries.filter((lib) => !lib.required);
  const availablePrompts = PROMPT_TABS.filter(({ key }) => step.prompts[key]);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <DetailSection
        icon={<BookOpen className="size-4" />}
        title="Description"
        description="What this node must accomplish before execution can move on."
      >
        <p className="leading-6 text-foreground/90">{step.goal}</p>
      </DetailSection>

      <DetailSection
        icon={<Sparkles className="size-4" />}
        title="Skills"
        description="Execution capability, dependencies, and affected nodes."
      >
        <div className="grid grid-cols-2 gap-2">
          <MetricPill label="Step type" value={step.type} />
          <MetricPill label="Executor" value={executorLabel(executor)} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <ChipRow label="Depends on" items={step.dependsOn} empty="None" />
          <ChipRow label="Affects" items={step.affects} empty="No downstream nodes" />
        </div>
      </DetailSection>

      <DetailSection
        icon={<Library className="size-4" />}
        title={t('project.stepPanel.libraries')}
        description="Packages or APIs this step expects the executor to consider."
      >
        {step.recommendedLibraries.length > 0 ? (
          <div className="flex flex-col gap-2">
            {required.length > 0 && <LibraryGroup title="Required" libraries={required} />}
            {optional.length > 0 && <LibraryGroup title="Optional" libraries={optional} />}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No libraries specified.</p>
        )}
      </DetailSection>

      <DetailSection
        icon={<Boxes className="size-4" />}
        title="Tools and files"
        description="Prompt targets, context files, and guarded files for this node."
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {availablePrompts.map(({ key, label }) => (
            <Badge
              key={key}
              variant={executorPromptKey(executor) === key ? 'default' : 'outline'}
              className="text-[11px]"
            >
              {label}
            </Badge>
          ))}
        </div>
        <ChipRow label="Context" items={step.contextFiles} empty="No context files" />
        <ChipRow label="Protected" items={step.protectedFiles} empty="No protected files" tone="danger" />
        <div className="mt-3 grid gap-2 text-xs">
          <FileReference icon={<FileText className="size-3.5" />} label="Step markdown" value={step.mdFile} />
          {step.reportFile && (
            <FileReference icon={<ClipboardList className="size-3.5" />} label="Report" value={step.reportFile} />
          )}
        </div>
      </DetailSection>

      <DetailSection
        icon={<ListChecks className="size-4" />}
        title={t('project.stepPanel.criteria')}
        description="Checklist used to decide whether the executor output is complete."
      >
        {step.successCriteria.length > 0 ? (
          <ul className="space-y-2">
            {step.successCriteria.map((criterion) => (
              <li key={criterion} className="flex gap-2 text-xs leading-5 text-foreground/90">
                <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--pg-accent-green)]" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No success criteria defined.</p>
        )}
      </DetailSection>

      {step.restrictions.length > 0 && (
        <DetailSection
          icon={<ShieldCheck className="size-4" />}
          title={t('project.stepPanel.restrictions')}
          description="Notes and guardrails that must stay true while executing."
        >
          <ul className="space-y-1">
            {step.restrictions.map((restriction) => (
              <li key={restriction} className="text-xs leading-snug text-destructive/80">
                {restriction}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
}

function MarkdownTab({ projectId, step }: { projectId: string; step: Step }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(null);
    setError(null);
    fetch(`/api/projects/${projectId}/steps/${step.id}/md`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Markdown file not found');
        return res.text();
      })
      .then(setContent)
      .catch((err: unknown) => setError(String(err)));
  }, [projectId, step.id]);

  if (error) return <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>;
  if (content === null) return <p className="text-sm text-muted-foreground">Loading markdown...</p>;

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:bg-muted/70">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function PromptsTab({
  step,
  executor,
  t,
}: {
  step: Step;
  executor: ExecutorTool;
  t: StepDetailsProps['t'];
}) {
  const defaultTab = executorPromptKey(executor);
  const tabs = PROMPT_TABS.filter(({ key }) => step.prompts[key]);

  return (
    <Tabs defaultValue={step.prompts[defaultTab] ? defaultTab : 'manual'} className="flex flex-col gap-3">
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium">
          <Network className="size-3.5 text-[var(--pg-accent-cyan)]" />
          Prompt targets
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Copy the active executor prompt or switch tabs to use another generated prompt.
        </p>
      </div>
      <TabsList className="grid grid-cols-2 bg-muted/60">
        {tabs.map(({ key, label }) => (
          <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(({ key, label }) => (
        <TabsContent key={key} value={key} className="m-0">
          <PromptBlock label={label} prompt={step.prompts[key] ?? ''} t={t} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function PromptBlock({
  label,
  prompt,
  t,
}: {
  label: string;
  prompt: string;
  t: StepDetailsProps['t'];
}) {
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="rounded-lg border border-border/70 bg-[var(--pg-surface-glass)]">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label} prompt</h3>
        <button
          onClick={copyPrompt}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/70 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? t('project.stepPanel.copied') : t('project.stepPanel.copy')}
        </button>
      </div>
      <pre className="max-h-[61vh] overflow-auto whitespace-pre-wrap px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
        {prompt}
      </pre>
    </section>
  );
}

function StatusTab({
  step,
  updating,
  runLoading,
  onRun,
  onStatusChange,
  memories,
  onAddMemory,
  addingMemory,
  t,
}: {
  step: Step;
  updating: boolean;
  runLoading: boolean;
  onRun: (stepId: string) => void;
  onStatusChange: (status: StepStatus) => void;
  memories: MemoryEntry[];
  onAddMemory: (category: MemoryEntry['category'], text: string) => Promise<void>;
  addingMemory: boolean;
  t: StepDetailsProps['t'];
}) {
  const [memFormOpen, setMemFormOpen] = useState(false);
  const [memCategory, setMemCategory] = useState<MemoryEntry['category']>('decision');
  const [memText, setMemText] = useState('');

  return (
    <div className="flex flex-col gap-3 text-sm">
      <DetailSection
        icon={<ClipboardList className="size-4" />}
        title={t('project.stepPanel.statusLabel')}
        description="Run the step, record review state, or reopen completed work."
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[step.status]}`}>
            {t(`project.stepPanel.status.${step.status}`)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Last updated: {step.completedAt ?? step.startedAt ?? 'Not started'}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(step.status === 'not_started' || step.status === 'ready' || step.status === 'blocked') && (
            <button
              onClick={() => onRun(step.id)}
              disabled={updating || runLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {runLoading
                ? <><Loader2 className="h-3 w-3 animate-spin" />{t('project.stepPanel.actions.start')}</>
                : <><Play className="h-3 w-3" />{t('project.stepPanel.actions.start')}</>}
            </button>
          )}
          <StatusButton label={t('project.stepPanel.actions.done')} show={step.status === 'in_progress' || step.status === 'needs_review'} disabled={updating} onClick={() => onStatusChange('done')} variant="success" />
          <StatusButton label={t('project.stepPanel.actions.review')} show={step.status === 'in_progress'} disabled={updating} onClick={() => onStatusChange('needs_review')} variant="warning" />
          <StatusButton label={t('project.stepPanel.actions.fail')} show={step.status === 'in_progress'} disabled={updating} onClick={() => onStatusChange('failed')} variant="danger" />
          <StatusButton label={t('project.stepPanel.actions.reopen')} show={step.status === 'done' || step.status === 'failed'} disabled={updating} onClick={() => onStatusChange('not_started')} variant="ghost" />
        </div>
        {step.executionLog && (
          <div className="mt-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <div>Duration: {step.executionLog.durationMs}ms</div>
            {step.executionLog.tokens && (
              <div>
                Tokens: {step.executionLog.tokens.input} in / {step.executionLog.tokens.output} out
              </div>
            )}
            {step.executionLog.costUsd !== undefined && (
              <div>Cost: ${step.executionLog.costUsd.toFixed(4)}</div>
            )}
          </div>
        )}
      </DetailSection>

      <DetailSection
        icon={<FileText className="size-4" />}
        title={t('project.stepPanel.memory.title')}
        description="Notes, decisions, issues, and conventions linked to this node."
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{memories.length} saved</span>
          {!memFormOpen && (
            <button
              onClick={() => setMemFormOpen(true)}
              className="rounded-md border border-border bg-background/70 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              + {t('project.stepPanel.memory.addNote')}
            </button>
          )}
        </div>

        {memories.length === 0 && !memFormOpen && (
          <p className="text-[11px] text-muted-foreground">{t('project.stepPanel.memory.empty')}</p>
        )}

        {memories.length > 0 && (
          <ul className="mb-2 flex flex-col gap-2">
            {memories.map((memory, index) => (
              <li key={`${memory.createdAt}-${index}`} className="flex flex-col gap-1 rounded-md border border-border/70 bg-muted/20 px-3 py-2">
                <span className={`self-start rounded-full px-1.5 py-0.5 text-[10px] font-medium ${MEMORY_CATEGORY_CLASS[memory.category]}`}>
                  {t(`project.stepPanel.memory.categories.${memory.category}`)}
                </span>
                <p className="text-xs leading-snug">{memory.text}</p>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        {memFormOpen && (
          <div className="mt-1 flex flex-col gap-2">
            <select
              value={memCategory}
              onChange={(event) => setMemCategory(event.target.value as MemoryEntry['category'])}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {(['decision', 'convention', 'issue', 'note'] as MemoryEntry['category'][]).map((category) => (
                <option key={category} value={category}>
                  {t(`project.stepPanel.memory.categories.${category}`)}
                </option>
              ))}
            </select>
            <textarea
              value={memText}
              onChange={(event) => setMemText(event.target.value)}
              placeholder={t('project.stepPanel.memory.placeholder')}
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-1.5">
              <button
                onClick={async () => {
                  if (!memText.trim()) return;
                  await onAddMemory(memCategory, memText);
                  setMemText('');
                  setMemFormOpen(false);
                }}
                disabled={!memText.trim() || addingMemory}
                className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t('project.stepPanel.memory.save')}
              </button>
              <button
                onClick={() => { setMemFormOpen(false); setMemText(''); }}
                className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
              >
                {t('project.stepPanel.memory.cancel')}
              </button>
            </div>
          </div>
        )}
      </DetailSection>
    </div>
  );
}

function DetailSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-[var(--pg-surface-glass)] p-3 shadow-sm">
      <div className="mb-3 flex gap-2.5">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/25 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-xs font-medium capitalize">{value}</div>
    </div>
  );
}

function ChipRow({
  label,
  items,
  empty,
  tone = 'default',
}: {
  label: string;
  items: string[];
  empty: string;
  tone?: 'default' | 'danger';
}) {
  const values = items.length > 0 ? items : [empty];
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((item) => (
          <Badge
            key={item}
            variant={items.length > 0 ? 'secondary' : 'outline'}
            className={cn('max-w-full truncate text-[11px]', tone === 'danger' && items.length > 0 && 'border-destructive/30 bg-destructive/10 text-destructive')}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function LibraryGroup({
  title,
  libraries,
}: {
  title: string;
  libraries: Step['recommendedLibraries'];
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20">
      <div className="border-b border-border/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="divide-y divide-border/70">
        {libraries.map((lib) => (
          <div key={lib.name} className="px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{lib.name}</span>
              {lib.alternative && (
                <span className="truncate text-[10px] text-muted-foreground">Alt: {lib.alternative}</span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{lib.purpose}</p>
            {lib.rationale && <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{lib.rationale}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FileReference({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-2.5 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <code className="min-w-0 truncate text-[11px] text-foreground">{value}</code>
    </div>
  );
}

function executorPromptKey(executor: ExecutorTool): keyof Step['prompts'] {
  return executor === 'claude-code' ? 'claudeCode' : executor;
}

function executorLabel(executor: ExecutorTool): string {
  if (executor === 'claude-code') return 'Claude Code';
  if (executor === 'manual') return 'Manual';
  return executor.charAt(0).toUpperCase() + executor.slice(1);
}

type ButtonVariant = 'success' | 'warning' | 'danger' | 'ghost';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  danger:  'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  ghost:   'border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
};

function StatusButton({
  label,
  show,
  disabled,
  onClick,
  variant,
}: {
  label: string;
  show: boolean;
  disabled: boolean;
  onClick: () => void;
  variant: ButtonVariant;
}) {
  if (!show) return null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]}`}
    >
      {label}
    </button>
  );
}
