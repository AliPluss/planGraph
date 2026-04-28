import * as fs from 'fs/promises';
import { NextResponse } from 'next/server';
import { inputSanitizer } from '@/core/security/input-sanitizer';
import { getAuditFile } from '@/core/storage/paths';
import type { AuditEntry } from '@/core/types';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

async function readAuditTail(projectId: string, maxBytes = 512 * 1024): Promise<AuditEntry[]> {
  const auditPath = getAuditFile(projectId);
  try {
    const stat = await fs.stat(auditPath);
    const handle = await fs.open(auditPath, 'r');
    try {
      const bytesToRead = Math.min(stat.size, maxBytes);
      const buffer = Buffer.alloc(bytesToRead);
      await handle.read(buffer, 0, bytesToRead, stat.size - bytesToRead);
      return buffer
        .toString('utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as AuditEntry)
        .reverse();
    } finally {
      await handle.close();
    }
  } catch {
    return [];
  }
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return inputSanitizer.sanitizeForLog(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        inputSanitizer.sanitizeForLog(key),
        sanitizeValue(item),
      ]),
    );
  }
  return value;
}

function sanitizeEntry(entry: AuditEntry): AuditEntry {
  return {
    timestamp: inputSanitizer.sanitizeForLog(entry.timestamp),
    action: entry.action,
    projectId: entry.projectId ? inputSanitizer.sanitizeForLog(entry.projectId) : undefined,
    stepId: entry.stepId ? inputSanitizer.sanitizeForLog(entry.stepId) : undefined,
    details: entry.details ? sanitizeValue(entry.details) as Record<string, unknown> : undefined,
  };
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const entries = await readAuditTail(id);
  return NextResponse.json({ data: entries.map(sanitizeEntry) });
}
