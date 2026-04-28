import { SafeWriter } from '../security/safe-writer';
import { inputSanitizer } from '../security/input-sanitizer';
import { getMemoryFile } from '../storage/paths';
import type { Storage } from '../storage/storage';
import type { MemoryEntry } from '../types';

type SectionName = 'Decisions' | 'Conventions' | 'Issues' | 'File Map' | 'Notes';

const SECTION_BY_CATEGORY: Record<MemoryEntry['category'], SectionName> = {
  decision: 'Decisions',
  convention: 'Conventions',
  issue: 'Issues',
  'file-map': 'File Map',
  note: 'Notes',
};

const SECTION_ORDER: SectionName[] = ['Decisions', 'Conventions', 'Issues', 'File Map', 'Notes'];

export class MemoryManager {
  private writer = new SafeWriter();

  constructor(private storage: Storage) {}

  async addDecision(projectId: string, stepId: string, text: string): Promise<MemoryEntry> {
    return this.appendEntry(projectId, {
      stepId,
      category: 'decision',
      text: this.clean(text),
      createdAt: new Date().toISOString(),
    });
  }

  async addConvention(projectId: string, text: string): Promise<MemoryEntry> {
    return this.appendEntry(projectId, {
      stepId: 'project',
      category: 'convention',
      text: this.clean(text),
      createdAt: new Date().toISOString(),
    });
  }

  async addIssue(
    projectId: string,
    stepId: string,
    text: string,
    status: 'open' | 'resolved',
  ): Promise<MemoryEntry> {
    return this.appendEntry(projectId, {
      stepId,
      category: 'issue',
      status,
      text: this.clean(text),
      createdAt: new Date().toISOString(),
    });
  }

  async addFileMapEntry(projectId: string, filePath: string, description: string): Promise<MemoryEntry> {
    return this.appendEntry(projectId, {
      stepId: 'project',
      category: 'file-map',
      path: this.clean(filePath),
      text: this.clean(description),
      createdAt: new Date().toISOString(),
    });
  }

  async addNote(projectId: string, stepId: string, text: string): Promise<MemoryEntry> {
    return this.appendEntry(projectId, {
      stepId,
      category: 'note',
      text: this.clean(text),
      createdAt: new Date().toISOString(),
    });
  }

  async getAll(projectId: string): Promise<MemoryEntry[]> {
    return parseMemory(await this.storage.readMemory(projectId));
  }

  async render(projectId: string, entries: MemoryEntry[]): Promise<string> {
    const project = await this.storage.readProject(projectId);
    const title = project?.meta.name ?? projectId;
    return renderMemory(title, entries);
  }

  private async appendEntry(projectId: string, entry: MemoryEntry): Promise<MemoryEntry> {
    const existing = await this.getAll(projectId);
    const updated = [...existing, entry];
    const rendered = await this.render(projectId, updated);
    await this.writer.writeText(getMemoryFile(projectId), rendered);
    return entry;
  }

  private clean(text: string): string {
    const { clean } = inputSanitizer.sanitizeIdea(text.trim());
    return inputSanitizer.sanitizeForLog(clean);
  }
}

export function parseMemory(markdown: string): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  const sections = splitSections(markdown);

  for (const [heading, body] of sections) {
    const section = normalizeHeading(heading);
    if (!section) continue;

    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line.startsWith('- ')) continue;
      if (line.includes('_(empty)_')) continue;

      const createdAt = extractDate(line) ?? '';
      if (section === 'Decisions') {
        entries.push({
          stepId: extractStep(line) ?? 'project',
          category: 'decision',
          text: stripMetadata(line),
          createdAt,
        });
      } else if (section === 'Conventions') {
        entries.push({
          stepId: extractStep(line) ?? 'project',
          category: 'convention',
          text: stripMetadata(line),
          createdAt,
        });
      } else if (section === 'Issues') {
        entries.push({
          stepId: extractStep(line) ?? 'project',
          category: 'issue',
          status: line.includes('[resolved]') ? 'resolved' : 'open',
          text: stripMetadata(line).replace(/^\[(open|resolved)\]\s*/i, ''),
          createdAt,
        });
      } else if (section === 'File Map') {
        const fileMatch = line.match(/`([^`]+)`\s*-\s*(.+?)(?:\s+_\(.+\)_)?$/);
        entries.push({
          stepId: 'project',
          category: 'file-map',
          path: fileMatch?.[1],
          text: fileMatch?.[2] ?? stripMetadata(line),
          createdAt,
        });
      } else {
        entries.push({
          stepId: extractStep(line) ?? 'project',
          category: 'note',
          text: stripMetadata(line),
          createdAt,
        });
      }
    }
  }

  return entries;
}

export function renderMemory(projectName: string, entries: MemoryEntry[]): string {
  const grouped = new Map<SectionName, MemoryEntry[]>();
  for (const section of SECTION_ORDER) grouped.set(section, []);
  for (const entry of entries) {
    grouped.get(SECTION_BY_CATEGORY[entry.category] ?? 'Notes')?.push(entry);
  }

  const sections = SECTION_ORDER.map((section) => {
    const rows = grouped.get(section) ?? [];
    const body = rows.length > 0
      ? rows.map(formatEntry).join('\n')
      : '_(empty)_';
    return `## ${section}\n${body}`;
  }).join('\n\n');

  return `# Project Memory - ${projectName}

_This file grows as the project develops. Executors should read it before every step._

${sections}
`;
}

function splitSections(markdown: string): Array<[string, string]> {
  const sections: Array<[string, string]> = [];
  const parts = markdown.split(/\n##\s+/);
  for (const part of parts) {
    const normalized = part.startsWith('## ') ? part.slice(3) : part;
    const [heading, ...body] = normalized.split('\n');
    sections.push([heading.trim(), body.join('\n')]);
  }
  return sections;
}

function normalizeHeading(heading: string): SectionName | null {
  const cleaned = heading.replace(/^#+\s*/, '').trim().toLowerCase();
  if (cleaned === 'decisions' || cleaned === 'decisions made') return 'Decisions';
  if (cleaned === 'conventions') return 'Conventions';
  if (cleaned === 'issues' || cleaned === 'known issues') return 'Issues';
  if (cleaned === 'file map') return 'File Map';
  if (cleaned === 'notes') return 'Notes';
  return null;
}

function formatEntry(entry: MemoryEntry): string {
  const date = entry.createdAt ? ` _(${entry.createdAt})_` : '';
  if (entry.category === 'file-map') {
    return `- \`${entry.path ?? 'unknown'}\` - ${entry.text}${date}`;
  }
  if (entry.category === 'issue') {
    return `- [${entry.status ?? 'open'}] [${entry.stepId}] ${entry.text}${date}`;
  }
  if (entry.category === 'convention') {
    return `- ${entry.text}${date}`;
  }
  return `- [${entry.stepId}] ${entry.text}${date}`;
}

function extractDate(line: string): string | null {
  return line.match(/_\(([^)]+)\)_/)?.[1] ?? null;
}

function extractStep(line: string): string | null {
  return line.match(/-\s+(?:\[(?:open|resolved)\]\s+)?\[([^\]]+)\]/i)?.[1] ?? null;
}

function stripMetadata(line: string): string {
  return line
    .replace(/^-\s+/, '')
    .replace(/_\([^)]+\)_\s*$/, '')
    .replace(/^\[[^\]]+\]\s+/, '')
    .trim();
}
