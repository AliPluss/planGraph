import * as fs from 'fs/promises';
import * as path from 'path';
import chokidar from 'chokidar';
import { getReportsDir } from '@/core/storage/paths';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const reportsDir = getReportsDir(id);

  await fs.mkdir(reportsDir, { recursive: true });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send a heartbeat comment immediately so the client knows connection is up
      controller.enqueue(encoder.encode(': connected\n\n'));

      const watcher = chokidar.watch(reportsDir, {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      });

      watcher.on('add', (filePath: string) => {
        const fileName = path.basename(filePath);
        const match = fileName.match(/^(.+)_report\.md$/);
        if (!match) return;
        const stepId = match[1];
        const payload = JSON.stringify({ stepId, event: 'report_detected' });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      });

      watcher.on('error', () => {
        // Swallow watcher errors — don't crash the stream
      });

      // Heartbeat every 25s to keep the connection alive through proxies
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
