'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface RootNodeData {
  name: string;
  idea: string;
}

function RootNode({ data }: NodeProps<RootNodeData>) {
  return (
    <div className="w-[260px] rounded-lg border border-[var(--pg-accent-purple)]/35 bg-[var(--pg-accent-purple)]/10 px-4 py-3 text-center shadow-[0_18px_48px_oklch(0.56_0.22_292_/_16%)] backdrop-blur-md">
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)] !bg-[var(--pg-accent-purple)]"
      />
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pg-accent-purple)]">
        Project Idea
      </div>
      <div className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{data.name}</div>
      <div className="mt-1 line-clamp-1 text-[11px] text-[var(--pg-text-faint)]">{data.idea}</div>
    </div>
  );
}

export default memo(RootNode);
