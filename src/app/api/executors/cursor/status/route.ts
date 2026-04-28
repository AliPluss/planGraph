import { NextResponse } from 'next/server';
import { safeCommandRunner } from '@/core/security/command-runner';

export async function GET() {
  try {
    const result = await safeCommandRunner.run('cursor', ['--version'], process.cwd(), {
      timeoutMs: 3000,
    });

    return NextResponse.json({
      ok: true,
      detected: result.exitCode === 0,
      version: result.stdout.trim() || result.stderr.trim(),
    });
  } catch {
    return NextResponse.json({ ok: true, detected: false });
  }
}
