import type { ReportSummary } from '../types';

export function buildReport(
  stepTitle: string,
  output: string,
  exitCode: number,
  durationMs: number,
): string {
  const ts = new Date().toISOString();
  const statusLine = exitCode === 0 ? '✅ DONE' : `❌ ERROR (exit code ${exitCode})`;
  const trimmedOutput = output.trim() || '(no output)';

  return `# Step Report: ${stepTitle}

**Generated:** ${ts}
**Exit code:** ${exitCode}
**Duration:** ${durationMs}ms
**Executor:** claude-code

## Output

${trimmedOutput}

## Status

${statusLine}
`;
}

export function parseReport(content: string): ReportSummary {
  const exitCodeMatch = content.match(/\*\*Exit code:\*\*\s*(\d+)/);
  const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 0;

  const durationMatch = content.match(/\*\*Duration:\*\*\s*(\d+)ms/);
  const durationMs = durationMatch ? parseInt(durationMatch[1], 10) : 0;

  const status: 'success' | 'error' = exitCode === 0 ? 'success' : 'error';

  const outputMatch = content.match(/## Output\n\n([\s\S]*?)(?:\n## |$)/);
  let summary = outputMatch ? outputMatch[1].trim() : content.trim();
  if (summary.length > 300) {
    summary = summary.slice(0, 300) + '…';
  }

  return { status, summary, durationMs, exitCode };
}
