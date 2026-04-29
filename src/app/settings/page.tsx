'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bot,
  Check,
  Database,
  FolderKanban,
  Globe2,
  HardDrive,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import '@/lib/i18n/i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import type { CommunicationStyle, ExecutorTool, Locale, SkillLevel, UserProfile } from '@/core/types';

const PRESET_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'React',
  'Next.js',
  'Node.js',
  'HTML/CSS',
  'SQL',
  'Tailwind',
];

const EXECUTOR_TOOLS: {
  id: ExecutorTool;
  label: string;
  detail: string;
  accent: 'amber' | 'blue' | 'cyan' | 'green' | 'purple';
}[] = [
  { id: 'claude-code', label: 'Claude Code', detail: 'Local prompt handoff and report detection.', accent: 'purple' },
  { id: 'cursor', label: 'Cursor', detail: 'Context files prepared for the workspace.', accent: 'blue' },
  { id: 'antigravity', label: 'Antigravity', detail: 'Skill handoff through local prompt files.', accent: 'green' },
  { id: 'copilot', label: 'GitHub Copilot', detail: 'Manual prompt usage inside your editor.', accent: 'cyan' },
  { id: 'manual', label: 'Manual', detail: 'Copy prompts and record progress yourself.', accent: 'amber' },
];

const TAB_ITEMS = [
  { value: 'general', label: 'General', icon: SlidersHorizontal },
  { value: 'workspace', label: 'Workspace', icon: FolderKanban },
  { value: 'executors', label: 'Executors', icon: Bot },
  { value: 'token', label: 'Token', icon: KeyRound },
  { value: 'storage', label: 'Storage', icon: Database },
  { value: 'integrations', label: 'Integrations', icon: Sparkles },
] as const;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [level, setLevel] = useState<SkillLevel>('intermediate');
  const [tools, setTools] = useState<ExecutorTool[]>(['manual']);
  const [commStyle, setCommStyle] = useState<CommunicationStyle>('concise');
  const [prefLocale, setPrefLocale] = useState<Locale>('en');
  const [languages, setLanguages] = useState<string[]>([]);
  const [customLang, setCustomLang] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }: { profile: UserProfile | null }) => {
        if (cancelled) return;
        if (!profile) {
          router.replace('/onboarding');
          return;
        }
        setDisplayName(profile.displayName ?? '');
        setLevel(profile.level);
        setTools(profile.tools);
        setCommStyle(profile.communicationStyle);
        setPrefLocale(profile.preferredLocale);
        setLanguages(profile.languages);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
          displayName: displayName.trim() || undefined,
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
      <div className="flex h-40 items-center justify-center">
        <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <button
            onClick={() => router.push('/')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className={`size-4 ${isRtl ? 'rotate-180' : ''}`} />
            {t('project.backHome')}
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pg-text-faint)]">Settings V2</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t('settings.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure the local workspace, execution preferences, privacy posture, and adapter defaults without changing project runtime data.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saved ? (
            <>
              <Check className="size-4" />
              {t('settings.saved')}
            </>
          ) : saving ? (
            t('settings.saving')
          ) : (
            t('settings.save')
          )}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[21rem_1fr]">
        <aside className="space-y-4">
          <Panel>
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--pg-accent-cyan)]/15 text-[var(--pg-accent-cyan)]">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{displayName.trim() || 'Local user'}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{level} builder</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <ProfileMetric label="Language" value={prefLocale === 'ar' ? 'Arabic' : 'English'} />
              <ProfileMetric label="Executor tools" value={tools.length.toString()} />
              <ProfileMetric label="Code stack" value={languages.length ? `${languages.length} tags` : 'Not set'} />
            </div>
          </Panel>

          <Panel tone="muted">
            <PanelHeader>
              <div>
                <PanelTitle>Local-first privacy</PanelTitle>
                <PanelDescription>Workspace records stay on disk in this app.</PanelDescription>
              </div>
              <ShieldCheck className="size-4 text-[var(--pg-accent-green)]" />
            </PanelHeader>
            <PanelContent className="space-y-2">
              <PrivacyRow label="Project data" value="Local workspace" />
              <PrivacyRow label="AI providers" value="Not connected" />
              <PrivacyRow label="API keys" value="Not stored" />
            </PanelContent>
          </Panel>
        </aside>

        <Tabs defaultValue="general" className="min-w-0">
          <TabsList className="w-full flex-wrap justify-start bg-[var(--pg-surface-glass)]">
            {TAB_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value} className="min-h-8">
                  <Icon className="size-4" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>General profile</PanelTitle>
                  <PanelDescription>These values are stored in the existing local profile.</PanelDescription>
                </div>
              </PanelHeader>
              <PanelContent>
                <Field label="Display name">
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Local user" />
                </Field>

                <Field label={t('settings.skillLevel')}>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((option) => (
                      <ChoiceButton
                        key={option}
                        active={level === option}
                        onClick={() => setLevel(option)}
                        label={t(`settings.skillLabels.${option}`)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label={t('settings.communicationStyle')}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(['detailed', 'concise'] as CommunicationStyle[]).map((option) => (
                      <ChoiceButton
                        key={option}
                        active={commStyle === option}
                        onClick={() => setCommStyle(option)}
                        label={t(`settings.commLabels.${option}`)}
                      />
                    ))}
                  </div>
                </Field>

                <Field label={t('settings.preferredLocale')}>
                  <div className="flex flex-wrap gap-2">
                    {(['en', 'ar'] as Locale[]).map((loc) => (
                      <ChoiceButton
                        key={loc}
                        active={prefLocale === loc}
                        onClick={() => setPrefLocale(loc)}
                        label={t(`settings.localeLabels.${loc}`)}
                      />
                    ))}
                  </div>
                </Field>
              </PanelContent>
            </Panel>
          </TabsContent>

          <TabsContent value="workspace" className="mt-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Workspace configuration</PanelTitle>
                  <PanelDescription>Local workspace defaults and planning context.</PanelDescription>
                </div>
                <FolderKanban className="size-4 text-[var(--pg-accent-blue)]" />
              </PanelHeader>
              <PanelContent>
                <Field label={t('settings.languages')}>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LANGUAGES.map((lang) => (
                      <TagButton key={lang} active={languages.includes(lang)} onClick={() => toggleLanguage(lang)}>
                        {lang}
                      </TagButton>
                    ))}
                    {languages.filter((lang) => !PRESET_LANGUAGES.includes(lang)).map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--pg-accent-purple)]/45 bg-primary/15 px-3 text-sm text-foreground"
                      >
                        {lang}
                        <button onClick={() => toggleLanguage(lang)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${lang}`}>
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customLang}
                      onChange={(event) => setCustomLang(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && addCustomLang()}
                      placeholder={t('settings.addLanguage')}
                    />
                    <Button size="icon" variant="outline" onClick={addCustomLang} disabled={!customLang.trim()}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <ReadOnlySetting icon={<HardDrive className="size-4" />} label="Workspace root" value="workspace/" tone="cyan" />
                  <ReadOnlySetting icon={<LockKeyhole className="size-4" />} label="Protected writes" value="Path guard enabled" tone="green" />
                </div>
              </PanelContent>
            </Panel>
          </TabsContent>

          <TabsContent value="executors" className="mt-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Adapter settings</PanelTitle>
                  <PanelDescription>Select the tools PlanGraph should offer in execution workflows.</PanelDescription>
                </div>
                <Bot className="size-4 text-[var(--pg-accent-purple)]" />
              </PanelHeader>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {EXECUTOR_TOOLS.map((tool) => (
                  <AdapterCard
                    key={tool.id}
                    active={tools.includes(tool.id)}
                    tool={tool}
                    onToggle={() => toggleTool(tool.id)}
                  />
                ))}
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="token" className="mt-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Token preferences</PanelTitle>
                  <PanelDescription>Planning estimates only; no API billing or provider keys are configured in MVP 2.</PanelDescription>
                </div>
                <KeyRound className="size-4 text-[var(--pg-accent-amber)]" />
              </PanelHeader>
              <div className="grid gap-3 md:grid-cols-3">
                <ReadOnlySetting icon={<KeyRound className="size-4" />} label="Provider keys" value="Not stored" tone="amber" />
                <ReadOnlySetting icon={<Sparkles className="size-4" />} label="Prompt mode" value={commStyle} tone="purple" />
                <ReadOnlySetting icon={<Database className="size-4" />} label="Estimates" value="Local placeholders" tone="blue" />
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="storage" className="mt-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Storage and privacy</PanelTitle>
                  <PanelDescription>Current MVP 2 behavior keeps profile, projects, memory, reports, and audit files local.</PanelDescription>
                </div>
                <Database className="size-4 text-[var(--pg-accent-cyan)]" />
              </PanelHeader>
              <PanelContent>
                <StorageRow label="Profile" value="workspace/profile.json" />
                <StorageRow label="Projects" value="workspace/projects/*/project.json" />
                <StorageRow label="Memory" value="workspace/projects/*/MEMORY.md" />
                <StorageRow label="Audit logs" value="workspace/projects/*/audit.log" />
              </PanelContent>
            </Panel>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Integrations</PanelTitle>
                  <PanelDescription>MVP 2 exposes local adapter readiness without adding new AI, MCP, or cloud integrations.</PanelDescription>
                </div>
                <Globe2 className="size-4 text-[var(--pg-accent-green)]" />
              </PanelHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <IntegrationCard title="AI APIs" detail="Not connected in MVP 2." />
                <IntegrationCard title="MCP server" detail="Reserved for a later MVP." />
                <IntegrationCard title="CLI automation" detail="Not enabled from settings." />
                <IntegrationCard title="Local adapters" detail={`${tools.length || 1} profile tool(s) selected.`} active />
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</h2>
      {children}
    </section>
  );
}

function ChoiceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-start text-sm transition-colors ${
        active
          ? 'border-[var(--pg-accent-purple)]/70 bg-primary/15 text-foreground'
          : 'border-[var(--pg-border-soft)] bg-background/35 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function TagButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-lg border px-3 text-sm transition-colors ${
        active
          ? 'border-[var(--pg-accent-purple)]/65 bg-primary/15 text-foreground'
          : 'border-[var(--pg-border-soft)] bg-background/35 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function AdapterCard({
  active,
  onToggle,
  tool,
}: {
  active: boolean;
  onToggle: () => void;
  tool: (typeof EXECUTOR_TOOLS)[number];
}) {
  const toneClass = {
    amber: 'text-[var(--pg-accent-amber)] bg-[var(--pg-accent-amber)]/12',
    blue: 'text-[var(--pg-accent-blue)] bg-[var(--pg-accent-blue)]/12',
    cyan: 'text-[var(--pg-accent-cyan)] bg-[var(--pg-accent-cyan)]/12',
    green: 'text-[var(--pg-accent-green)] bg-[var(--pg-accent-green)]/12',
    purple: 'text-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/12',
  }[tool.accent];

  return (
    <article className={`rounded-lg border bg-background/35 p-4 ${active ? 'border-[var(--pg-accent-purple)]/65' : 'border-[var(--pg-border-soft)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex size-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Bot className="size-4" />
        </span>
        <Badge variant={active ? 'green' : 'outline'}>{active ? 'Enabled' : 'Optional'}</Badge>
      </div>
      <h2 className="mt-3 text-sm font-semibold">{tool.label}</h2>
      <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{tool.detail}</p>
      <Button variant={active ? 'secondary' : 'outline'} size="sm" className="mt-3 w-full" onClick={onToggle}>
        {active ? 'Disable' : 'Enable'}
      </Button>
    </article>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function PrivacyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReadOnlySetting({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'amber' | 'blue' | 'cyan' | 'green' | 'purple';
  value: string;
}) {
  const toneClass = {
    amber: 'text-[var(--pg-accent-amber)]',
    blue: 'text-[var(--pg-accent-blue)]',
    cyan: 'text-[var(--pg-accent-cyan)]',
    green: 'text-[var(--pg-accent-green)]',
    purple: 'text-[var(--pg-accent-purple)]',
  }[tone];

  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-4">
      <div className={`mb-3 ${toneClass}`}>{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function StorageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pg-text-faint)]">{label}</p>
      <p className="mt-1 break-all text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function IntegrationCard({ active = false, detail, title }: { active?: boolean; detail: string; title: string }) {
  return (
    <article className="rounded-lg border border-[var(--pg-border-soft)] bg-background/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant={active ? 'green' : 'outline'}>{active ? 'Local' : 'Paused'}</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </article>
  );
}
