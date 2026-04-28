'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Loader2, RotateCcw } from 'lucide-react';
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
  const [rollbackTag, setRollbackTag] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/projects/${projectId}/snapshots`)
      .then((res) => res.json() as Promise<{ data?: SnapshotEntry[]; error?: string }>)
      .then((json) => {
        if (cancelled) return;
        if (json.data) setSnapshots(json.data);
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
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Snapshots</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PlanGraph creates a git tag before each step starts so you can inspect or roll back project changes.
          </p>
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
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading snapshots
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex items-start gap-3 px-4 py-6 text-sm text-muted-foreground">
            <GitBranch className="mt-0.5 size-4" />
            No snapshots yet. Start a step with auto-snapshot enabled to create the first tag.
          </div>
        ) : (
          <div className="divide-y">
            {snapshots.map((snapshot) => (
              <div key={snapshot.tag} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{snapshot.tag}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(snapshot.date).toLocaleString()} · {snapshot.subject}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => void loadDiff(snapshot.tag)} disabled={working}>
                    Diff vs HEAD
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRollbackTag(snapshot.tag);
                      setConfirmation('');
                    }}
                    disabled={working}
                  >
                    <RotateCcw className="size-3.5" />
                    Rollback to here
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={diff !== null} onOpenChange={(open) => !open && setDiff(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Diff vs HEAD</DialogTitle>
            <DialogDescription>{diff?.tag}</DialogDescription>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
            {diff?.text}
          </pre>
        </DialogContent>
      </Dialog>

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
