import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { DiscoveryEngine } from '@/core/discovery/rules-engine';

// In-memory session store (per-server-instance; resets on restart)
const sessions = new Map<string, DiscoveryEngine>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action: 'start' | 'step';
      idea?: string;
      sessionId?: string;
      questionId?: string;
      answer?: unknown;
    };

    if (body.action === 'start') {
      if (!body.idea || typeof body.idea !== 'string') {
        return NextResponse.json({ error: 'idea is required' }, { status: 400 });
      }
      const engine = new DiscoveryEngine(body.idea);
      const { sanitizedIdea, detectedKind, firstBatch } = engine.start();
      const sessionId = randomUUID();
      sessions.set(sessionId, engine);

      // Clean up stale sessions (cap at 100)
      if (sessions.size > 100) {
        const oldest = sessions.keys().next().value;
        if (oldest) sessions.delete(oldest);
      }

      return NextResponse.json({ sessionId, sanitizedIdea, detectedKind, questions: firstBatch });
    }

    if (body.action === 'step') {
      const { sessionId, questionId, answer } = body;
      if (!sessionId || !questionId) {
        return NextResponse.json({ error: 'sessionId and questionId are required' }, { status: 400 });
      }
      const engine = sessions.get(sessionId);
      if (!engine) {
        return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
      }
      const result = engine.submit(questionId, answer);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
