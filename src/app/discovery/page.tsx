'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  GitBranch,
  Layers3,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  UploadCloud,
  Wrench,
} from 'lucide-react';
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from '@/components/plangraph/Panel';
import { cn } from '@/lib/utils';
import type { Question, ScopeSummary, ProjectKind } from '@/core/discovery/types';

// Page entry point with required Suspense boundary for useSearchParams
export default function DiscoveryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DiscoveryContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-6">
      <div className="h-[720px] flex-1 rounded-xl bg-muted/50 animate-pulse" />
      <div className="hidden h-[720px] w-80 rounded-xl bg-muted/50 animate-pulse xl:block" />
    </div>
  );
}

type Phase = 'idea' | 'questioning' | 'summary';

interface BatchRecord {
  questions: Question[];
  answers: Record<string, unknown>;
}

function DiscoveryContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = i18n.language === 'ar';

  const [phase, setPhase] = useState<Phase>('idea');
  const [ideaText, setIdeaText] = useState(searchParams.get('idea') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [detectedKind, setDetectedKind] = useState<ProjectKind | null>(null);
  const [round, setRound] = useState(0);
  const [totalRoundsEst, setTotalRoundsEst] = useState(4);

  // History for back navigation
  const [history, setHistory] = useState<BatchRecord[]>([]);
  const [currentBatch, setCurrentBatch] = useState<Question[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, unknown>>({});

  const [summary, setSummary] = useState<ScopeSummary | null>(null);

  // Generate project dialog
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const startDiscovery = useCallback(async () => {
    if (!ideaText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', idea: ideaText }),
      });
      const data = await res.json() as {
        sessionId: string;
        sanitizedIdea: string;
        detectedKind: ProjectKind;
        questions: Question[];
      };
      setSessionId(data.sessionId);
      setDetectedKind(data.detectedKind);
      const prefilled: Record<string, unknown> = {};
      if (data.questions.find((q) => q.id === 'q_kind')) {
        prefilled['q_kind'] = data.detectedKind;
      }
      setCurrentBatch(data.questions);
      setCurrentAnswers(prefilled);
      setRound(1);
      setTotalRoundsEst(estimateTotalRounds(data.detectedKind));
      setHistory([]);
      setPhase('questioning');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [ideaText]);

  // Accepts explicit answers to avoid stale closure in skip handler
  const doSubmit = useCallback(async (answers: Record<string, unknown>) => {
    if (!sessionId || currentBatch.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      setHistory((prev) => [...prev, { questions: currentBatch, answers: { ...answers } }]);

      let lastResult: { nextBatch?: Question[]; done?: boolean; summary?: ScopeSummary } = {};

      for (const q of currentBatch) {
        const answer = answers[q.id] ?? null;
        const res = await fetch('/api/discovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'step', sessionId, questionId: q.id, answer }),
        });
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          throw new Error(err.error ?? 'API error');
        }
        lastResult = await res.json();
      }

      if (lastResult.done && lastResult.summary) {
        setSummary(lastResult.summary);
        setPhase('summary');
      } else if (lastResult.nextBatch && lastResult.nextBatch.length > 0) {
        setCurrentBatch(lastResult.nextBatch);
        setCurrentAnswers({});
        setRound((r) => r + 1);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [sessionId, currentBatch]);

  const submitCurrentBatch = useCallback(() => doSubmit(currentAnswers), [doSubmit, currentAnswers]);

  const skipBatch = useCallback(() => {
    const withNulls: Record<string, unknown> = { ...currentAnswers };
    currentBatch.forEach((q) => { if (withNulls[q.id] === undefined) withNulls[q.id] = null; });
    doSubmit(withNulls);
  }, [doSubmit, currentBatch, currentAnswers]);

  const handleGenerate = useCallback(async (name: string, path: string) => {
    if (!summary) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, name, rootPath: path || undefined }),
      });
      const json = await res.json() as { data?: { id: string }; error?: string };
      if (!res.ok || !json.data?.id) throw new Error(json.error ?? 'Failed to create project');
      router.push(`/project/${json.data.id}`);
    } catch (e) {
      setGenerateError(String(e));
      setGenerating(false);
    }
  }, [summary, router]);

  const goBack = () => {
    if (phase === 'summary') {
      setPhase('questioning');
      return;
    }
    if (history.length === 0) {
      setPhase('idea');
      return;
    }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentBatch(prev.questions);
    setCurrentAnswers(prev.answers);
    setRound((r) => Math.max(1, r - 1));
  };

  const setAnswer = (qId: string, val: unknown) => {
    setCurrentAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const isBatchAnswered = currentBatch.every((q) => {
    const a = currentAnswers[q.id];
    if (a === undefined || a === null || a === '') return false;
    if (Array.isArray(a) && a.length === 0) return false;
    return true;
  });

  // — Phase: idea entry
  if (phase === 'idea') {
    return (
      <PlanningShell
        locale={i18n.language as 'en' | 'ar'}
        phase={phase}
        ideaText={ideaText}
        detectedKind={detectedKind}
        round={round}
        totalRoundsEst={totalRoundsEst}
        summary={summary}
      >
        <Panel className="flex min-h-[680px] flex-col p-0">
          <ChatHeader
            title={t('discovery.title')}
            subtitle={t('discovery.subtitle')}
            badge={isRtl ? 'مسودة الفكرة' : 'Idea draft'}
          />
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <AssistantBubble
              locale={i18n.language as 'en' | 'ar'}
              lines={[
                isRtl
                  ? 'اكتب فكرة مشروعك، وسأحولها إلى خطة منظمة قابلة للتنفيذ.'
                  : 'Describe the project idea, and I will shape it into an executable plan.',
                isRtl
                  ? 'يمكنك إضافة ملاحظات عن الجمهور، القيود، الملفات، أو المخرجات المطلوبة.'
                  : 'Add audience, constraints, files, or expected outputs when they matter.',
              ]}
            />
          </div>
          <Composer
            value={ideaText}
            onChange={setIdeaText}
            onSubmit={startDiscovery}
            loading={loading}
            disabled={!ideaText.trim()}
            error={error}
            locale={i18n.language as 'en' | 'ar'}
            placeholder={t('discovery.ideaPlaceholder')}
            buttonLabel={t('discovery.startButton')}
          />
        </Panel>
      </PlanningShell>
    );
  }

  // — Phase: questioning
  if (phase === 'questioning') {
    return (
      <PlanningShell
        locale={i18n.language as 'en' | 'ar'}
        phase={phase}
        ideaText={ideaText}
        detectedKind={detectedKind}
        round={round}
        totalRoundsEst={totalRoundsEst}
        summary={summary}
      >
        <Panel className="flex min-h-[680px] flex-col p-0">
          <ChatHeader
            title={t('discovery.title')}
            subtitle={detectedKind ? t('discovery.kindLabels.' + detectedKind) : t('discovery.subtitle')}
            badge={t('discovery.round', { current: round, total: totalRoundsEst })}
          />
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <AssistantBubble
              locale={i18n.language as 'en' | 'ar'}
              lines={[
                isRtl
                  ? 'فهمت الفكرة الأولية. أحتاج بعض التفاصيل قبل إنشاء المخطط.'
                  : 'I have the initial idea. A few details will make the generated plan tighter.',
              ]}
            />
            <UserBubble text={ideaText} />
            {currentBatch.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                locale={i18n.language as 'en' | 'ar'}
                value={currentAnswers[q.id]}
                onChange={(val) => setAnswer(q.id, val)}
              />
            ))}
          </div>
          <div className="border-t border-[var(--pg-border-soft)] p-4">
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={goBack}
                className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {isRtl
                  ? <ChevronRight className="w-4 h-4" />
                  : <ChevronLeft className="w-4 h-4" />}
                {t('discovery.back')}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={skipBatch}
                  disabled={loading}
                  className="inline-flex h-9 items-center rounded-md border border-[var(--pg-border-soft)] px-4 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {t('discovery.skip')}
                </button>
                <button
                  onClick={submitCurrentBatch}
                  disabled={!isBatchAnswered || loading}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('discovery.submitAnswer')}
                </button>
              </div>
            </div>
          </div>
        </Panel>
      </PlanningShell>
    );
  }

  // — Phase: summary
  if (phase === 'summary' && summary) {
    return (
      <>
        <SummaryView
          summary={summary}
          locale={i18n.language as 'en' | 'ar'}
          onEdit={goBack}
          onGenerate={() => {
            setProjectName(summary.idea.split(' ').slice(0, 4).join(' '));
            setGenerateError(null);
            setGenDialogOpen(true);
          }}
        />

        <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('generate.dialogTitle')}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{t('generate.nameLabel')}</label>
                <input
                  autoFocus
                  className="rounded-lg border border-border bg-background px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('generate.namePlaceholder')}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">{t('generate.rootLabel')}</label>
                <input
                  className="rounded-lg border border-border bg-background px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('generate.rootPlaceholder')}
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  dir="ltr"
                />
              </div>
              {generateError && <p className="text-xs text-destructive">{generateError}</p>}
            </div>

            <DialogFooter>
              <button
                onClick={() => setGenDialogOpen(false)}
                className="inline-flex items-center px-4 h-9 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('generate.cancel')}
              </button>
              <button
                onClick={() => handleGenerate(projectName, rootPath)}
                disabled={!projectName.trim() || generating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-9 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                {generating ? t('generate.creating') : t('generate.create')}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  locale,
  value,
  onChange,
}: {
  question: Question;
  locale: 'en' | 'ar';
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const text = question.text[locale] ?? question.text.en;
  const hint = question.hint?.[locale] ?? question.hint?.en;
  const isRtl = locale === 'ar';

  return (
    <Panel tone="muted" className="p-4">
      <PanelHeader className="mb-3">
        <div>
          <PanelTitle className="text-base">{text}</PanelTitle>
          {hint && <PanelDescription className="mt-1 text-sm">{hint}</PanelDescription>}
        </div>
      </PanelHeader>
      <PanelContent>
        {question.type === 'single' && question.options && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => {
              const label = opt.label[locale] ?? opt.label.en;
              const selected = value === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected ? 'border-primary bg-primary/10' : 'border-[var(--pg-border-soft)] hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={opt.value}
                    checked={selected}
                    onChange={() => onChange(opt.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selected ? 'border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm">{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'multi' && question.options && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => {
              const label = opt.label[locale] ?? opt.label.en;
              const selected = Array.isArray(value) && (value as string[]).includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected ? 'border-primary bg-primary/10' : 'border-[var(--pg-border-soft)] hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = Array.isArray(value) ? (value as string[]) : [];
                      onChange(
                        selected
                          ? current.filter((v) => v !== opt.value)
                          : [...current, opt.value],
                      );
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {selected && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'boolean' && (
          <div className="flex gap-3">
            {([true, false] as const).map((boolVal) => {
              const label = isRtl
                ? boolVal ? 'نعم' : 'لا'
                : boolVal ? 'Yes' : 'No';
              const selected = value === boolVal;
              return (
                <label
                  key={String(boolVal)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected ? 'border-primary bg-primary/10' : 'border-[var(--pg-border-soft)] hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={selected}
                    onChange={() => onChange(boolVal)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'text' && (
          <textarea
            className="w-full min-h-20 rounded-lg border border-[var(--pg-border-soft)] bg-background/70 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
        )}
      </PanelContent>
    </Panel>
  );
}

// ─── Summary View ─────────────────────────────────────────────────────────────

function SummaryView({
  summary,
  locale,
  onEdit,
  onGenerate,
}: {
  summary: ScopeSummary;
  locale: 'en' | 'ar';
  onEdit: () => void;
  onGenerate: () => void;
}) {
  const { t } = useTranslation();
  const kindLabel = t('discovery.kindLabels.' + summary.detectedKind);

  return (
    <PlanningShell
      locale={locale}
      phase="summary"
      ideaText={summary.idea}
      detectedKind={summary.detectedKind}
      round={3}
      totalRoundsEst={3}
      summary={summary}
    >
      <Panel className="flex min-h-[680px] flex-col p-0">
        <ChatHeader
          title={t('discovery.summary.title')}
          subtitle={summary.idea}
          badge={kindLabel}
        />
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <AssistantBubble
            locale={locale}
            lines={[
              locale === 'ar'
                ? 'جاهز. راجعت إجاباتك وحولت الفكرة إلى نطاق مشروع واضح.'
                : 'Ready. I reviewed your answers and turned the idea into a clear project scope.',
              locale === 'ar'
                ? 'يمكنك تعديل الإجابات أو إنشاء المشروع المحلي الآن.'
                : 'You can edit the answers or create the local project now.',
            ]}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryMetric label={t('discovery.summary.kind')} value={kindLabel} />
            <SummaryMetric label={t('discovery.summary.steps')} value={String(summary.estimatedSteps)} />
            <SummaryMetric
              label={t('discovery.summary.hours')}
              value={`${summary.estimatedHours.min}-${summary.estimatedHours.max}h`}
            />
          </div>
          <Panel tone="muted" className="p-4">
            <PanelTitle className="text-sm">{t('discovery.summary.stack')}</PanelTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.stack.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </Panel>
          {summary.features.length > 0 && (
            <ListPanel title={t('discovery.summary.features')} items={summary.features} />
          )}
          {summary.mvpExclusions.length > 0 && (
            <ListPanel title={t('discovery.summary.exclusions')} items={summary.mvpExclusions} muted />
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--pg-border-soft)] p-4">
          <button
            onClick={onEdit}
            className="inline-flex h-10 items-center rounded-md border border-[var(--pg-border-soft)] px-4 text-sm transition-colors hover:bg-muted"
          >
            {t('discovery.summary.editAnswers')}
          </button>
          <button
            onClick={onGenerate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('discovery.summary.generatePlan')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Panel>
    </PlanningShell>
  );
}

function PlanningShell({
  children,
  locale,
  phase,
  ideaText,
  detectedKind,
  round,
  totalRoundsEst,
  summary,
}: {
  children: React.ReactNode;
  locale: 'en' | 'ar';
  phase: Phase;
  ideaText: string;
  detectedKind: ProjectKind | null;
  round: number;
  totalRoundsEst: number;
  summary: ScopeSummary | null;
}) {
  const isRtl = locale === 'ar';

  return (
    <div className="pg-graph-canvas min-h-[calc(100vh-3.5rem)] px-4 py-5 sm:px-6">
      <div className="mx-auto grid w-full max-w-[1780px] gap-4 xl:grid-cols-[minmax(440px,1.1fr)_minmax(340px,0.9fr)_minmax(360px,0.9fr)]">
        <div className="min-w-0">{children}</div>
        <PlanSummaryPanel
          locale={locale}
          phase={phase}
          ideaText={ideaText}
          detectedKind={detectedKind}
          round={round}
          totalRoundsEst={totalRoundsEst}
          summary={summary}
        />
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <GraphPreviewPanel locale={locale} phase={phase} />
          <AttachmentsPanel locale={locale} />
        </div>
      </div>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="sr-only">
        {isRtl ? 'واجهة تخطيط مرئية' : 'Visual planning shell'}
      </div>
    </div>
  );
}

function ChatHeader({ title, subtitle, badge }: { title: React.ReactNode; subtitle: React.ReactNode; badge: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pg-border-soft)] px-4 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <h1 className="truncate text-xl font-semibold">{title}</h1>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Badge variant="secondary" className="shrink-0">{badge}</Badge>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
  error,
  locale,
  placeholder,
  buttonLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  error: string | null;
  locale: 'en' | 'ar';
  placeholder: string;
  buttonLabel: React.ReactNode;
}) {
  const isRtl = locale === 'ar';
  const chips = isRtl
    ? ['تطبيق ويب', 'بحث علمي', 'تحليل بيانات', 'أتمتة عمل']
    : ['Web app', 'Research', 'Data workflow', 'Automation'];

  return (
    <div className="border-t border-[var(--pg-border-soft)] p-4">
      <div className="rounded-lg border border-primary/35 bg-background/70 p-3 shadow-[0_0_24px_oklch(0.56_0.22_292_/_12%)]">
        <textarea
          className="min-h-28 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={isRtl ? 'rtl' : 'ltr'}
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex h-8 items-center gap-2 rounded-md border border-[var(--pg-border-soft)] px-3 text-xs text-muted-foreground">
              <Paperclip className="size-3.5" />
              {isRtl ? 'مرفقات' : 'Attachments'}
            </button>
            {chips.map((chip) => (
              <span key={chip} className="rounded-md border border-[var(--pg-border-soft)] px-3 py-1 text-xs text-muted-foreground">
                {chip}
              </span>
            ))}
          </div>
          <button
            onClick={onSubmit}
            disabled={disabled || loading}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {buttonLabel}
            {isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ locale, lines }: { locale: 'en' | 'ar'; lines: string[] }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-[var(--pg-surface-glass)] p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Bot className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">PlanGraph AI</p>
          <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'مساعد التخطيط' : 'Planning assistant'}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm leading-6 text-[var(--pg-text-soft)]">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="ms-auto max-w-[82%] rounded-lg border border-primary/30 bg-primary/20 p-4 text-sm leading-6">
      {text}
    </div>
  );
}

function PlanSummaryPanel({
  locale,
  phase,
  ideaText,
  detectedKind,
  round,
  totalRoundsEst,
  summary,
}: {
  locale: 'en' | 'ar';
  phase: Phase;
  ideaText: string;
  detectedKind: ProjectKind | null;
  round: number;
  totalRoundsEst: number;
  summary: ScopeSummary | null;
}) {
  const isRtl = locale === 'ar';
  const sections = summary
    ? [
        { icon: BrainCircuit, title: isRtl ? 'الفكرة' : 'Idea', body: summary.idea },
        { icon: CircleCheck, title: isRtl ? 'الأهداف' : 'Goals', list: summary.features.slice(0, 4) },
        { icon: Layers3, title: isRtl ? 'القيود' : 'Constraints', list: summary.mvpExclusions.slice(0, 3) },
      ]
    : [
        { icon: BrainCircuit, title: isRtl ? 'الفكرة' : 'Idea', body: ideaText || (isRtl ? 'لم يتم وصف الفكرة بعد.' : 'No idea described yet.') },
        { icon: CircleCheck, title: isRtl ? 'الأهداف المقترحة' : 'Suggested sections', list: isRtl ? ['النطاق', 'المستخدمون', 'المخرجات'] : ['Scope', 'Users', 'Deliverables'] },
        { icon: Layers3, title: isRtl ? 'التقدم' : 'Progress', body: phase === 'questioning' ? `${round}/${totalRoundsEst}` : isRtl ? 'جاهز للبدء' : 'Ready to start' },
      ];
  const skills = summary?.stack.length ? summary.stack.slice(0, 6) : (isRtl ? ['تحليل', 'تخطيط', 'واجهة', 'اختبار'] : ['Analysis', 'Planning', 'UI', 'Validation']);
  const tools = isRtl ? ['Markdown', 'Graph', 'Local files'] : ['Markdown', 'Graph', 'Local files'];

  return (
    <Panel className="min-w-0 p-4">
      <PanelHeader>
        <div>
          <PanelTitle>{isRtl ? 'ملخص الخطة المقترحة' : 'Suggested Plan Summary'}</PanelTitle>
          <PanelDescription>
            {detectedKind ? detectedKind.replace(/-/g, ' ') : isRtl ? 'يتحدث أثناء الاستكشاف' : 'Updates while discovery runs'}
          </PanelDescription>
        </div>
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <GitBranch className="size-4" />
        </span>
      </PanelHeader>
      <PanelContent>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-lg border border-[var(--pg-border-soft)] bg-background/40 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </span>
                <h2 className="text-sm font-medium">{section.title}</h2>
              </div>
              {'body' in section && section.body && (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{section.body}</p>
              )}
              {'list' in section && section.list && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {section.list.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              )}
            </div>
          );
        })}
        <TokenPanel icon={Sparkles} title={isRtl ? 'المهارات المقترحة' : 'Suggested skills'} tokens={skills} />
        <TokenPanel icon={Wrench} title={isRtl ? 'الأدوات المقترحة' : 'Suggested tools'} tokens={tools} />
      </PanelContent>
    </Panel>
  );
}

function TokenPanel({ icon: Icon, title, tokens }: { icon: typeof Sparkles; title: string; tokens: string[] }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/40 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[var(--pg-accent-blue)]/15 text-[var(--pg-accent-blue)]">
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {tokens.map((token) => <Badge key={token} variant="secondary">{token}</Badge>)}
      </div>
    </div>
  );
}

function GraphPreviewPanel({ locale, phase }: { locale: 'en' | 'ar'; phase: Phase }) {
  const isRtl = locale === 'ar';
  const nodes = [
    { label: isRtl ? 'فهم المشكلة' : 'Understand', className: 'left-[35%] top-[8%] border-primary/70 text-primary' },
    { label: isRtl ? 'جمع البيانات' : 'Collect', className: 'left-[7%] top-[34%] border-[var(--pg-accent-green)]/70 text-[var(--pg-accent-green)]' },
    { label: isRtl ? 'تحليل المتطلبات' : 'Analyze', className: 'left-[38%] top-[34%] border-[var(--pg-accent-blue)]/70 text-[var(--pg-accent-blue)]' },
    { label: isRtl ? 'تصميم الحل' : 'Design', className: 'left-[22%] top-[58%] border-[var(--pg-accent-cyan)]/70 text-[var(--pg-accent-cyan)]' },
    { label: isRtl ? 'تنفيذ الخطة' : 'Execute', className: 'left-[48%] top-[72%] border-primary/70 text-primary' },
  ];

  return (
    <Panel className="min-h-[360px] p-4">
      <PanelHeader>
        <div>
          <PanelTitle>{isRtl ? 'معاينة المخطط' : 'Graph Preview'}</PanelTitle>
          <PanelDescription>{phase === 'summary' ? (isRtl ? 'جاهز للتوليد' : 'Ready to generate') : (isRtl ? 'معاينة مبدئية' : 'Draft preview')}</PanelDescription>
        </div>
        <GitBranch className="size-5 text-primary" />
      </PanelHeader>
      <div className="pg-canvas-grid relative h-72 overflow-hidden rounded-lg border border-[var(--pg-border-soft)]">
        <div className="absolute left-[42%] top-[18%] h-[58%] w-px bg-[var(--pg-border-strong)]" />
        <div className="absolute left-[18%] top-[43%] h-px w-[62%] bg-[var(--pg-border-strong)]" />
        <div className="absolute left-[33%] top-[66%] h-px w-[34%] bg-[var(--pg-border-strong)]" />
        {nodes.map((node) => (
          <div
            key={node.label}
            className={cn(
              'absolute flex h-12 min-w-24 items-center justify-center rounded-lg border bg-[var(--pg-surface-glass)] px-3 text-xs font-medium shadow-sm',
              node.className,
            )}
          >
            {node.label}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AttachmentsPanel({ locale }: { locale: 'en' | 'ar' }) {
  const isRtl = locale === 'ar';
  const files = [
    { name: 'brief.pdf', meta: 'PDF · 1.2 MB', color: 'text-[var(--pg-accent-danger)]' },
    { name: 'data-sample.csv', meta: 'CSV · 90 KB', color: 'text-[var(--pg-accent-green)]' },
    { name: 'review-examples.png', meta: 'PNG · 1.1 MB', color: 'text-primary' },
  ];

  return (
    <Panel className="p-4">
      <PanelHeader>
        <div>
          <PanelTitle>{isRtl ? 'الملفات والمراجع' : 'Files & References'}</PanelTitle>
          <PanelDescription>{isRtl ? 'واجهة مرئية فقط للمرفقات' : 'Visual attachment shell only'}</PanelDescription>
        </div>
        <Paperclip className="size-5 text-primary" />
      </PanelHeader>
      <PanelContent>
        <div className="rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4 text-center">
          <UploadCloud className="mx-auto size-8 text-primary" />
          <p className="mt-2 text-sm font-medium">{isRtl ? 'اسحب الملفات هنا أو اختر ملفا' : 'Drop files here or choose files'}</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, CSV, PNG, JPG</p>
        </div>
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.name} className="flex items-center gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-3">
              <span className={cn('inline-flex size-9 items-center justify-center rounded-lg bg-background/70', file.color)}>
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.meta}</p>
              </div>
              <CircleCheck className="size-4 text-[var(--pg-accent-green)]" />
            </div>
          ))}
        </div>
      </PanelContent>
    </Panel>
  );
}

function SummaryMetric({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold">{value}</p>
    </div>
  );
}

function ListPanel({ title, items, muted = false }: { title: React.ReactNode; items: string[]; muted?: boolean }) {
  return (
    <Panel tone="muted" className="p-4">
      <PanelTitle className="text-sm">{title}</PanelTitle>
      <ul className={cn('mt-3 space-y-2 text-sm leading-6', muted ? 'text-muted-foreground' : 'text-foreground')}>
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </Panel>
  );
}

function estimateTotalRounds(kind: ProjectKind): number {
  const perKind: Partial<Record<ProjectKind, number>> = {
    'web-app': 3, 'mobile-app': 3, 'browser-extension': 2, 'rest-api': 3,
    'cli-tool': 2, 'discord-bot': 2, 'telegram-bot': 2, 'landing-page': 2,
    '3d-web': 2, 'n8n-workflow': 2, 'ai-agent': 3, 'unknown': 2,
  };
  return perKind[kind] ?? 3;
}
