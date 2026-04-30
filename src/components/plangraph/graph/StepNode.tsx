'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Code2,
  Database,
  FileText,
  Hammer,
  PenTool,
  Rocket,
  Wrench,
} from 'lucide-react';
import type { Step } from '@/core/types';
import { cn } from '@/lib/utils';

export interface StepNodeData {
  step: Step;
  locale: 'en' | 'ar';
}

const TYPE_COLORS: Record<Step['type'], { accent: string; badge: string; glow: string; panel: string }> = {
  planning: {
    accent: 'var(--pg-accent-purple)',
    badge: 'bg-[var(--pg-accent-purple)]/12 text-[var(--pg-accent-purple)] ring-[var(--pg-accent-purple)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.56_0.22_292_/_16%)]',
    panel: 'from-[oklch(0.25_0.06_292_/_0.92)] to-[oklch(0.15_0.03_265_/_0.82)]',
  },
  setup: {
    accent: 'var(--pg-accent-blue)',
    badge: 'bg-[var(--pg-accent-blue)]/12 text-[var(--pg-accent-blue)] ring-[var(--pg-accent-blue)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.58_0.18_255_/_14%)]',
    panel: 'from-[oklch(0.22_0.055_255_/_0.92)] to-[oklch(0.14_0.03_265_/_0.82)]',
  },
  implementation: {
    accent: 'var(--pg-accent-green)',
    badge: 'bg-[var(--pg-accent-green)]/12 text-[var(--pg-accent-green)] ring-[var(--pg-accent-green)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.66_0.16_150_/_14%)]',
    panel: 'from-[oklch(0.22_0.055_150_/_0.9)] to-[oklch(0.14_0.03_265_/_0.82)]',
  },
  integration: {
    accent: 'var(--pg-accent-cyan)',
    badge: 'bg-[var(--pg-accent-cyan)]/12 text-[var(--pg-accent-cyan)] ring-[var(--pg-accent-cyan)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.68_0.14_210_/_14%)]',
    panel: 'from-[oklch(0.22_0.055_210_/_0.9)] to-[oklch(0.14_0.03_265_/_0.82)]',
  },
  verification: {
    accent: 'var(--pg-accent-amber)',
    badge: 'bg-[var(--pg-accent-amber)]/12 text-[var(--pg-accent-amber)] ring-[var(--pg-accent-amber)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.76_0.16_78_/_13%)]',
    panel: 'from-[oklch(0.25_0.055_78_/_0.86)] to-[oklch(0.14_0.03_265_/_0.82)]',
  },
  delivery: {
    accent: 'var(--pg-accent-blue)',
    badge: 'bg-[var(--pg-accent-blue)]/12 text-[var(--pg-accent-blue)] ring-[var(--pg-accent-blue)]/25',
    glow: 'shadow-[0_16px_42px_oklch(0.58_0.18_255_/_14%)]',
    panel: 'from-[oklch(0.22_0.055_255_/_0.9)] to-[oklch(0.14_0.03_265_/_0.82)]',
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

const STATUS_LABELS = {
  en: {
    not_started: 'Not started',
    ready: 'Ready',
    in_progress: 'In progress',
    done: 'Done',
    failed: 'Failed',
    needs_review: 'Review',
    blocked: 'Blocked',
    notes: 'Notes',
  },
  ar: {
    not_started: 'لم يبدأ',
    ready: 'جاهزة',
    in_progress: 'قيد التنفيذ',
    done: 'مكتملة',
    failed: 'فشلت',
    needs_review: 'مراجعة',
    blocked: 'معطلة',
    notes: 'ملاحظات',
  },
};

const TYPE_LABELS = {
  en: {
    planning: 'Plan',
    setup: 'Setup',
    implementation: 'Build',
    integration: 'Integrate',
    verification: 'Verify',
    delivery: 'Deliver',
  },
  ar: {
    planning: 'تخطيط',
    setup: 'إعداد',
    implementation: 'تنفيذ',
    integration: 'دمج',
    verification: 'تحقق',
    delivery: 'تسليم',
  },
};

function StepNode({ data, selected }: NodeProps<StepNodeData>) {
  const { step, locale } = data;
  const typeColor = TYPE_COLORS[step.type] ?? TYPE_COLORS.implementation;
  const statusDot = STATUS_DOT[step.status] ?? 'bg-gray-300';
  const numPrefix = step.id.match(/^(\d+)/)?.[1] ?? '';
  const Icon = iconForStep(step);
  const text = STATUS_LABELS[locale];
  const typeText = TYPE_LABELS[locale][step.type];

  return (
    <div
      className={cn(
        'w-[280px] min-h-[132px] cursor-pointer overflow-hidden rounded-xl border bg-gradient-to-br px-3.5 py-3',
        'flex flex-col gap-3 border-[var(--pg-border-soft)] backdrop-blur-xl transition-all',
        'hover:border-[var(--pg-border-strong)] hover:brightness-110',
        typeColor.panel,
        typeColor.glow,
        selected && 'border-primary/80 ring-2 ring-primary/55 ring-offset-2 ring-offset-[var(--pg-surface-0)] shadow-[0_0_0_1px_oklch(0.56_0.22_292_/_0.28),0_22px_70px_oklch(0.56_0.22_292_/_0.22)]',
      )}
      style={{ borderColor: selected ? typeColor.accent : undefined }}
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

      <div className="flex items-start justify-between gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background/24 shadow-[0_0_22px_currentColor]"
          style={{ color: typeColor.accent, borderColor: typeColor.accent }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold leading-snug text-card-foreground">
              {step.title}
            </p>
            <span className={cn('size-4 shrink-0 rounded-full ring-2 ring-background/70', statusDot)} />
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--pg-text-faint)]">
            {step.goal}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1', typeColor.badge)}>
            {typeText}
          </span>
          <span className="rounded-md border border-white/10 bg-background/25 px-1.5 py-0.5 text-[10px] font-medium text-[var(--pg-text-faint)]">
            {text[step.status]}
          </span>
        </div>
        <span className="shrink-0 rounded-md border border-white/10 bg-background/25 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--pg-text-faint)]">
          {numPrefix ? `ID: ${numPrefix}` : step.id}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--pg-text-faint)]">
        <FileText className="size-3" />
        {text.notes}
      </div>
    </div>
  );
}

function iconForStep(step: Step) {
  const text = `${step.title} ${step.goal}`.toLowerCase();
  if (step.type === 'planning') return ClipboardList;
  if (step.type === 'setup') return Wrench;
  if (step.type === 'integration') return Hammer;
  if (step.type === 'verification') return CheckCircle2;
  if (step.type === 'delivery') return Rocket;
  if (text.includes('data') || text.includes('بيانات')) return Database;
  if (text.includes('research') || text.includes('دراس')) return BookOpen;
  if (text.includes('design') || text.includes('تصميم')) return PenTool;
  if (text.includes('code') || text.includes('كود')) return Code2;
  return Hammer;
}

export default memo(StepNode);
