'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import { ArrowLeft, X, Copy, Check, Play, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GraphCanvas } from '@/components/plangraph/graph/GraphCanvas';
import type { Project, Step, StepStatus, MemoryEntry, ReportSummary } from '@/core/types';

interface RunResult {
  instructions: string;
  promptText: string;
  promptFilePath: string;
  executor: string;
  stepId: string;
  reportPath: string;
  autoRunning?: boolean;
  reportSummary?: ReportSummary;
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.language as 'en' | 'ar';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [updating, setUpdating] = useState(false);
  const [addingMemory, setAddingMemory] = useState(false);

  // Run modal state
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  // Banner shown when a report is detected via SSE
  const [completedStep, setCompletedStep] = useState<string | null>(null);

  // SSE connection ref
  const sseRef = useRef<EventSource | null>(null);

  const fetchProject = useCallback(() => {
    return fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((json: { data?: Project; error?: string }) => {
        if (json.data) {
          setProject(json.data);
          // Keep selected step in sync
          if (selectedStep) {
            const updated = json.data.steps.find((s) => s.id === selectedStep.id);
            setSelectedStep(updated ?? null);
          }
        } else {
          setError(json.error ?? 'Not found');
        }
      })
      .catch((e: unknown) => setError(String(e)));
  }, [id, selectedStep]);

