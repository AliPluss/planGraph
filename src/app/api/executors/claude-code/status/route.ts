import { NextResponse } from 'next/server';
import { safeCommandRunner } from '@/core/security/command-runner';

export async function GET() {
  try {
    const result = await safeCommandRunner.run('claude', ['--version'], process.cwd(), {
      timeoutMs: 5000,
    });
    return NextResponse.json({
      ok: true,
      detected: result.exitCode === 0,
      version: result.stdout.trim() || result.stderr.trim(),
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      detected: false,
      error: String(error),
    });
  }
}
