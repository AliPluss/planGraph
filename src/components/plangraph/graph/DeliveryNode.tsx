'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface DeliveryNodeData {
  percent: number;
  done: number;
  total: number;
}

function DeliveryNode({ data }: NodeProps<DeliveryNodeData>) {
  return (
    <div className="w-[260px] rounded-lg border border-[var(--pg-accent-green)]/35 bg-[var(--pg-accent-green)]/10 px-4 py-3 text-center shadow-[0_18px_48px_oklch(0.66_0.16_150_/_15%)] backdrop-blur-md">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)] !bg-[var(--pg-accent-green)]"
      />
      <div className="text-sm font-semibold text-foreground">Delivery</div>
      <div className="mt-1 text-[11px] text-[var(--pg-text-faint)]">
        {data.done} / {data.total} complete
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div className="h-full rounded-full bg-[var(--pg-accent-green)]" style={{ width: `${data.percent}%` }} />
      </div>
    </div>
  );
}

export default memo(DeliveryNode);
