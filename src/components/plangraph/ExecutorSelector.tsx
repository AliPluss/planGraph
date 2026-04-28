'use client';

import { useEffect, useState } from 'react';
import type { ExecutorTool } from '@/core/types';

const EXECUTOR_LABELS: Record<ExecutorTool, string> = {
  'claude-code': 'Claude Code',
  cursor:        'Cursor',
  antigravity:   'Antigravity',
  copilot:       'GitHub Copilot',
  manual:        'Manual',
};

interface ExecutorSelectorProps {
  projectId: string;
  value: ExecutorTool;
  activeStepId?: string;
  onChange?: (tool: ExecutorTool) => void;
}

interface PrepareResult {
  instructions: string;
  promptFilePath: string;
  executor: string;
  stepId: string;
}

export function ExecutorSelector({ projectId, value, activeStepId, onChange }: ExecutorSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [cursorMissing, setCursorMissing] = useState(false);

  useEffect(() => {
    if (value !== 'cursor') {
      setCursorMissing(false);
      return;
    }

    let cancelled = false;
    fetch('/api/executors/cursor/status')
      .then((res) => res.json() as Promise<{ detected?: boolean }>)
      .then((json) => {
        if (!cancelled) setCursorMissing(json.detected === false);
      })
      .catch(() => {
        if (!cancelled) setCursorMissing(true);
      });

    return () => { cancelled = true; };
  }, [value]);

  async function prepareExecutor(tool: ExecutorTool) {
    setPreparing(true);
    setPrepareError(null);
    setInstructions(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/executors/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executor: tool, stepId: activeStepId }),
      });
      const json = await res.json() as { data?: PrepareResult; error?: string };
      if (!res.ok || !json.data) {
        setPrepareError(json.error ?? 'Executor setup failed');
        return;
      }
      setInstructions(json.data.instructions);
    } catch (error) {
      setPrepareError(String(error));
    } finally {
      setPreparing(false);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tool = e.target.value as ExecutorTool;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedExecutor: tool }),
      });
      onChange?.(tool);
      await prepareExecutor(tool);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={saving || preparing}
        className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {(Object.keys(EXECUTOR_LABELS) as ExecutorTool[]).map((tool) => (
          <option key={tool} value={tool}>
            {EXECUTOR_LABELS[tool]}
          </option>
        ))}
      </select>

      {(instructions || prepareError || cursorMissing || value === 'antigravity') && (
        <div className="absolute top-9 right-0 z-30 w-80 rounded-md border border-border bg-background p-3 text-[11px] leading-relaxed shadow-lg">
          {preparing && <p className="text-muted-foreground">Preparing executor files...</p>}
          {instructions && <p className="whitespace-pre-wrap text-foreground">{instructions}</p>}
          {prepareError && <p className="text-destructive">{prepareError}</p>}
          {cursorMissing && (
            <p className="mt-2 text-amber-700 dark:text-amber-300">
              Cursor CLI not detected. Install Cursor and ensure the `cursor` command is on PATH.
            </p>
          )}
          {value === 'antigravity' && (
            <p className="mt-2 text-muted-foreground">
              Antigravity detection is not reliable. Open this folder in Antigravity and see https://antigravity.google/ for setup details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
