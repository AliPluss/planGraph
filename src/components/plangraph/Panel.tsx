import * as React from 'react';

import { cn } from '@/lib/utils';

type PanelProps = React.ComponentProps<'section'> & {
  tone?: 'glass' | 'muted';
};

function Panel({ className, tone = 'glass', ...props }: PanelProps) {
  return (
    <section
      data-slot="plangraph-panel"
      data-tone={tone}
      className={cn(tone === 'glass' ? 'pg-panel' : 'pg-panel-muted', 'p-4', className)}
      {...props}
    />
  );
}

function PanelHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="plangraph-panel-header"
      className={cn('mb-4 flex items-start justify-between gap-3', className)}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="plangraph-panel-title"
      className={cn('text-base font-medium leading-snug text-foreground', className)}
      {...props}
    />
  );
}

function PanelDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="plangraph-panel-description"
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  );
}

function PanelContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="plangraph-panel-content" className={cn('space-y-4', className)} {...props} />;
}

export { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle };
