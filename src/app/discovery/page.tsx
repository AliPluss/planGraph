'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="h-8 w-48 rounded bg-muted animate-pulse mb-4" />
      <div className="h-4 w-72 rounded bg-muted animate-pulse" />
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
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('discovery.title')}</h1>
          <p className="text-muted-foreground">{t('discovery.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <textarea
              className="w-full min-h-32 rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('discovery.ideaPlaceholder')}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              onClick={startDiscovery}
              disabled={!ideaText.trim() || loading}
              className="self-end inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('discovery.startButton')}
              {isRtl
                ? <ChevronLeft className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // — Phase: questioning
  if (phase === 'questioning') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('discovery.title')}</h1>
            {detectedKind && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('discovery.kindLabels.' + detectedKind)}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {t('discovery.round', { current: round, total: totalRoundsEst })}
          </Badge>
        </div>

        {currentBatch.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            locale={i18n.language as 'en' | 'ar'}
            value={currentAnswers[q.id]}
            onChange={(val) => setAnswer(q.id, val)}
          />
        ))}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-between items-center">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              className="inline-flex items-center px-4 h-9 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              {t('discovery.skip')}
            </button>
            <button
              onClick={submitCurrentBatch}
              disabled={!isBatchAnswered || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('discovery.submitAnswer')}
              {isRtl
                ? <ChevronLeft className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // — Phase: summary
  if (phase === 'summary' && summary) {
    return (
      <SummaryView
        summary={summary}
        locale={i18n.language as 'en' | 'ar'}
        onEdit={goBack}
        onGenerate={() => {
          // Session 9 will wire up the actual generation flow
          router.push('/onboarding');
        }}
      />
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{text}</CardTitle>
        {hint && <CardDescription className="text-sm">{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        {question.type === 'single' && question.options && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => {
              const label = opt.label[locale] ?? opt.label.en;
              const selected = value === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
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
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
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
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
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
            className="w-full min-h-20 rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
        )}
      </CardContent>
    </Card>
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
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('discovery.summary.title')}</h1>
        <p className="text-muted-foreground text-sm line-clamp-3">{summary.idea}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('discovery.summary.kind')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{kindLabel}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('discovery.summary.steps')}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{summary.estimatedSteps}</span>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>{t('discovery.summary.hours')}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              {summary.estimatedHours.min}–{summary.estimatedHours.max}h
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t('discovery.summary.stack')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {summary.stack.map((s) => (
            <Badge key={s} variant="outline">{s}</Badge>
          ))}
        </CardContent>
      </Card>

      {summary.features.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('discovery.summary.features')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm space-y-1">
              {summary.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {summary.mvpExclusions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('discovery.summary.exclusions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              {summary.mvpExclusions.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onEdit}
          className="inline-flex items-center px-4 h-10 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          {t('discovery.summary.editAnswers')}
        </button>
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('discovery.summary.generatePlan')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
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
