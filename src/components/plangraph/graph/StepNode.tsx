'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { Step } from '@/core/types';
import { cn } from '@/lib/utils';

export interface StepNodeData {
  step: Step;
  locale: 'en' | 'ar';
}

const TYPE_COLORS: Record<Step['type'], { accent: string; badge: string; glow: string }> = {
  planning: {
    accent: 'var(--pg-accent-purple)',
    badge: 'bg-[var(--pg-accent-purple)]/12 text-[var(--pg-accent-purple)] ring-[var(--pg-accent-purple)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.56_0.22_292_/_16%)]',
  },
  setup: {
    accent: 'var(--pg-accent-blue)',
    badge: 'bg-[var(--pg-accent-blue)]/12 text-[var(--pg-accent-blue)] ring-[var(--pg-accent-blue)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.58_0.18_255_/_14%)]',
  },
  implementation: {
    accent: 'var(--pg-accent-green)',
    badge: 'bg-[var(--pg-accent-green)]/12 text-[var(--pg-accent-green)] ring-[var(--pg-accent-green)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.66_0.16_150_/_14%)]',
  },
  integration: {
    accent: 'var(--pg-accent-cyan)',
    badge: 'bg-[var(--pg-accent-cyan)]/12 text-[var(--pg-accent-cyan)] ring-[var(--pg-accent-cyan)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.68_0.14_210_/_14%)]',
  },
  verification: {
    accent: 'var(--pg-accent-amber)',
    badge: 'bg-[var(--pg-accent-amber)]/12 text-[var(--pg-accent-amber)] ring-[var(--pg-accent-amber)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.76_0.16_78_/_13%)]',
  },
  delivery: {
    accent: 'var(--pg-accent-blue)',
    badge: 'bg-[var(--pg-accent-blue)]/12 text-[var(--pg-accent-blue)] ring-[var(--pg-accent-blue)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.58_0.18_255_/_14%)]',
  },
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
      className={cn(
        'w-[220px] min-h-[88px] cursor-pointer rounded-lg border bg-[var(--pg-surface-glass)] px-3 py-2.5',
        'flex flex-col gap-2 border-[var(--pg-border-soft)] backdrop-blur-md transition-colors',
        'hover:border-[var(--pg-border-strong)] hover:bg-background/55',
        typeColor.glow,
        selected && 'border-primary/70 ring-2 ring-primary/55 ring-offset-2 ring-offset-[var(--pg-surface-0)]',
      )}
      style={{ borderTopColor: typeColor.accent }}
      aria-label={`Step ${numPrefix || step.id}: ${step.title}, status ${step.status}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)]"
        style={{ background: typeColor.accent }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)]"
        style={{ background: typeColor.accent }}
      />

      <div className="flex items-center justify-between gap-2">
        {numPrefix && (
          <span className="shrink-0 rounded-md bg-background/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--pg-text-faint)]">
            {numPrefix}
          </span>
        )}
        <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize ring-1', typeColor.badge)}>
          {step.type}
        </span>
        <span className={cn('ml-auto h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background/70', statusDot)} />
      </div>

      <p className="line-clamp-2 text-xs font-semibold leading-snug text-card-foreground">
        {step.title}
      </p>
      <p className="text-[10px] font-medium capitalize text-[var(--pg-text-faint)]">
        {step.status.replace(/_/g, ' ')}
      </p>
    </div>
  );
}

export default memo(StepNode);
