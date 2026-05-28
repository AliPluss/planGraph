'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { CheckCircle2, FileText, Rocket } from 'lucide-react';

export interface DeliveryNodeData {
  percent: number;
  done: number;
  total: number;
  locale: 'en' | 'ar';
  dimmed?: boolean;
}

function DeliveryNode({ data }: NodeProps<DeliveryNodeData>) {
  const labels = data.locale === 'ar'
    ? { delivery: 'التوثيق والمشاركة', complete: 'مكتملة', notes: 'ملاحظات', output: 'المخرج النهائي' }
    : { delivery: 'Documentation and handoff', complete: 'complete', notes: 'Notes', output: 'Final output' };

  return (
    <div className={`relative w-[340px] cursor-grab overflow-hidden rounded-2xl border border-[oklch(0.69_0.11_145_/_0.38)] bg-[linear-gradient(135deg,oklch(0.19_0.038_145_/_0.94),oklch(0.13_0.03_265_/_0.88))] px-4 py-3.5 text-start shadow-[0_10px_30px_oklch(0.04_0.02_265_/_0.26),inset_0_1px_0_oklch(1_0_0_/_0.06)] backdrop-blur-xl transition active:cursor-grabbing ${data.dimmed ? 'opacity-45 saturate-50' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)] !bg-[oklch(0.69_0.11_145)]"
      />
      <div className="flex items-start gap-3 text-start">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[oklch(0.69_0.11_145_/_0.34)] bg-[oklch(0.69_0.11_145_/_0.1)] text-[oklch(0.8_0.08_145)] shadow-[0_0_10px_oklch(0.56_0.1_150_/_0.14)]">
          <CheckCircle2 className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="line-clamp-1 text-base font-semibold leading-tight text-foreground">{labels.delivery}</div>
            <span className="rounded-lg bg-[oklch(0.69_0.11_145_/_0.11)] px-2.5 py-1 text-[11px] font-bold text-[oklch(0.8_0.08_145)] ring-1 ring-[oklch(0.69_0.11_145_/_0.24)]">
              DELIVERY
            </span>
          </div>
          <div className="mt-2 text-[13px] font-medium text-[var(--pg-text-faint)]">
            {data.done} / {data.total} {labels.complete}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/60 ring-1 ring-white/10">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.62_0.1_145),oklch(0.72_0.08_185))]" style={{ width: `${data.percent}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 pt-2">
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-background/20 px-2.5 py-2 text-[11px] font-semibold text-[var(--pg-text-faint)]">
          <Rocket className="size-4 text-[oklch(0.8_0.08_145)]" />
          <span className="truncate">{labels.output}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/20 px-2.5 py-2 text-[11px] font-semibold text-[var(--pg-text-faint)]">
          <FileText className="size-4" />
          {labels.notes}
        </div>
      </div>
    </div>
  );
}

export default memo(DeliveryNode);
