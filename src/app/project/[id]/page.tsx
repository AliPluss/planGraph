'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, X, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StepNode, { type StepNodeData } from '@/components/plangraph/StepNode';
import type { Project, Step, StepStatus, MemoryEntry } from '@/core/types';

const nodeTypes: NodeTypes = { stepNode: StepNode };

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

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, rfNode: RFNode<StepNodeData>) => {
      setSelectedStep(rfNode.data.step);
    },
    [],
  );

  const handlePaneClick = useCallback(() => setSelectedStep(null), []);

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

  const rfNodes: RFNode<StepNodeData>[] = project.steps.map((step) => ({
    id: step.id,
    type: 'stepNode',
    position: step.position ?? { x: 0, y: 0 },
    data: { step, locale },
    selected: selectedStep?.id === step.id,
  }));

  const rfEdges: RFEdge[] = project.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    style: { stroke: 'var(--border)', strokeWidth: 1.5 },
  }));

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
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const step = (n.data as StepNodeData | undefined)?.step;
              if (!step) return '#e5e7eb';
              const map: Record<string, string> = {
                planning: '#a855f7', setup: '#3b82f6', implementation: '#10b981',
                integration: '#06b6d4', verification: '#f59e0b', delivery: '#6366f1',
              };
              return map[step.type] ?? '#e5e7eb';
            }}
            maskColor="rgba(0,0,0,0.06)"
            style={{ borderRadius: 8, border: '1px solid var(--border)' }}
          />
        </ReactFlow>

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
            t={t}
          />
        )}
      </div>
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
            <StatusButton
              label={t('project.stepPanel.actions.start')}
              show={step.status === 'not_started' || step.status === 'ready' || step.status === 'blocked'}
              disabled={updating}
              onClick={() => onStatusChange('in_progress')}
              variant="primary"
            />
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
