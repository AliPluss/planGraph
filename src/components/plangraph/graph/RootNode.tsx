'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Crown, FileText, Sparkles } from 'lucide-react';

export interface RootNodeData {
  name: string;
  idea: string;
  locale: 'en' | 'ar';
  dimmed?: boolean;
}

function RootNode({ data }: NodeProps<RootNodeData>) {
  const labels = data.locale === 'ar'
    ? { root: 'ROOT', project: 'مشروع', notes: 'ملاحظات', idea: 'الفكرة الرئيسية' }
    : { root: 'ROOT', project: 'Project', notes: 'Notes', idea: 'Main idea' };

  return (
    <div className={`relative w-[340px] cursor-grab overflow-hidden rounded-2xl border border-[oklch(0.68_0.13_292_/_0.38)] bg-[linear-gradient(135deg,oklch(0.21_0.044_292_/_0.95),oklch(0.145_0.032_265_/_0.9))] px-4 py-3.5 text-start shadow-[0_10px_30px_oklch(0.04_0.02_265_/_0.28),inset_0_1px_0_oklch(1_0_0_/_0.07)] backdrop-blur-xl transition active:cursor-grabbing ${data.dimmed ? 'opacity-45 saturate-50' : ''}`}>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)] !bg-[oklch(0.68_0.13_292)]"
      />
      <div className="flex items-start gap-3 text-start">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[oklch(0.68_0.13_292_/_0.34)] bg-[oklch(0.68_0.13_292_/_0.1)] text-[oklch(0.82_0.09_292)] shadow-[0_0_10px_oklch(0.5_0.1_292_/_0.16)]">
          <Crown className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-bold uppercase text-[oklch(0.82_0.09_292)]">
              {labels.root}
            </div>
            <span className="rounded-lg bg-[oklch(0.68_0.13_292_/_0.11)] px-2.5 py-1 text-[11px] font-bold text-[oklch(0.82_0.09_292)] ring-1 ring-[oklch(0.68_0.13_292_/_0.24)]">
              {labels.project}
            </span>
          </div>
          <div className="mt-1.5 line-clamp-1 text-[20px] font-semibold leading-tight text-foreground">{data.name}</div>
          <div className="mt-2 line-clamp-2 text-[13px] leading-5 text-[var(--pg-text-faint)]">{data.idea}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 pt-2">
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-background/20 px-2.5 py-2 text-[11px] font-semibold text-[var(--pg-text-faint)]">
          <Sparkles className="size-4 text-[oklch(0.82_0.09_292)]" />
          <span className="truncate">{labels.idea}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/20 px-2.5 py-2 text-[11px] font-semibold text-[var(--pg-text-faint)]">
          <FileText className="size-4" />
          {labels.notes}
        </div>
      </div>
    </div>
  );
}

export default memo(RootNode);
