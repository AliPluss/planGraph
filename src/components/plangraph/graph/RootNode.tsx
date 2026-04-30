'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Crown, FileText } from 'lucide-react';

export interface RootNodeData {
  name: string;
  idea: string;
}

function RootNode({ data }: NodeProps<RootNodeData>) {
  return (
    <div className="w-[300px] rounded-xl border border-[var(--pg-accent-purple)]/60 bg-[linear-gradient(135deg,oklch(0.27_0.065_292_/_0.94),oklch(0.15_0.03_265_/_0.86))] px-4 py-3.5 shadow-[0_22px_70px_oklch(0.56_0.22_292_/_0.22)] backdrop-blur-xl">
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-[var(--pg-surface-0)] !bg-[var(--pg-accent-purple)]"
      />
      <div className="flex items-start gap-3 text-start">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--pg-accent-purple)]/55 bg-[var(--pg-accent-purple)]/18 text-[var(--pg-accent-purple)] shadow-[0_0_24px_oklch(0.56_0.22_292_/_0.3)]">
          <Crown className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--pg-accent-purple)]">
              ROOT
            </div>
            <span className="rounded-md bg-[var(--pg-accent-purple)]/16 px-2 py-0.5 text-[10px] font-semibold text-[var(--pg-accent-purple)]">
              Project
            </span>
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{data.name}</div>
          <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--pg-text-faint)]">{data.idea}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2 text-[10px] font-medium text-[var(--pg-text-faint)]">
        <FileText className="size-3" />
        Notes
      </div>
    </div>
  );
}

export default memo(RootNode);
