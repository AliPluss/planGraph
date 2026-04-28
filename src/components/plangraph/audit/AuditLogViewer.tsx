'use client';

import { useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuditEntry } from '@/core/types';

interface AuditLogViewerProps {
  entries: AuditEntry[];
}

const ALL = '__all__';

export function AuditLogViewer({ entries }: AuditLogViewerProps) {
  const [action, setAction] = useState(ALL);
  const [step, setStep] = useState('');

  const actions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.action))).sort(),
    [entries],
  );

  const filtered = entries.filter((entry) => {
    const actionMatches = action === ALL || entry.action === action;
    const stepMatches = !step.trim() || entry.stepId?.toLowerCase().includes(step.trim().toLowerCase());
    return actionMatches && stepMatches;
  });

  function exportJson() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'audit-log.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Audit log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Most recent events first. Large logs are read from the tail only.
          </p>
        </div>
        <Button variant="outline" onClick={exportJson}>
          <Download className="size-4" />
          Export as JSON
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center">
        <Filter className="hidden size-4 text-muted-foreground md:block" />
        <Select value={action} onValueChange={(value) => setAction(value ?? ALL)}>
          <SelectTrigger className="md:w-64">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {actions.map((item) => (
              <SelectItem key={item} value={item}>
                {item.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={step}
          onChange={(event) => setStep(event.target.value)}
          placeholder="Filter by step id"
          className="md:max-w-xs"
        />
      </div>

      <div className="rounded-lg border">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">No audit entries match the current filters.</p>
        ) : (
          <ol className="divide-y">
            {filtered.map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`} className="px-4 py-3">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</span>
                    {entry.stepId && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {entry.stepId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.details && (
                  <pre className="mt-2 max-h-36 overflow-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
