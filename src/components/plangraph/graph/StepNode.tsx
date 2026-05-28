'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Code2,
  Database,
  Eye,
  FileText,
  Hammer,
  Layers3,
  PenTool,
  Rocket,
  Star,
  Wrench,
} from 'lucide-react';
import type { Step } from '@/core/types';
import { cn } from '@/lib/utils';

export interface StepNodeData {
  step: Step;
  locale: 'en' | 'ar';
  dimmed?: boolean;
}

export type StepVisualRole =
  | 'data'
  | 'research'
  | 'analysis'
  | 'design'
  | 'tool'
  | 'execution'
  | 'evaluation'
  | 'delivery'
  | 'planning';

interface StepVisual {
  role: StepVisualRole;
  accent: string;
  badge: string;
  glow: string;
  panel: string;
  minimap: string;
  rail: string;
  connector: string;
}

const ROLE_VISUALS: Record<StepVisualRole, StepVisual> = {
  planning: {
    role: 'planning',
    accent: 'oklch(0.68 0.13 292)',
    badge: 'bg-[oklch(0.68_0.13_292_/_0.12)] text-[oklch(0.82_0.09_292)] ring-[oklch(0.68_0.13_292_/_0.24)]',
    glow: 'shadow-[0_16px_44px_oklch(0.48_0.12_292_/_12%)]',
    panel: 'from-[oklch(0.22_0.046_292_/_0.96)] via-[oklch(0.17_0.036_286_/_0.92)] to-[oklch(0.115_0.028_265_/_0.9)]',
    minimap: 'oklch(0.68 0.13 292)',
    rail: 'border-[oklch(0.68_0.13_292_/_0.34)] bg-[oklch(0.68_0.13_292_/_0.1)] text-[oklch(0.82_0.09_292)]',
    connector: 'oklch(0.68 0.13 292)',
  },
  data: {
    role: 'data',
    accent: 'oklch(0.69 0.11 150)',
    badge: 'bg-[oklch(0.69_0.11_150_/_0.12)] text-[oklch(0.8_0.08_150)] ring-[oklch(0.69_0.11_150_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.56_0.1_150_/_10%)]',
    panel: 'from-[oklch(0.2_0.042_150_/_0.94)] via-[oklch(0.155_0.034_155_/_0.9)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.69 0.11 150)',
    rail: 'border-[oklch(0.69_0.11_150_/_0.32)] bg-[oklch(0.69_0.11_150_/_0.1)] text-[oklch(0.8_0.08_150)]',
    connector: 'oklch(0.69 0.11 150)',
  },
  research: {
    role: 'research',
    accent: 'oklch(0.65 0.12 255)',
    badge: 'bg-[oklch(0.65_0.12_255_/_0.12)] text-[oklch(0.78_0.09_255)] ring-[oklch(0.65_0.12_255_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.52_0.11_255_/_10%)]',
    panel: 'from-[oklch(0.2_0.044_255_/_0.94)] via-[oklch(0.155_0.038_255_/_0.9)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.65 0.12 255)',
    rail: 'border-[oklch(0.65_0.12_255_/_0.32)] bg-[oklch(0.65_0.12_255_/_0.1)] text-[oklch(0.78_0.09_255)]',
    connector: 'oklch(0.65 0.12 255)',
  },
  analysis: {
    role: 'analysis',
    accent: 'oklch(0.76 0.1 70)',
    badge: 'bg-[oklch(0.76_0.1_70_/_0.12)] text-[oklch(0.84_0.08_70)] ring-[oklch(0.76_0.1_70_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.62_0.09_70_/_10%)]',
    panel: 'from-[oklch(0.205_0.04_70_/_0.93)] via-[oklch(0.16_0.034_70_/_0.89)] to-[oklch(0.11_0.028_265_/_0.87)]',
    minimap: 'oklch(0.76 0.1 70)',
    rail: 'border-[oklch(0.76_0.1_70_/_0.32)] bg-[oklch(0.76_0.1_70_/_0.1)] text-[oklch(0.84_0.08_70)]',
    connector: 'oklch(0.76 0.1 70)',
  },
  design: {
    role: 'design',
    accent: 'oklch(0.7 0.12 307)',
    badge: 'bg-[oklch(0.7_0.12_307_/_0.12)] text-[oklch(0.81_0.09_307)] ring-[oklch(0.7_0.12_307_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.55_0.11_305_/_10%)]',
    panel: 'from-[oklch(0.21_0.044_307_/_0.94)] via-[oklch(0.16_0.036_292_/_0.9)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.7 0.12 307)',
    rail: 'border-[oklch(0.7_0.12_307_/_0.32)] bg-[oklch(0.7_0.12_307_/_0.1)] text-[oklch(0.81_0.09_307)]',
    connector: 'oklch(0.7 0.12 307)',
  },
  tool: {
    role: 'tool',
    accent: 'oklch(0.71 0.09 205)',
    badge: 'bg-[oklch(0.71_0.09_205_/_0.12)] text-[oklch(0.82_0.07_205)] ring-[oklch(0.71_0.09_205_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.56_0.08_210_/_10%)]',
    panel: 'from-[oklch(0.195_0.042_205_/_0.94)] via-[oklch(0.15_0.034_220_/_0.9)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.71 0.09 205)',
    rail: 'border-[oklch(0.71_0.09_205_/_0.32)] bg-[oklch(0.71_0.09_205_/_0.1)] text-[oklch(0.82_0.07_205)]',
    connector: 'oklch(0.71 0.09 205)',
  },
  execution: {
    role: 'execution',
    accent: 'oklch(0.76 0.1 185)',
    badge: 'bg-[oklch(0.76_0.1_185_/_0.12)] text-[oklch(0.84_0.08_185)] ring-[oklch(0.76_0.1_185_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.62_0.09_185_/_10%)]',
    panel: 'from-[oklch(0.195_0.042_185_/_0.93)] via-[oklch(0.15_0.036_198_/_0.9)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.76 0.1 185)',
    rail: 'border-[oklch(0.76_0.1_185_/_0.32)] bg-[oklch(0.76_0.1_185_/_0.1)] text-[oklch(0.84_0.08_185)]',
    connector: 'oklch(0.76 0.1 185)',
  },
  evaluation: {
    role: 'evaluation',
    accent: 'oklch(0.69 0.12 340)',
    badge: 'bg-[oklch(0.69_0.12_340_/_0.12)] text-[oklch(0.81_0.09_340)] ring-[oklch(0.69_0.12_340_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.55_0.11_340_/_10%)]',
    panel: 'from-[oklch(0.2_0.042_340_/_0.93)] via-[oklch(0.155_0.034_340_/_0.89)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.69 0.12 340)',
    rail: 'border-[oklch(0.69_0.12_340_/_0.32)] bg-[oklch(0.69_0.12_340_/_0.1)] text-[oklch(0.81_0.09_340)]',
    connector: 'oklch(0.69 0.12 340)',
  },
  delivery: {
    role: 'delivery',
    accent: 'oklch(0.69 0.11 145)',
    badge: 'bg-[oklch(0.69_0.11_145_/_0.12)] text-[oklch(0.8_0.08_145)] ring-[oklch(0.69_0.11_145_/_0.22)]',
    glow: 'shadow-[0_16px_44px_oklch(0.56_0.1_150_/_10%)]',
    panel: 'from-[oklch(0.2_0.04_145_/_0.94)] via-[oklch(0.155_0.034_150_/_0.9)] to-[oklch(0.11_0.028_265_/_0.88)]',
    minimap: 'oklch(0.69 0.11 145)',
    rail: 'border-[oklch(0.69_0.11_145_/_0.32)] bg-[oklch(0.69_0.11_145_/_0.1)] text-[oklch(0.8_0.08_145)]',
    connector: 'oklch(0.69 0.11 145)',
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

const ROLE_LABELS = {
  en: {
    planning: 'Idea',
    data: 'Data',
    research: 'Research',
    analysis: 'Analysis',
    design: 'Design',
    tool: 'Tools',
    execution: 'Execute',
    evaluation: 'Review',
    delivery: 'Deliver',
  },
  ar: {
    planning: 'فكرة',
    data: 'بيانات',
    research: 'بحث',
    analysis: 'تحليل',
    design: 'تصميم',
    tool: 'أدوات',
    execution: 'تنفيذ',
    evaluation: 'مراجعة',
    delivery: 'تسليم',
  },
};

function StepNode({ data, selected }: NodeProps<StepNodeData>) {
  const { step, locale } = data;
  const typeColor = getStepVisual(step);
  const statusDot = STATUS_DOT[step.status] ?? 'bg-gray-300';
  const numPrefix = step.id.match(/^(\d+)/)?.[1] ?? '';
  const stepIcon = renderStepIcon(step, 'size-8', 2.15);
  const text = STATUS_LABELS[locale];
  const typeText = TYPE_LABELS[locale][step.type];
  const roleText = ROLE_LABELS[locale][typeColor.role];

  return (
    <div
      className={cn(
        'relative w-[320px] min-h-[152px] cursor-grab overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-3.5 active:cursor-grabbing',
        'flex flex-col gap-3 border-white/12 backdrop-blur-xl transition-all duration-150',
        'hover:border-white/20 hover:brightness-[1.03]',
        'shadow-[0_10px_28px_oklch(0.03_0.02_265_/_0.22),inset_0_1px_0_oklch(1_0_0_/_0.05)]',
        typeColor.panel,
        data.dimmed && 'opacity-35 saturate-50',
        selected && 'ring-2 ring-offset-2 ring-offset-[var(--pg-surface-0)]',
      )}
      style={{
        borderColor: selected ? typeColor.accent : undefined,
        boxShadow: selected
          ? `0 0 0 1px ${typeColor.accent}, 0 0 0 5px color-mix(in oklch, ${typeColor.accent} 9%, transparent), 0 18px 46px color-mix(in oklch, ${typeColor.accent} 16%, transparent)`
          : undefined,
      }}
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

      <div className="relative z-[1] flex items-start justify-between gap-4 text-start">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background/24 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.08),0_0_10px_currentColor]"
          style={{ color: typeColor.accent, borderColor: `color-mix(in oklch, ${typeColor.accent} 42%, transparent)` }}
        >
          {stepIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-1 text-[15px] font-semibold leading-tight text-card-foreground">
              {step.title}
            </p>
            <span className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: typeColor.accent, borderColor: `color-mix(in oklch, ${typeColor.accent} 36%, transparent)`, background: `color-mix(in oklch, ${typeColor.accent} 10%, transparent)` }}>
              {roleText}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-4 text-[var(--pg-text-faint)]">
            {step.goal}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/30 px-2 py-1 text-[11px] font-semibold text-[var(--pg-text-faint)]">
              <span className={cn('size-2 rounded-full ring-2 ring-background/70', statusDot)} />
              {text[step.status]}
            </span>
            <span className="rounded-lg border border-white/10 bg-background/30 px-2 py-1 font-mono text-[10px] font-semibold text-[var(--pg-text-faint)]">
              {numPrefix ? `ID: N-${numPrefix.padStart(3, '0')}` : step.id}
            </span>
            <span className="rounded-lg border border-white/10 bg-background/30 px-2 py-1 text-[10px] font-semibold text-[var(--pg-text-faint)]">
              {typeText}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-[1] mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px] font-semibold text-[var(--pg-text-faint)]">
        <span className="inline-flex items-center gap-2">
          <FileText className="size-3.5" />
          {text.notes}
        </span>
        <span>{step.dependsOn.length} {locale === 'ar' ? 'اعتماد' : 'deps'}</span>
      </div>
    </div>
  );
}

