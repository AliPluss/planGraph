'use client';

import { useEffect, useState } from 'react';
import { GitCompareArrows, GitBranch, Loader2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { cn } from '@/lib/utils';

interface SnapshotEntry {
  tag: string;
  date: string;
  subject: string;
}

interface SnapshotPanelProps {
  projectId: string;
  projectName: string;
  autoSnapshot: boolean;
}

export function SnapshotPanel({ projectId, projectName, autoSnapshot }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [enabled, setEnabled] = useState(autoSnapshot);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<{ tag: string; text: string } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [rollbackTag, setRollbackTag] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const selectedSnapshot = snapshots.find((snapshot) => snapshot.tag === selectedTag) ?? snapshots[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/projects/${projectId}/snapshots`)
      .then((res) => res.json() as Promise<{ data?: SnapshotEntry[]; error?: string }>)
      .then((json) => {
        if (cancelled) return;
        if (json.data) {
          setSnapshots(json.data);
          setSelectedTag((current) => current ?? json.data?.[0]?.tag ?? null);
        }
        if (json.error) setError(json.error);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  async function toggleAutoSnapshot(next: boolean) {
    setEnabled(next);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoSnapshot: next }),
    });
    const json = await res.json() as { error?: string };
    if (json.error) {
      setEnabled(!next);
      setError(json.error);
    }
  }

  async function loadDiff(tag: string) {
    setSelectedTag(tag);
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });
      const json = await res.json() as { data?: { diff: string }; error?: string };
      if (json.error) setError(json.error);
      if (json.data) setDiff({ tag, text: json.data.diff });
    } finally {
      setWorking(false);
    }
  }

  async function rollback() {
    if (!rollbackTag || confirmation !== projectName) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshots/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: rollbackTag, projectName: confirmation }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (json.error) {
        setError(json.error);
        return;
      }
      window.location.reload();
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader className="mb-0 flex-col md:flex-row md:items-center">
          <div>
            <PanelTitle>Snapshot timeline</PanelTitle>
            <PanelDescription>
              PlanGraph creates a git tag before each step starts so you can inspect or restore project changes.
            </PanelDescription>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => void toggleAutoSnapshot(event.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            Auto-snapshot before each step
          </label>
        </PanelHeader>
      </Panel>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Captured states</PanelTitle>
              <PanelDescription>Use the latest safe state as a reference before comparing or restoring.</PanelDescription>
            </div>
            <Badge variant="secondary">{snapshots.length} total</Badge>
          </PanelHeader>
          <PanelContent>
            {loading ? (
              <div className="flex items-center gap-2 rounded-md border border-[var(--pg-border-soft)] px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading snapshots
              </div>
            ) : snapshots.length === 0 ? (
              <div className="flex items-start gap-3 rounded-md border border-[var(--pg-border-soft)] px-4 py-6 text-sm text-muted-foreground">
                <GitBranch className="mt-0.5 size-4" />
                No snapshots yet. Start a step with auto-snapshot enabled to create the first tag.
              </div>
            ) : (
              <ol className="relative space-y-3 border-s border-[var(--pg-border-soft)] ps-4">
                {snapshots.map((snapshot, index) => {
                  const selected = selectedSnapshot?.tag === snapshot.tag;

                  return (
                    <li key={snapshot.tag} className="relative">
                      <span
                        className={cn(
                          'absolute -start-[21px] top-4 size-2.5 rounded-full border border-background bg-muted-foreground',
                          selected && 'bg-primary ring-4 ring-primary/20',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedTag(snapshot.tag)}
                        className={cn(
                          'w-full rounded-md border border-[var(--pg-border-soft)] bg-muted/20 p-3 text-left transition-colors hover:border-[var(--pg-border-strong)]',
                          selected && 'border-primary/60 bg-primary/10',
                        )}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-mono text-sm">{snapshot.tag}</p>
                              {index === 0 && <Badge variant="outline">Latest</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(snapshot.date).toLocaleString()} · {snapshot.subject}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">Select</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </PanelContent>
        </Panel>

        <Panel tone="muted">
          <PanelHeader>
            <div>
              <PanelTitle>Compare and restore</PanelTitle>
              <PanelDescription>Review the selected snapshot before choosing a destructive restore action.</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            {selectedSnapshot ? (
              <>
                <div className="rounded-md border border-[var(--pg-border-soft)] bg-background/30 p-3">
                  <p className="break-all font-mono text-sm">{selectedSnapshot.tag}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(selectedSnapshot.date).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedSnapshot.subject}</p>
                </div>
                <div className="grid gap-2">
                  <Button variant="outline" onClick={() => void loadDiff(selectedSnapshot.tag)} disabled={working}>
                    {working ? <Loader2 className="size-4 animate-spin" /> : <GitCompareArrows className="size-4" />}
                    Compare with HEAD
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setRollbackTag(selectedSnapshot.tag);
                      setConfirmation('');
                    }}
                    disabled={working}
                  >
                    <RotateCcw className="size-4" />
                    Restore this snapshot
                  </Button>
                </div>
                {diff?.tag === selectedSnapshot.tag && (
                  <pre className="max-h-64 overflow-auto rounded-md border border-[var(--pg-border-soft)] bg-background/40 p-3 text-xs whitespace-pre-wrap">
                    {diff.text || 'No differences reported.'}
                  </pre>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-md border border-[var(--pg-border-soft)] p-3 text-sm text-muted-foreground">
                <GitBranch className="mt-0.5 size-4" />
                Select a snapshot to compare or restore.
              </div>
            )}
          </PanelContent>
        </Panel>
      </div>

      <Dialog open={rollbackTag !== null} onOpenChange={(open) => !open && setRollbackTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback to snapshot</DialogTitle>
            <DialogDescription>
              This will discard all changes since the snapshot. Uncommitted work will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted-foreground">{rollbackTag}</p>
            <label className="block text-sm font-medium">
              Type the project name to confirm
            </label>
            <Textarea
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              rows={2}
              placeholder={projectName}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackTag(null)} disabled={working}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void rollback()}
              disabled={working || confirmation !== projectName}
            >
              {working ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
