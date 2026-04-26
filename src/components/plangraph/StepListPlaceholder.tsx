'use client';

import { Circle, Loader, CheckCircle2, XCircle, AlertCircle, Clock, Ban } from 'lucide-react';
import type { Step, StepStatus } from '@/core/types';

interface StepListPlaceholderProps {
  steps: Step[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
}

const STATUS_ICON: Record<StepStatus, React.ReactNode> = {
  not_started:  <Circle   className="w-4 h-4 text-gray-400" />,
  ready:        <Clock    className="w-4 h-4 text-blue-500" />,
  in_progress:  <Loader   className="w-4 h-4 text-amber-500 animate-spin" />,
  done:         <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  failed:       <XCircle  className="w-4 h-4 text-red-500" />,
  needs_review: <AlertCircle className="w-4 h-4 text-orange-500" />,
  blocked:      <Ban      className="w-4 h-4 text-red-400" />,
};

export function StepListPlaceholder({
  steps,
  selectedStepId,
  onSelectStep,
}: StepListPlaceholderProps) {
  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {steps.map((step, i) => (
        <button
          key={step.id}
          onClick={() => onSelectStep(step.id)}
          className={[
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors w-full',
            selectedStepId === step.id
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted text-foreground',
          ].join(' ')}
          aria-selected={selectedStepId === step.id}
        >
          <span className="shrink-0">{STATUS_ICON[step.status]}</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono text-muted-foreground">Step {i + 1}</span>
            <span className="text-xs font-medium truncate">{step.title}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