export function getStepVisual(step: Step): StepVisual {
  const role = inferStepRole(step);
  return ROLE_VISUALS[role];
}

export function getRoleVisual(role: StepVisualRole): StepVisual {
  return ROLE_VISUALS[role];
}

export function getStepRoleIcon(role: StepVisualRole) {
  const map = {
    planning: ClipboardList,
    data: Database,
    research: BookOpen,
    analysis: BarChart3,
    design: PenTool,
    tool: Wrench,
    execution: Rocket,
    evaluation: Eye,
    delivery: CheckCircle2,
  } satisfies Record<StepVisualRole, typeof ClipboardList>;
  return map[role];
}

function inferStepRole(step: Step): StepVisualRole {
  const text = `${step.type} ${step.title} ${step.goal}`.toLowerCase();
  if (step.type === 'planning') return 'planning';
  if (step.type === 'delivery') return 'delivery';
  if (step.type === 'verification') return 'evaluation';
  if (text.includes('data') || text.includes('بيانات')) return 'data';
  if (text.includes('research') || text.includes('study') || text.includes('دراس') || text.includes('بحث')) return 'research';
  if (text.includes('analysis') || text.includes('analy') || text.includes('تحليل')) return 'analysis';
  if (text.includes('design') || text.includes('تصميم')) return 'design';
  if (text.includes('tool') || text.includes('setup') || text.includes('file') || text.includes('github') || text.includes('أدوات') || text.includes('تهيئة')) return 'tool';
  if (text.includes('execute') || text.includes('run') || text.includes('build') || text.includes('implement') || text.includes('تنفيذ') || text.includes('بناء')) return 'execution';
  return step.type === 'setup' || step.type === 'integration' ? 'tool' : 'execution';
}

function renderStepIcon(step: Step, className: string, strokeWidth: number) {
  const text = `${step.title} ${step.goal}`.toLowerCase();
  const role = inferStepRole(step);
  if (role === 'planning') return <Star className={className} strokeWidth={strokeWidth} />;
  if (role === 'research') return <BookOpen className={className} strokeWidth={strokeWidth} />;
  if (text.includes('code') || text.includes('كود')) return <Code2 className={className} strokeWidth={strokeWidth} />;
  if (role === 'delivery') return <Rocket className={className} strokeWidth={strokeWidth} />;
  if (role === 'execution') return <Hammer className={className} strokeWidth={strokeWidth} />;
  if (role === 'tool') return <Layers3 className={className} strokeWidth={strokeWidth} />;
  if (role === 'data') return <Database className={className} strokeWidth={strokeWidth} />;
  if (role === 'analysis') return <BarChart3 className={className} strokeWidth={strokeWidth} />;
  if (role === 'design') return <PenTool className={className} strokeWidth={strokeWidth} />;
  if (role === 'evaluation') return <Eye className={className} strokeWidth={strokeWidth} />;
  return <CheckCircle2 className={className} strokeWidth={strokeWidth} />;
}

export default memo(StepNode);
