import * as fs from 'fs/promises';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AuditLogViewer } from '@/components/plangraph/audit/AuditLogViewer';
import { inputSanitizer } from '@/core/security/input-sanitizer';
import { getAuditFile } from '@/core/storage/paths';
import { storage } from '@/core/storage/storage';
import type { AuditEntry } from '@/core/types';

export const dynamic = 'force-dynamic';

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
        .reverse()
        .map(sanitizeEntry);
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

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await storage.readProject(id);
  if (!project) notFound();

  const entries = await readAuditTail(id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/project/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Workspace
      </Link>
      <AuditLogViewer entries={entries} />
    </div>
  );
}
