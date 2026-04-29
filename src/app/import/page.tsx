'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, CheckCircle2, FileText, FolderSearch, GitBranch, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { cn } from '@/lib/utils';
import type { ScanResult } from '@/core/importer/project-scanner';

type ImportMode = 'folder' | 'zip' | 'git' | 'markdown';

const IMPORT_OPTIONS: Array<{
  mode: ImportMode;
  title: string;
  description: string;
  state: string;
  icon: typeof FolderSearch;
}> = [
  {
    mode: 'folder',
    title: 'Existing folder',
    description: 'Scan a local project path and create a remaining-work plan.',
    state: 'Available',
    icon: FolderSearch,
  },
  {
    mode: 'zip',
    title: 'ZIP archive',
    description: 'Stage a packaged project before scanning it.',
    state: 'UI only',
    icon: Archive,
  },
  {
    mode: 'git',
    title: 'Git repository',
    description: 'Prepare a clone/import flow for repository URLs.',
    state: 'UI only',
    icon: GitBranch,
  },
  {
    mode: 'markdown',
    title: 'Markdown project',
    description: 'Convert an existing plan document into graph work.',
    state: 'UI only',
    icon: FileText,
  },
];

export default function ImportPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>('folder');
  const [rootPath, setRootPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const [remainingWork, setRemainingWork] = useState('');
  const [priority, setPriority] = useState('');
  const [constraints, setConstraints] = useState('');
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function submitScan() {
    if (!rootPath.trim()) {
      toast.error('Paste an absolute folder path first.');
      return;
    }

    if (mode !== 'folder') {
      toast.message('Only existing-folder import is active in MVP 2.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Import scan failed');
      setScan(json.data);
      if (!projectName.trim()) {
        const parts = rootPath.replace(/[\\/]+$/, '').split(/[\\/]/);
        setProjectName(parts.at(-1) ?? 'Imported project');
      }
      setRemainingWork((json.data.missingFeatures ?? []).join(', '));
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!scan) return;
    setCreating(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootPath,
          create: true,
          name: projectName,
          answers: { remainingWork, priority, constraints },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not create imported project');
      toast.success('Imported project plan created');
      router.push(`/project/${json.data.id}`);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ArchiveRestore className="size-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Snapshots and import</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Bring existing work into PlanGraph without changing the source project. MVP 2 keeps import behavior limited to local folder scans.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">Local-first recovery workspace</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {IMPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = mode === option.mode;

          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => setMode(option.mode)}
              className={cn(
                'pg-card flex min-h-36 flex-col items-start gap-3 p-4 text-left transition-colors hover:border-[var(--pg-border-strong)]',
                active && 'border-primary/60 bg-primary/10',
              )}
            >
              <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{option.title}</span>
                  <Badge variant={option.mode === 'folder' ? 'secondary' : 'outline'}>{option.state}</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>{mode === 'folder' ? 'Project folder' : `${IMPORT_OPTIONS.find((option) => option.mode === mode)?.title} import`}</PanelTitle>
            <PanelDescription>
              {mode === 'folder'
                ? 'Use an absolute path such as C:\\Users\\you\\code\\my-app.'
                : 'This import source is represented as an MVP 2 UI state. Existing-folder scan remains the active behavior.'}
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent>
          {mode !== 'folder' && (
            <div className="rounded-lg border border-[var(--pg-accent-amber)]/30 bg-[var(--pg-accent-amber)]/10 px-3 py-2 text-sm text-[var(--pg-accent-amber)]">
              ZIP, Git, and Markdown imports are not wired yet. Switch to Existing folder to scan and create a plan.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={rootPath}
              onChange={(event) => setRootPath(event.target.value)}
              placeholder="C:\\Users\\you\\code\\my-app"
              className="font-mono text-sm"
              disabled={mode !== 'folder'}
            />
            <Button onClick={() => void submitScan()} disabled={loading || mode !== 'folder'}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FolderSearch className="mr-2 size-4" />}
              Scan
            </Button>
          </div>
        </PanelContent>
      </Panel>

      {scan && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Review scan</PanelTitle>
                <PanelDescription>{scan.summary}</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Fact label="Kind" value={scan.detectedKind} />
                <Fact label="Package manager" value={scan.packageManager ?? 'not detected'} />
                <Fact label="Git" value={scan.hasGit ? 'present' : 'not found'} />
              </div>

              <TokenList title="Stack" items={scan.stack} fallback="No stack markers found" />
              <TokenList title="Already present" items={scan.presentFeatures} fallback="No major features detected" />
              <TokenList title="Remaining candidates" items={scan.missingFeatures} fallback="No obvious gaps found" />
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Generate plan</PanelTitle>
                <PanelDescription>Focus the imported plan on what is still missing.</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Project name</span>
                <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">What still needs to be added?</span>
                <Textarea
                  value={remainingWork}
                  onChange={(event) => setRemainingWork(event.target.value)}
                  rows={4}
                  placeholder="tests, CI workflow, auth decision"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Top priority</span>
                <Input
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  placeholder="Ship a stable MVP"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Constraints</span>
                <Textarea
                  value={constraints}
                  onChange={(event) => setConstraints(event.target.value)}
                  rows={3}
                  placeholder="Do not rewrite working modules; preserve current tests"
                />
              </label>
              <Button className="w-full" onClick={() => void createProject()} disabled={creating || !projectName.trim()}>
                {creating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                Create imported plan
              </Button>
            </PanelContent>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--pg-border-soft)] bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function TokenList({ title, items, fallback }: { title: string; items: string[]; fallback: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{fallback}</p>
      )}
    </div>
  );
}
