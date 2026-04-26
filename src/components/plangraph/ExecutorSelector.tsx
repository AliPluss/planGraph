'use client';

import { useState } from 'react';
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
  onChange?: (tool: ExecutorTool) => void;
}

export function ExecutorSelector({ projectId, value, onChange }: ExecutorSelectorProps) {
  const [saving, setSaving] = useState(false);

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
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    >
      {(Object.keys(EXECUTOR_LABELS) as ExecutorTool[]).map((tool) => (
        <option key={tool} value={tool}>
          {EXECUTOR_LABELS[tool]}
        </option>
      ))}
    </select>
  );
}
