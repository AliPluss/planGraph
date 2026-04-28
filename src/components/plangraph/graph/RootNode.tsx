'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface RootNodeData {
  name: string;
  idea: string;
}

function RootNode({ data }: NodeProps<RootNodeData>) {
  return (
    <div className="w-[260px] rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-center shadow-sm">
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2" />
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Project Idea
      </div>
      <div className="mt-1 line-clamp-2 text-sm font-semibold">{data.name}</div>
      <div className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{data.idea}</div>
    </div>
  );
}

export default memo(RootNode);
