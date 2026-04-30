'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { CheckCircle2, FileText } from 'lucide-react';

export interface DeliveryNodeData {
  percent: number;
  done: number;
  total: number;
}

function DeliveryNode({ data }: NodeProps<DeliveryNodeData>) {
  return (
    <div className="w-[300px] rounded-xl border border-[var(--pg-accent-green)]/55 bg-[linear-gradient(135deg,oklch(0.23_0.055_150_/_0.9),oklch(0.14_0.03_265_/_0.84))] px-4 py-3.5 shadow-[0_22px_70px_oklch(0.66_0.16_150_/_0.18)] backdrop-blur-xl">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)] !bg-[var(--pg-accent-green)]"
      />
      <div className="flex items-start gap-3 text-start">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--pg-accent-green)]/55 bg-[var(--pg-accent-green)]/16 text-[var(--pg-accent-green)] shadow-[0_0_24px_oklch(0.66_0.16_150_/_0.24)]">
          <CheckCircle2 className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">Delivery</div>
          <div className="mt-1 text-[11px] text-[var(--pg-text-faint)]">
            {data.done} / {data.total} complete
          </div>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div className="h-full rounded-full bg-[var(--pg-accent-green)]" style={{ width: `${data.percent}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2 text-[10px] font-medium text-[var(--pg-text-faint)]">
        <FileText className="size-3" />
        Notes
      </div>
    </div>
  );
}

export default memo(DeliveryNode);
