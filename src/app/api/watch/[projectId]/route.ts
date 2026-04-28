import { ReportWatcher } from '@/core/adapters/report-watcher';
import { getProjectDir } from '@/core/storage/paths';
import { parseReport } from '@/core/markdown/report-parser';
import type { ReportSummary } from '@/core/types';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { projectId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      const watcher = new ReportWatcher(projectId, getProjectDir(projectId));
      void watcher.start((stepId, contents) => {
        let reportSummary: ReportSummary | undefined;
        try {
          reportSummary = parseReport(contents);
        } catch {
          reportSummary = undefined;
        }

        const payload = JSON.stringify({ stepId, event: 'report_detected', contents, reportSummary });
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // The client may already have disconnected.
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        void watcher.stop();
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
