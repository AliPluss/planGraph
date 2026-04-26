'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import { ArrowLeft, Check, X, Plus } from 'lucide-react';
import type { SkillLevel, ExecutorTool, CommunicationStyle, Locale, UserProfile } from '@/core/types';

const PRESET_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'Next.js',
  'Node.js', 'HTML/CSS', 'SQL', 'Tailwind',
];

const EXECUTOR_TOOLS: { id: ExecutorTool; label: string }[] = [
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'copilot', label: 'GitHub Copilot' },
  { id: 'manual', label: 'Manual' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [level, setLevel] = useState<SkillLevel>('intermediate');
  const [tools, setTools] = useState<ExecutorTool[]>(['manual']);
  const [commStyle, setCommStyle] = useState<CommunicationStyle>('concise');
  const [prefLocale, setPrefLocale] = useState<Locale>('en');
  const [languages, setLanguages] = useState<string[]>([]);
  const [customLang, setCustomLang] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }: { profile: UserProfile | null }) => {
        if (!profile) { router.replace('/onboarding'); return; }
        setLevel(profile.level);
        setTools(profile.tools);
        setCommStyle(profile.communicationStyle);
        setPrefLocale(profile.preferredLocale);
        setLanguages(profile.languages);
      })
      .finally(() => setLoading(false));
  }, [router]);

  function toggleTool(tool: ExecutorTool) {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  function addCustomLang() {
    const trimmed = customLang.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages((prev) => [...prev, trimmed]);
    }
    setCustomLang('');
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          tools: tools.length > 0 ? tools : ['manual'],
          communicationStyle: commStyle,
          preferredLocale: prefLocale,
          languages,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/')}
          aria-label={t('project.backHome')}
          className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
      </div>

      <div className="flex flex-col gap-8">
        {/* Skill level */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.skillLevel')}
          </h2>
          <div className="flex flex-col gap-2">
            {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`text-start px-4 py-3 rounded-lg border text-sm transition-colors ${
                  level === l
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {t(`settings.skillLabels.${l}`)}
              </button>
            ))}
          </div>
        </section>

        {/* Languages */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.languages')}
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_LANGUAGES.map((lang) => {
              const active = languages.includes(lang);
              return (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
            {languages.filter((l) => !PRESET_LANGUAGES.includes(l)).map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary bg-primary text-primary-foreground text-sm"
              >
                {lang}
                <button
                  onClick={() => toggleLanguage(lang)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${lang}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomLang()}
              placeholder={t('settings.addLanguage')}
              className="flex-1 h-8 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={addCustomLang}
              disabled={!customLang.trim()}
              className="inline-flex items-center justify-center size-8 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Executor tools */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.executorTools')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {EXECUTOR_TOOLS.map(({ id, label }) => {
              const active = tools.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleTool(id)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Communication style */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.communicationStyle')}
          </h2>
          <div className="flex gap-2">
            {(['detailed', 'concise'] as CommunicationStyle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCommStyle(c)}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  commStyle === c
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {t(`settings.commLabels.${c}`)}
              </button>
            ))}
          </div>
        </section>

        {/* Preferred locale */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.preferredLocale')}
          </h2>
          <div className="flex gap-2">
            {(['en', 'ar'] as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => setPrefLocale(loc)}
                className={`px-6 py-2.5 rounded-lg border text-sm transition-colors ${
                  prefLocale === loc
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {t(`settings.localeLabels.${loc}`)}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Save */}
      <div className="mt-10">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saved ? (
            <><Check className="w-4 h-4" />{t('settings.saved')}</>
          ) : saving ? (
            t('settings.saving')
          ) : (
            t('settings.save')
          )}
        </button>
      </div>
    </div>
  );
}
