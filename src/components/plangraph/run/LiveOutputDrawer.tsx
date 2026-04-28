'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Square } from 'lucide-react';
import { InputSanitizer } from '@/core/security/input-sanitizer';

const sanitizer = new InputSanitizer();

interface LiveOutputDrawerProps {
  handleId: string;
  stepTitle: string;
  onClose: () => void;
}

interface StreamState {
  status?: string;
  chunks?: string[];
  tokens?: { input: number; output: number };
  costUsd?: number;
}

export function LiveOutputDrawer({ handleId, stepTitle, onClose }: LiveOutputDrawerProps) {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('running');
  const [tokens, setTokens] = useState<{ input: number; output: number } | undefined>();
  const [costUsd, setCostUsd] = useState<number | undefined>();
  const [startedAt] = useState(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    const source = new EventSource(`/api/run/stream/${handleId}`);

    source.addEventListener('state', (event) => {
      const state = JSON.parse((event as MessageEvent).data) as StreamState;
      setStatus(state.status ?? 'running');
      setOutput((state.chunks ?? []).join(''));
      setTokens(state.tokens);
      setCostUsd(state.costUsd);
    });

    source.addEventListener('chunk', (event) => {
      setOutput((prev) => prev + sanitizer.sanitizeForLog((event as MessageEvent).data));
    });

    source.addEventListener('done', (event) => {
      const state = JSON.parse((event as MessageEvent).data) as StreamState;
      setStatus(state.status ?? 'completed');
      setTokens(state.tokens);
      setCostUsd(state.costUsd);
      source.close();
    });

    return () => source.close();
  }, [handleId]);

  useEffect(() => {
    preRef.current?.scrollTo({ top: preRef.current.scrollHeight });
  }, [output]);

  async function stopRun() {
    await fetch(`/api/run/stream/${handleId}`, { method: 'DELETE' });
    setStatus('stopped');
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <aside className="flex h-full w-full max-w-2xl flex-col border-l bg-background shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{stepTitle}</h2>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span>{status}</span>
              <span>{Math.round(elapsedMs / 1000)}s</span>
              {tokens && <span>{tokens.input + tokens.output} tokens</span>}
              {costUsd !== undefined && <span>${costUsd.toFixed(4)}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Close live output"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <pre
          ref={preRef}
          className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-100"
        >
          {output || 'Waiting for Claude Code output...'}
        </pre>

        <div className="flex justify-end border-t px-4 py-3">
          <button
            onClick={() => void stopRun()}
            disabled={status !== 'running'}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <Square className="h-3 w-3" />
            Stop
          </button>
        </div>
      </aside>
    </div>
  );
}
