'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import type { SkillLevel, ExecutorTool, CommunicationStyle, Locale } from '@/core/types';

const TOTAL_STEPS = 4;

const PRESET_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'Next.js',
  'Node.js', 'HTML/CSS', 'SQL', 'Tailwind',
];

const EXECUTOR_TOOLS: { id: ExecutorTool; label: string; desc: string }[] = [
  { id: 'claude-code', label: 'Claude Code', desc: 'Anthropic CLI tool' },
  { id: 'cursor', label: 'Cursor', desc: 'AI-powered editor' },
  { id: 'antigravity', label: 'Antigravity', desc: 'Agentic workspace' },
  { id: 'copilot', label: 'GitHub Copilot', desc: 'GitHub AI assistant' },
  { id: 'manual', label: 'Manual', desc: 'Copy-paste prompts yourself' },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const store = useOnboardingStore();
  const [customLang, setCustomLang] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const progress = (store.step / TOTAL_STEPS) * 100;

  const canNext = () => {
    if (store.step === 1) return store.answers.level !== null;
    if (store.step === 2) return true; // skippable
    if (store.step === 3) return store.answers.tools.length > 0;
    if (store.step === 4) return store.answers.communicationStyle !== null;
    return true;
  };

  const goNext = () => store.setStep(Math.min(store.step + 1, TOTAL_STEPS + 1));
  const goBack = () => store.setStep(Math.max(store.step - 1, 1));

  const toggleLanguage = (lang: string) => {
    const has = store.answers.languages.includes(lang);
    store.setLanguages(has
      ? store.answers.languages.filter((l) => l !== lang)
      : [...store.answers.languages, lang]);
  };

  const addCustomLanguage = () => {
    const trimmed = customLang.trim();
    if (trimmed && !store.answers.languages.includes(trimmed)) {
      store.setLanguages([...store.answers.languages, trimmed]);
    }
    setCustomLang('');
  };

  const toggleTool = (tool: ExecutorTool) => {
    const has = store.answers.tools.includes(tool);
    store.setTools(has
      ? store.answers.tools.filter((t) => t !== tool)
      : [...store.answers.tools, tool]);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: store.answers.level,
          languages: store.answers.languages,
          tools: store.answers.tools,
          preferredLocale: store.answers.preferredLocale,
          communicationStyle: store.answers.communicationStyle,
        }),
      });
      if (res.ok) {
        store.reset();
        router.push('/');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{t('onboarding.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('onboarding.subtitle')}</p>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-right">
            {t('onboarding.progress.stepOf', { current: Math.min(store.step, TOTAL_STEPS), total: TOTAL_STEPS })}
          </p>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step 1 — Skill level */}
        {store.step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('onboarding.step1.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => store.setLevel(lvl)}
                  className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                    store.answers.level === lvl
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {store.answers.level === lvl && <Check className="h-4 w-4 text-primary shrink-0" />}
                    {t(`onboarding.step1.${lvl}`)}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Languages */}
        {store.step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('onboarding.step2.title')}</CardTitle>
              <CardDescription className="text-xs">{t('onboarding.step2.hint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_LANGUAGES.map((lang) => {
                  const selected = store.answers.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
                {store.answers.languages
                  .filter((l) => !PRESET_LANGUAGES.includes(l))
                  .map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className="rounded-full border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground"
                    >
                      {lang}
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomLanguage()}
                  placeholder={t('onboarding.step2.addCustom')}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={addCustomLanguage}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Tools */}
        {store.step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('onboarding.step3.title')}</CardTitle>
              <CardDescription className="text-xs">{t('onboarding.step3.hint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {EXECUTOR_TOOLS.map(({ id, label, desc }) => {
                const selected = store.answers.tools.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleTool(id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Step 4 — Preferences */}
        {store.step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('onboarding.step4.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium">Communication style</p>
                {(['detailed', 'concise'] as CommunicationStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => store.setCommunicationStyle(style)}
                    className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                      store.answers.communicationStyle === style
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {store.answers.communicationStyle === style && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                      {t(`onboarding.step4.communication.${style}`)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('onboarding.step4.locale')}</p>
                {([{ code: 'en', label: 'English' }, { code: 'ar', label: 'العربية' }] as { code: Locale; label: string }[]).map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => store.setLocale(code)}
                    className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                      store.answers.preferredLocale === code
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {store.answers.preferredLocale === code && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review screen */}
        {store.step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('onboarding.review.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ReviewRow label="Experience" value={store.answers.level ?? '—'} onEdit={() => store.setStep(1)} editLabel={t('onboarding.review.edit')} />
              <ReviewRow
                label="Languages"
                value={store.answers.languages.length ? store.answers.languages.join(', ') : '—'}
                onEdit={() => store.setStep(2)}
                editLabel={t('onboarding.review.edit')}
              />
              <ReviewRow
                label="Tools"
                value={store.answers.tools.join(', ') || '—'}
                onEdit={() => store.setStep(3)}
                editLabel={t('onboarding.review.edit')}
              />
              <ReviewRow
                label="Style"
                value={store.answers.communicationStyle ?? '—'}
                onEdit={() => store.setStep(4)}
                editLabel={t('onboarding.review.edit')}
              />
              <ReviewRow
                label="Language"
                value={store.answers.preferredLocale === 'ar' ? 'العربية' : 'English'}
                onEdit={() => store.setStep(4)}
                editLabel={t('onboarding.review.edit')}
              />
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={store.step === 1}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t('common.back')}
          </button>

          <div className="flex gap-2">
            {store.step === 2 && (
              <button
                onClick={goNext}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                {t('onboarding.step2.skip')}
              </button>
            )}

            {store.step < 5 ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                {submitting ? t('common.loading') : t('onboarding.review.finish')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  editLabel,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium capitalize">{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-primary underline-offset-2 hover:underline shrink-0"
      >
        {editLabel}
      </button>
    </div>
  );
}
