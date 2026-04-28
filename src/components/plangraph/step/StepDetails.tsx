'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Copy, Check, Play, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} z-10 flex h-full w-96 flex-col border-${isRtl ? 'r' : 'l'} border-border bg-background shadow-lg`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-semibold">{step.title}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[step.status]}`}>
              {t(`project.stepPanel.status.${step.status}`)}
            </span>
            <Badge variant="outline" className="text-[11px] capitalize">{step.type}</Badge>
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
        <div className="shrink-0 border-b px-3 py-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <OverviewTab step={step} t={t} />
        </TabsContent>

        <TabsContent value="markdown" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <MarkdownTab projectId={projectId} step={step} />
        </TabsContent>

        <TabsContent value="prompts" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <PromptsTab step={step} executor={executor} t={t} />
        </TabsContent>

        <TabsContent value="status" className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-3">
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
      </Tabs>
    </div>
  );
}

function OverviewTab({ step, t }: { step: Step; t: StepDetailsProps['t'] }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('project.stepPanel.goal')}
        </h3>
        <p className="leading-relaxed">{step.goal}</p>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dependencies
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(step.dependsOn.length > 0 ? step.dependsOn : ['None']).map((dep) => (
            <Badge key={dep} variant="secondary" className="text-[11px]">{dep}</Badge>
          ))}
        </div>
      </section>

      {step.recommendedLibraries.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('project.stepPanel.libraries')}
          </h3>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <tbody>
                {step.recommendedLibraries.map((lib) => (
                  <tr key={lib.name} className="border-b last:border-0">
                    <td className="px-2 py-1.5 font-medium">{lib.name}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{lib.purpose}</td>
                    <td className="px-2 py-1.5 text-right">{lib.required ? 'Required' : 'Optional'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('project.stepPanel.criteria')}
        </h3>
        <ul className="space-y-1">
          {step.successCriteria.map((criterion) => (
            <li key={criterion} className="flex gap-2 text-xs leading-snug">
              <input type="checkbox" className="mt-0.5 h-3.5 w-3.5" />
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      </section>

      {step.restrictions.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('project.stepPanel.restrictions')}
          </h3>
          <ul className="space-y-1">
            {step.restrictions.map((restriction) => (
              <li key={restriction} className="text-xs leading-snug text-destructive/80">
                {restriction}
              </li>
            ))}
          </ul>
        </section>
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

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (content === null) return <p className="text-sm text-muted-foreground">Loading markdown...</p>;

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:overflow-x-auto">
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
  const defaultTab = executor === 'claude-code' ? 'claudeCode' : executor;

  return (
    <Tabs defaultValue={step.prompts[defaultTab as keyof Step['prompts']] ? defaultTab : 'manual'}>
      <TabsList className="mb-3 grid grid-cols-2">
        {PROMPT_TABS.filter(({ key }) => step.prompts[key]).map(({ key, label }) => (
          <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
        ))}
      </TabsList>
      {PROMPT_TABS.filter(({ key }) => step.prompts[key]).map(({ key, label }) => (
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
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
        <button
          onClick={copyPrompt}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? t('project.stepPanel.copied') : t('project.stepPanel.copy')}
        </button>
      </div>
      <pre className="max-h-[56vh] overflow-auto whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
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
    <div className="flex flex-col gap-4 text-sm">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('project.stepPanel.statusLabel')}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[step.status]}`}>
          {t(`project.stepPanel.status.${step.status}`)}
        </span>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(step.status === 'not_started' || step.status === 'ready' || step.status === 'blocked') && (
            <button
              onClick={() => onRun(step.id)}
              disabled={updating || runLoading}
              className="inline-flex items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
        <p className="mt-3 text-[11px] text-muted-foreground">
          Last updated: {step.completedAt ?? step.startedAt ?? 'Not started'}
        </p>
        {step.executionLog && (
          <div className="mt-3 rounded-md border border-border px-3 py-2 text-[11px] text-muted-foreground">
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
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('project.stepPanel.memory.title')}
          </h3>
          {!memFormOpen && (
            <button onClick={() => setMemFormOpen(true)} className="text-[11px] text-muted-foreground hover:text-foreground">
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
              <li key={`${memory.createdAt}-${index}`} className="flex flex-col gap-1">
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
                className="rounded bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t('project.stepPanel.memory.save')}
              </button>
              <button
                onClick={() => { setMemFormOpen(false); setMemText(''); }}
                className="rounded border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
              >
                {t('project.stepPanel.memory.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
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
      className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]}`}
    >
      {label}
    </button>
  );
}