  useEffect(() => {
    fetchProject().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // SSE: watch for report files and auto-advance steps
  useEffect(() => {
    const es = new EventSource(`/api/projects/${id}/watch`);
    sseRef.current = es;

    es.onmessage = (e) => {
      if (!e.data.trim() || e.data.startsWith(':')) return;
      try {
        const msg = JSON.parse(e.data) as {
          stepId?: string;
          event?: string;
          reportSummary?: ReportSummary;
        };
        if (msg.stepId && msg.event === 'report_detected') {
          // Update RunModal if it's open for this step
          if (msg.reportSummary) {
            const summary = msg.reportSummary;
            setRunResult((prev) =>
              prev !== null && prev.stepId === msg.stepId
                ? { ...prev, reportSummary: summary }
                : prev,
            );
          }
          // Use report exit status to determine step status
          const newStatus = msg.reportSummary?.status === 'error' ? 'failed' : 'done';
          void fetch(`/api/projects/${id}/steps/${msg.stepId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
            .then((r) => r.json() as Promise<{ data?: Project }>)
            .then((json) => {
              if (json.data) {
                setProject(json.data);
                setSelectedStep((prev) =>
                  prev ? (json.data!.steps.find((s) => s.id === prev.id) ?? null) : null,
                );
              }
              setCompletedStep(msg.stepId!);
              setTimeout(() => setCompletedStep(null), 4000);
            });
        }
      } catch { /* ignore parse errors */ }
    };

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [id]);

  const handleRunStep = useCallback(
    async (stepId: string) => {
      if (!project || runLoading) return;
      setRunLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId }),
        });
        const json = await res.json() as {
          data?: {
            instructions: string;
            promptText: string;
            promptFilePath: string;
            executor: string;
            autoRunning?: boolean;
          };
        };
        if (json.data) {
          setRunResult({
            ...json.data,
            stepId,
            reportPath: `workspace/projects/${id}/reports/${stepId}_report.md`,
          });
        }
      } finally {
        setRunLoading(false);
      }
    },
    [id, project, runLoading],
  );

  const handleStatusChange = useCallback(
    async (stepId: string, status: StepStatus) => {
      if (!project || updating) return;
      setUpdating(true);
      try {
        const res = await fetch(`/api/projects/${id}/steps/${stepId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const json = await res.json() as { data?: Project; error?: string };
        if (json.data) {
          setProject(json.data);
          const updated = json.data.steps.find((s) => s.id === stepId);
          setSelectedStep(updated ?? null);
        }
      } finally {
        setUpdating(false);
      }
    },
    [id, project, updating],
  );

  const handleAddMemory = useCallback(
    async (stepId: string, category: MemoryEntry['category'], text: string) => {
      if (!project || addingMemory) return;
      setAddingMemory(true);
      try {
        const res = await fetch(`/api/projects/${id}/memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId, category, text }),
        });
        const json = await res.json() as { data?: MemoryEntry };
        if (json.data) {
          setProject({ ...project, memory: [...project.memory, json.data] });
        }
      } finally {
        setAddingMemory(false);
      }
    },
    [id, project, addingMemory],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <span className="text-sm text-muted-foreground">{t('project.loading')}</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-3.5rem)] gap-4">
        <p className="text-sm text-destructive">{error ?? t('project.notFound')}</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          {t('project.backHome')}
        </button>
      </div>
    );
  }

  const doneCount = project.steps.filter((s) => s.status === 'done').length;
  const pct = project.steps.length > 0
    ? Math.round((doneCount / project.steps.length) * 100)
    : 0;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* Project header bar */}
      <div className="h-12 border-b px-4 flex items-center gap-3 shrink-0 bg-background">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors"
          aria-label={t('project.backHome')}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm truncate">{project.meta.name}</span>
        <Badge variant="secondary" className="text-[11px] shrink-0">
          {t('project.stepCount', { count: project.steps.length })}
        </Badge>
        <Badge variant="outline" className="text-[11px] shrink-0 capitalize">
          {project.meta.templateId.replace(/-/g, ' ')}
        </Badge>
        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2 min-w-0 ms-auto">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-32">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {t('project.progress', { done: doneCount, total: project.steps.length })}
          </span>
        </div>
      </div>

      {/* Graph + detail panel */}
      <div className="flex-1 relative overflow-hidden">
        <GraphCanvas
          project={project}
          selectedStep={selectedStep}
          locale={locale}
          onSelectStep={setSelectedStep}
        />

        {selectedStep && (
          <StepDetailPanel
            step={selectedStep}
            locale={locale}
            executor={project.meta.selectedExecutor}
            onClose={() => setSelectedStep(null)}
            onStatusChange={(status) => handleStatusChange(selectedStep.id, status)}
            updating={updating}
            memories={project.memory.filter((m) => m.stepId === selectedStep.id)}
            onAddMemory={(cat, text) => handleAddMemory(selectedStep.id, cat, text)}
            addingMemory={addingMemory}
            onRun={(stepId) => {
              void handleStatusChange(stepId, 'in_progress').then(() =>
                handleRunStep(stepId),
              );
            }}
            runLoading={runLoading}
            t={t}
          />
        )}

        {/* Step-complete/failed banner */}
        {completedStep && (() => {
          const step = project.steps.find((s) => s.id === completedStep);
          const failed = step?.status === 'failed';
          return (
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-lg flex items-center gap-2 ${failed ? 'bg-destructive' : 'bg-emerald-600'}`}>
              <Check className="w-4 h-4 shrink-0" />
              {failed ? t('run.stepFailed') : t('run.stepComplete')}
            </div>
          );
        })()}
      </div>

      {/* Run modal */}
      {runResult && (
        <RunModal
          result={runResult}
          locale={locale}
          onClose={() => setRunResult(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Step detail panel ────────────────────────────────────────────────────────

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
  note:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function StepDetailPanel({
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
}: {
  step: Step;
  locale: 'en' | 'ar';
  executor: string;
  onClose: () => void;
  onStatusChange: (status: StepStatus) => void;
  updating: boolean;
  memories: MemoryEntry[];
  onAddMemory: (category: MemoryEntry['category'], text: string) => Promise<void>;
  addingMemory: boolean;
  onRun: (stepId: string) => void;
  runLoading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isRtl = locale === 'ar';
  const required = step.recommendedLibraries.filter((l) => l.required);
  const [copied, setCopied] = useState(false);
  const [memFormOpen, setMemFormOpen] = useState(false);
  const [memCategory, setMemCategory] = useState<MemoryEntry['category']>('note');
  const [memText, setMemText] = useState('');

  const prompt =
    step.prompts[executor as keyof typeof step.prompts] ?? step.prompts.manual;

  function copyPrompt() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} h-full w-80 bg-background border-${isRtl ? 'r' : 'l'} border-border flex flex-col shadow-lg z-10`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0">
        <span className="text-sm font-semibold line-clamp-2">{step.title}</span>
        <button
          onClick={onClose}
          className="shrink-0 inline-flex items-center justify-center size-6 rounded hover:bg-muted transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 text-sm">

        {/* Status + actions */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {t('project.stepPanel.statusLabel')}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[step.status]}`}>
              {t(`project.stepPanel.status.${step.status}`)}
            </span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {/* Run button — sets in_progress AND opens instructions modal */}
            {(step.status === 'not_started' || step.status === 'ready' || step.status === 'blocked') && (
              <button
                onClick={() => onRun(step.id)}
                disabled={updating || runLoading}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {runLoading
                  ? <><Loader2 className="w-3 h-3 animate-spin" />{t('project.stepPanel.actions.start')}</>
                  : <><Play className="w-3 h-3" />{t('project.stepPanel.actions.start')}</>}
              </button>
            )}
            <StatusButton
              label={t('project.stepPanel.actions.done')}
              show={step.status === 'in_progress' || step.status === 'needs_review'}
              disabled={updating}
              onClick={() => onStatusChange('done')}
              variant="success"
            />
            <StatusButton
              label={t('project.stepPanel.actions.review')}
              show={step.status === 'in_progress'}
              disabled={updating}
              onClick={() => onStatusChange('needs_review')}
              variant="warning"
            />
            <StatusButton
              label={t('project.stepPanel.actions.fail')}
              show={step.status === 'in_progress'}
              disabled={updating}
              onClick={() => onStatusChange('failed')}
              variant="danger"
            />
            <StatusButton
              label={t('project.stepPanel.actions.reopen')}
              show={step.status === 'done' || step.status === 'failed'}
              disabled={updating}
              onClick={() => onStatusChange('not_started')}
              variant="ghost"
            />
          </div>
        </section>

        {/* Goal */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {t('project.stepPanel.goal')}
          </h3>
          <p className="text-sm leading-relaxed">{step.goal}</p>
        </section>

        {/* Executor prompt */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('project.stepPanel.prompt')}
            </h3>
            <button
              onClick={copyPrompt}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <><Check className="w-3 h-3 text-emerald-500" />{t('project.stepPanel.copied')}</>
              ) : (
                <><Copy className="w-3 h-3" />{t('project.stepPanel.copy')}</>
              )}
            </button>
          </div>
          <pre className="text-[11px] leading-relaxed whitespace-pre-wrap bg-muted rounded-md px-3 py-2 text-muted-foreground overflow-x-auto max-h-40">
            {prompt}
          </pre>
        </section>

        {/* Required libraries */}
        {required.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {t('project.stepPanel.libraries')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {required.map((lib) => (
                <Badge key={lib.name} variant="secondary" className="text-[11px]">
                  {lib.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Success criteria */}
        {step.successCriteria.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {t('project.stepPanel.criteria')}
            </h3>
            <ul className="space-y-1">
              {step.successCriteria.map((c, i) => (
                <li key={i} className="flex gap-1.5 text-xs leading-snug">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Restrictions */}
        {step.restrictions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {t('project.stepPanel.restrictions')}
            </h3>
            <ul className="space-y-1">
              {step.restrictions.map((r, i) => (
                <li key={i} className="flex gap-1.5 text-xs leading-snug text-destructive/80">
                  <span className="mt-0.5">⚠</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Memory */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('project.stepPanel.memory.title')}
              {memories.length > 0 && (
                <span className="ms-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {memories.length}
                </span>
              )}
            </h3>
            {!memFormOpen && (
              <button
                onClick={() => setMemFormOpen(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                + {t('project.stepPanel.memory.addNote')}
              </button>
            )}
          </div>

          {memories.length === 0 && !memFormOpen && (
            <p className="text-[11px] text-muted-foreground">
              {t('project.stepPanel.memory.empty')}
            </p>
          )}

          {memories.length > 0 && (
            <ul className="flex flex-col gap-2 mb-2">
              {memories.map((m, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <span
                    className={`self-start text-[10px] font-medium px-1.5 py-0.5 rounded-full ${MEMORY_CATEGORY_CLASS[m.category]}`}
                  >
                    {t(`project.stepPanel.memory.categories.${m.category}`)}
                  </span>
                  <p className="text-xs leading-snug">{m.text}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {memFormOpen && (
            <div className="flex flex-col gap-2 mt-1">
              <select
                value={memCategory}
                onChange={(e) => setMemCategory(e.target.value as MemoryEntry['category'])}
                className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(['decision', 'convention', 'issue', 'note'] as MemoryEntry['category'][]).map((c) => (
                  <option key={c} value={c}>
                    {t(`project.stepPanel.memory.categories.${c}`)}
                  </option>
                ))}
              </select>
              <textarea
                value={memText}
                onChange={(e) => setMemText(e.target.value)}
                placeholder={t('project.stepPanel.memory.placeholder')}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                  className="text-[11px] font-medium px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {t('project.stepPanel.memory.save')}
                </button>
                <button
                  onClick={() => { setMemFormOpen(false); setMemText(''); }}
                  className="text-[11px] font-medium px-3 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('project.stepPanel.memory.cancel')}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Run modal ───────────────────────────────────────────────────────────────

function RunModal({
  result,
  locale,
  onClose,
  t,
}: {
  result: RunResult;
  locale: 'en' | 'ar';
  onClose: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [copied, setCopied] = useState(false);
  const isRtl = locale === 'ar';
  const { autoRunning, reportSummary } = result;

  function copyPrompt() {
    navigator.clipboard.writeText(result.promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="font-semibold text-sm">{t('run.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{result.executor}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 text-sm">

          {/* Auto-run status card OR manual instructions */}
          {autoRunning ? (
            <section>
              {reportSummary ? (
                <div className={`px-4 py-3 rounded-lg border ${
                  reportSummary.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {reportSummary.status === 'success'
                      ? <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      : <X className="w-4 h-4 text-red-600 shrink-0" />
                    }
                    <span className="text-sm font-medium">
                      {reportSummary.status === 'success' ? t('run.reportSuccess') : t('run.reportError')}
                    </span>
                    <span className="ms-auto text-[11px] text-muted-foreground shrink-0">
                      {t('run.duration', { ms: reportSummary.durationMs })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {reportSummary.summary}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('run.autoRunning')}</span>
                </div>
              )}
            </section>
          ) : (
            /* Manual instructions */
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                {t('run.instructions')}
              </h3>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-muted rounded-lg px-3 py-2.5 text-muted-foreground">
                {result.instructions}
              </pre>
            </section>
          )}

          {/* Prompt (always shown, shorter when auto-running) */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('run.promptFile')}: <span className="font-mono normal-case">{result.promptFilePath}</span>
              </h3>
              <button
                onClick={copyPrompt}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {copied
                  ? <><Check className="w-3 h-3 text-emerald-500" />{t('run.copiedPrompt')}</>
                  : <><Copy className="w-3 h-3" />{t('run.copyPrompt')}</>}
              </button>
            </div>
            <pre className={`text-[11px] leading-relaxed whitespace-pre-wrap bg-muted rounded-lg px-3 py-2.5 text-muted-foreground overflow-auto ${autoRunning ? 'max-h-28' : 'max-h-52'}`}>
              {result.promptText}
            </pre>
          </section>

          {/* Report path */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {t('run.reportPath')}
            </h3>
            <code className="text-xs bg-muted px-2.5 py-1 rounded font-mono block">
              {result.reportPath}
            </code>
          </section>

          {/* Watching indicator — hide once report is received */}
          {!reportSummary && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              {t('run.watching')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t shrink-0">
          <button
            onClick={onClose}
            className="w-full h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {t('run.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'ghost';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
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
      className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]}`}
    >
      {label}
    </button>
  );
}
