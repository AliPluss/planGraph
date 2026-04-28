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
    <div className="w-[260px] rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-center shadow-sm">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />
      <div className="text-sm font-semibold">Delivery</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {data.done} / {data.total} complete
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${data.percent}%` }} />
      </div>
    </div>
  );
}

export default memo(DeliveryNode);
