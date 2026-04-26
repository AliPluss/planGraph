import * as fs from 'fs/promises';
import * as path from 'path';
import chokidar from 'chokidar';
import { getReportsDir } from '@/core/storage/paths';
import { parseReport } from '@/core/markdown/report-parser';
import type { ReportSummary } from '@/core/types';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const reportsDir = getReportsDir(id);

  await fs.mkdir(reportsDir, { recursive: true });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      const watcher = chokidar.watch(reportsDir, {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      });

      watcher.on('add', async (filePath: string) => {
        const fileName = path.basename(filePath);
        const match = fileName.match(/^(.+)_report\.md$/);
        if (!match) return;
        const stepId = match[1];

        let reportSummary: ReportSummary | undefined;
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          reportSummary = parseReport(content);
        } catch { /* ignore read errors — client will still mark step done */ }

        const payload = JSON.stringify({ stepId, event: 'report_detected', reportSummary });
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch { /* stream may already be closed */ }
      });

      watcher.on('error', () => { /* swallow watcher errors */ });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        void watcher.close();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
