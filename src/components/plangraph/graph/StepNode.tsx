'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { Step } from '@/core/types';

export interface StepNodeData {
  step: Step;
  locale: 'en' | 'ar';
}

const TYPE_COLORS: Record<Step['type'], { border: string; badge: string }> = {
  planning:       { border: 'border-l-purple-500',  badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  setup:          { border: 'border-l-blue-500',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  implementation: { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  integration:    { border: 'border-l-cyan-500',    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  verification:   { border: 'border-l-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  delivery:       { border: 'border-l-indigo-500',  badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
};

const STATUS_DOT: Record<Step['status'], string> = {
  not_started:  'bg-gray-300',
  ready:        'bg-blue-400',
  in_progress:  'bg-amber-400 animate-pulse',
  done:         'bg-emerald-500',
  failed:       'bg-red-500',
  needs_review: 'bg-orange-400',
  blocked:      'bg-red-400',
};

function StepNode({ data, selected }: NodeProps<StepNodeData>) {
  const { step } = data;
  const typeColor = TYPE_COLORS[step.type] ?? TYPE_COLORS.implementation;
  const statusDot = STATUS_DOT[step.status] ?? 'bg-gray-300';
  const numPrefix = step.id.match(/^(\d+)/)?.[1] ?? '';

  return (
    <div
      className={[
        'w-[220px] min-h-[72px] rounded-lg border border-border bg-card shadow-sm',
        'border-l-4 px-3 py-2.5 flex flex-col gap-1 cursor-pointer',
        typeColor.border,
        selected ? 'ring-2 ring-primary ring-offset-1' : '',
      ].join(' ')}
      aria-label={`Step ${numPrefix || step.id}: ${step.title}, status ${step.status}`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2" />

      <div className="flex items-center justify-between gap-2">
        {numPrefix && (
          <span className="shrink-0 text-[10px] font-mono font-semibold text-muted-foreground">
            {numPrefix}
          </span>
        )}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${typeColor.badge}`}>
          {step.type}
        </span>
        <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
      </div>

      <p className="line-clamp-2 text-xs font-medium leading-tight text-card-foreground">
        {step.title}
      </p>
    </div>
  );
}

export default memo(StepNode);
