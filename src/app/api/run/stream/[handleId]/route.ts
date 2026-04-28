import { getExecutionHandle } from '@/core/adapters/execution-handles';
import { InputSanitizer } from '@/core/security/input-sanitizer';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ handleId: string }> };

const sanitizer = new InputSanitizer();

export async function GET(req: Request, { params }: RouteParams) {
  const { handleId } = await params;
  const handle = getExecutionHandle(handleId);

  if (!handle) {
    return new Response('Handle not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function send(event: string, payload: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      }

      send('state', {
        status: handle.status,
        startedAt: handle.startedAt,
        chunks: handle.chunks.map((chunk) => sanitizer.sanitizeForLog(chunk)),
        tokens: handle.tokens,
        costUsd: handle.costUsd,
      });

      const onChunk = (chunk: string) => send('chunk', sanitizer.sanitizeForLog(chunk));
      const onDone = () => send('done', {
        status: handle.status,
        completedAt: handle.completedAt,
        exitCode: handle.exitCode,
        tokens: handle.tokens,
        costUsd: handle.costUsd,
        error: handle.error ? sanitizer.sanitizeForLog(handle.error) : undefined,
      });

      handle.emitter.on('chunk', onChunk);
      handle.emitter.on('done', onDone);

      req.signal.addEventListener('abort', () => {
        handle.emitter.off('chunk', onChunk);
        handle.emitter.off('done', onDone);
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

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { handleId } = await params;
  const handle = getExecutionHandle(handleId);
  if (!handle) {
    return new Response('Handle not found', { status: 404 });
  }

  await handle.stop();
  return Response.json({ ok: true });
}
