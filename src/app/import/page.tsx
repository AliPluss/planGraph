'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArchiveRestore, CheckCircle2, FolderSearch, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ScanResult } from '@/core/importer/project-scanner';

export default function ImportPage() {
  const router = useRouter();
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ArchiveRestore className="size-5" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Import existing project</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a local folder path. PlanGraph scans metadata only and does not modify that folder.
          </p>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Project folder</CardTitle>
          <CardDescription>
            Use an absolute path such as C:\Users\you\code\my-app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={rootPath}
            onChange={(event) => setRootPath(event.target.value)}
            placeholder="C:\\Users\\you\\code\\my-app"
            className="font-mono text-sm"
          />
          <Button onClick={() => void submitScan()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FolderSearch className="mr-2 size-4" />}
            Scan
          </Button>
        </CardContent>
      </Card>

      {scan && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg">Review scan</CardTitle>
              <CardDescription>{scan.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Fact label="Kind" value={scan.detectedKind} />
                <Fact label="Package manager" value={scan.packageManager ?? 'not detected'} />
                <Fact label="Git" value={scan.hasGit ? 'present' : 'not found'} />
              </div>

              <TokenList title="Stack" items={scan.stack} fallback="No stack markers found" />
              <TokenList title="Already present" items={scan.presentFeatures} fallback="No major features detected" />
              <TokenList title="Remaining candidates" items={scan.missingFeatures} fallback="No obvious gaps found" />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg">Generate plan</CardTitle>
              <CardDescription>Focus the imported plan on what is still missing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
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
