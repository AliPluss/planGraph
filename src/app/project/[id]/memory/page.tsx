'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  BookOpenText,
  Brain,
  Clock3,
  Database,
  FileText,
  FolderTree,
  Link2,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  StickyNote,
  Tags,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from '@/components/plangraph/Panel';
import { cn } from '@/lib/utils';
import type { ExecutorTool, MemoryEntry, Project, Step, ToolPrompts } from '@/core/types';

const FILTERS: Array<{ id: MemoryFilter; label: string; headings?: string[] }> = [
  { id: 'all', label: 'All' },
  { id: 'decision', label: 'Decisions', headings: ['Decisions', 'Decisions Made'] },
  { id: 'convention', label: 'Conventions', headings: ['Conventions'] },
  { id: 'issue', label: 'Issues', headings: ['Issues', 'Known Issues'] },
  { id: 'file-map', label: 'File map', headings: ['File Map'] },
  { id: 'note', label: 'Notes', headings: ['Notes'] },
];

type MemoryFilter = 'all' | MemoryEntry['category'];
type DocumentKind = 'memory' | 'note' | 'step' | 'prompt' | 'report' | 'attachment';

interface LibraryDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  path: string;
  description: string;
  stepId?: string;
  content?: string;
  tags: string[];
}

const KIND_LABEL: Record<DocumentKind, string> = {
  memory: 'Project memory',
  note: 'Notes',
  step: 'Markdown step',
  prompt: 'Prompt',
  report: 'Report',
  attachment: 'Attachment',
};

const KIND_ICON: Record<DocumentKind, typeof FileText> = {
  memory: Brain,
  note: StickyNote,
  step: FileText,
  prompt: MessageSquareText,
  report: BookOpenText,
  attachment: Paperclip,
};

export default function ProjectMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MemoryFilter>('all');
  const [selectedDocId, setSelectedDocId] = useState('memory');
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<MemoryEntry['category']>('decision');
  const [stepId, setStepId] = useState('');
  const [filePath, setFilePath] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadMemory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadMemory() {
    setLoading(true);
    const [projectRes, memoryRes] = await Promise.all([
      fetch(`/api/projects/${id}`).then((res) => res.json() as Promise<{ data?: Project }>),
      fetch(`/api/memory?projectId=${id}`).then((res) => res.json() as Promise<{ content?: string }>),
    ]);
    setProject(projectRes.data ?? null);
    setContent(memoryRes.content ?? '');
    setLoading(false);
  }

  async function submitEntry() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          category,
          stepId: stepId.trim() || undefined,
          path: filePath.trim() || undefined,
          text,
        }),
      });
      const json = await res.json() as { content?: string };
      setContent(json.content ?? content);
      setText('');
      setStepId('');
      setFilePath('');
      setDialogOpen(false);
      void loadMemory();
    } finally {
      setSaving(false);
    }
  }

  const documents = useMemo(() => buildDocuments(project, content), [project, content]);
  const selectedDocument = documents.find((document) => document.id === selectedDocId) ?? documents[0];
  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesFilter = filter === 'all'
        || document.kind === filter
        || document.kind === 'memory'
        || (filter === 'note' && document.kind === 'note')
        || document.tags.includes(filter);
      const matchesQuery = !normalized
        || `${document.title} ${document.path} ${document.tags.join(' ')}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [documents, filter, query]);

  const linkedEntries = useMemo(() => {
    if (!project || !selectedDocument) return [];
    if (selectedDocument.kind === 'memory') return project.memory.slice(-8).reverse();
    return project.memory.filter((entry) => {
      if (selectedDocument.stepId && entry.stepId === selectedDocument.stepId) return true;
      if (entry.path && selectedDocument.path.includes(entry.path)) return true;
      return false;
    });
  }, [project, selectedDocument]);

  const linkedSteps = useMemo(() => {
    if (!project || !selectedDocument) return [];
    if (selectedDocument.stepId) {
      return project.steps.filter((step) => step.id === selectedDocument.stepId);
    }
    const entryStepIds = new Set(linkedEntries.map((entry) => entry.stepId).filter((value) => value !== 'project'));
    return project.steps.filter((step) => entryStepIds.has(step.id));
  }, [linkedEntries, project, selectedDocument]);

  const attachments = useMemo(() => {
    if (!project || !selectedDocument?.stepId) return [];
    const step = project.steps.find((item) => item.id === selectedDocument.stepId);
    return step ? unique([...step.contextFiles, ...step.protectedFiles]) : [];
  }, [project, selectedDocument]);

  useEffect(() => {
    if (!selectedDocument) return;
    let cancelled = false;

    async function loadPreview(document: LibraryDocument) {
      setPreviewLoading(true);
      try {
        if (document.kind === 'step' && document.stepId) {
          const response = await fetch(`/api/projects/${id}/steps/${document.stepId}/md`);
          const textContent = response.ok
            ? await response.text()
            : `# ${document.title}\n\nStep Markdown was not found at \`${document.path}\`.`;
          if (!cancelled) setPreviewContent(textContent);
          return;
        }
        if (!cancelled) setPreviewContent(document.content ?? '');
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    void loadPreview(selectedDocument);
    return () => {
      cancelled = true;
    };
  }, [id, selectedDocument]);

  const memoryCounts = useMemo(() => {
    const counts = new Map<MemoryFilter, number>();
    for (const filterItem of FILTERS) counts.set(filterItem.id, 0);
    counts.set('all', project?.memory.length ?? 0);
    for (const entry of project?.memory ?? []) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    }
    return counts;
  }, [project?.memory]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[var(--pg-surface-0)]">
      <div className="border-b border-[var(--pg-border-soft)] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href={`/project/${id}`}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Back to project"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{project?.meta.name ?? 'Project'} Library</h1>
            <p className="text-xs text-muted-foreground">Markdown, prompts, reports, attachments, and memory</p>
          </div>
          <Badge variant="outline" className="text-[11px]">
            {documents.length} documents
          </Badge>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5 text-xs" />}>
              <Plus className="h-3.5 w-3.5" />
              Add memory
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add memory entry</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as MemoryEntry['category'])}
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="decision">Decision</option>
                  <option value="convention">Convention</option>
                  <option value="issue">Issue</option>
                  <option value="file-map">File map</option>
                  <option value="note">Note</option>
                </select>
                {(category === 'decision' || category === 'issue' || category === 'note') && (
                  <input
                    value={stepId}
                    onChange={(event) => setStepId(event.target.value)}
                    placeholder="Step ID (optional)"
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  />
                )}
                {category === 'file-map' && (
                  <input
                    value={filePath}
                    onChange={(event) => setFilePath(event.target.value)}
                    placeholder="File path"
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                  />
                )}
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={5}
                  placeholder="What should future steps remember?"
                  className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={() => void submitEntry()} disabled={!text.trim() || saving}>
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <Panel className="min-h-[34rem] p-0">
          <div className="border-b border-[var(--pg-border-soft)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderTree className="size-4 text-[var(--pg-accent-cyan)]" />
              Document tree
            </div>
            <label className="mt-3 flex h-9 items-center gap-2 rounded-md border border-[var(--pg-border-soft)] bg-background/60 px-3 text-xs text-muted-foreground">
              <Search className="size-3.5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search library"
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--pg-border-soft)] px-3 py-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  filter === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
                <span className="ms-1 opacity-70">{memoryCounts.get(item.id) ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Loading library...</p>
            ) : filteredDocuments.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">No documents match this view.</p>
            ) : (
              <div className="space-y-1">
                {filteredDocuments.map((document) => (
                  <DocumentButton
                    key={document.id}
                    document={document}
                    active={selectedDocument?.id === document.id}
                    onSelect={() => setSelectedDocId(document.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="min-w-0">
          <PanelHeader>
            <div className="min-w-0">
              <PanelTitle className="truncate">{selectedDocument?.title ?? 'Library'}</PanelTitle>
              <PanelDescription className="truncate">{selectedDocument?.path ?? 'Select a document'}</PanelDescription>
            </div>
            {selectedDocument && (
              <Badge variant="secondary" className="shrink-0 text-[11px]">
                {KIND_LABEL[selectedDocument.kind]}
              </Badge>
            )}
          </PanelHeader>
          <PanelContent>
            <div className="min-h-[34rem] overflow-hidden rounded-lg border border-[var(--pg-border-soft)] bg-background/60">
              <div className="flex items-center justify-between border-b border-[var(--pg-border-soft)] px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Database className="size-3.5" />
                  Markdown preview
                </div>
                {previewLoading && <span className="text-[11px] text-muted-foreground">Loading...</span>}
              </div>
              <div className="max-h-[calc(100dvh-18rem)] overflow-y-auto px-5 py-4">
                <MemoryMarkdown content={previewLoading ? 'Loading preview...' : previewContent} />
              </div>
            </div>
          </PanelContent>
        </Panel>

        <aside className="space-y-4">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle className="text-sm">Metadata</PanelTitle>
                <PanelDescription>Document links and local context</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-3 text-sm">
              <MetadataRow label="Type" value={selectedDocument ? KIND_LABEL[selectedDocument.kind] : 'None'} />
              <MetadataRow label="Path" value={selectedDocument?.path ?? '-'} mono />
              <MetadataRow label="Updated" value={project?.meta.updatedAt ? formatDate(project.meta.updatedAt) : '-'} />
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Tags className="size-3.5" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDocument?.tags.length ? selectedDocument.tags : ['local-first']).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[11px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle className="text-sm">Linked Nodes</PanelTitle>
                <PanelDescription>Steps connected to this document</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-2">
              {linkedSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked steps.</p>
              ) : linkedSteps.map((step) => (
                <LinkedStep key={step.id} step={step} projectId={id} />
              ))}
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle className="text-sm">Attachments</PanelTitle>
                <PanelDescription>Context files referenced by linked steps</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-2">
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments linked.</p>
              ) : attachments.map((attachment) => (
                <div key={attachment} className="flex items-start gap-2 rounded-md border border-[var(--pg-border-soft)] bg-background/50 p-2 text-xs">
                  <Paperclip className="mt-0.5 size-3.5 shrink-0 text-[var(--pg-accent-amber)]" />
                  <span className="min-w-0 break-all font-mono text-muted-foreground">{attachment}</span>
                </div>
              ))}
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle className="text-sm">Memory Entries</PanelTitle>
                <PanelDescription>Decisions, notes, issues, and file map rows</PanelDescription>
              </div>
            </PanelHeader>
            <PanelContent className="space-y-2">
              {linkedEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No memory entries linked.</p>
              ) : linkedEntries.map((entry, index) => (
                <MemoryEntryCard key={`${entry.createdAt}-${index}`} entry={entry} />
              ))}
            </PanelContent>
          </Panel>
        </aside>
      </main>
    </div>
  );
}

function buildDocuments(project: Project | null, memoryContent: string): LibraryDocument[] {
  if (!project) {
    return [{
      id: 'memory',
      title: 'MEMORY.md',
      kind: 'memory',
      path: 'workspace/projects/.../MEMORY.md',
      description: 'Project memory file',
      content: memoryContent,
      tags: ['memory'],
    }];
  }

  const tags = unique([project.meta.templateId, ...(project.meta.stack ?? [])]);
  const documents: LibraryDocument[] = [
    {
      id: 'memory',
      title: 'MEMORY.md',
      kind: 'memory',
      path: `workspace/projects/${project.meta.id}/MEMORY.md`,
      description: 'Persistent project memory',
      content: memoryContent,
      tags: ['memory', 'local-first', ...tags],
    },
    {
      id: 'project-notes',
      title: 'Project notes',
      kind: 'note',
      path: `workspace/projects/${project.meta.id}/notes`,
      description: 'Idea, stack, exclusions, and local project context',
      content: projectNotes(project),
      tags: ['notes', ...tags],
    },
  ];

  for (const step of project.steps) {
    documents.push({
      id: `step:${step.id}`,
      title: step.title,
      kind: 'step',
      path: step.mdFile,
      description: step.goal,
      stepId: step.id,
      tags: unique([step.type, step.status, ...step.recommendedLibraries.map((library) => library.name)]),
    });

    documents.push({
      id: `prompt:${step.id}`,
      title: `${step.title} prompt`,
      kind: 'prompt',
      path: `${step.mdFile}#prompt`,
      description: `Prompt for ${project.meta.selectedExecutor}`,
      stepId: step.id,
      content: promptDocument(project, step),
      tags: unique(['prompt', step.type, project.meta.selectedExecutor]),
    });

    if (step.reportFile || step.validationReport || step.executionLog) {
      documents.push({
        id: `report:${step.id}`,
        title: `${step.title} report`,
        kind: 'report',
        path: step.reportFile ?? `workspace/projects/${project.meta.id}/reports/${step.id}_report.md`,
        description: 'Execution report metadata',
        stepId: step.id,
        content: reportDocument(step),
        tags: unique(['report', step.status]),
      });
    }
  }

  for (const attachment of unique(project.steps.flatMap((step) => [...step.contextFiles, ...step.protectedFiles]))) {
    documents.push({
      id: `attachment:${attachment}`,
      title: attachment.split(/[\\/]/).pop() || attachment,
      kind: 'attachment',
      path: attachment,
      description: 'Referenced context or protected file',
      content: `# ${attachment}\n\nThis file is referenced by the project graph. PlanGraph keeps attachment content in the local workspace and does not copy it into memory automatically.`,
      tags: ['attachment'],
    });
  }

  return documents;
}

function DocumentButton({
  document,
  active,
  onSelect,
}: {
  document: LibraryDocument;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = KIND_ICON[document.kind];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        active ? 'bg-primary/15 text-foreground ring-1 ring-primary/35' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
      )}
    >
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-background/70">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{document.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{document.path}</span>
      </span>
    </button>
  );
}

function MemoryMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:bg-muted prose-pre:text-muted-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '_(empty)_'}</ReactMarkdown>
    </div>
  );
}

function MetadataRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 break-words text-sm', mono && 'font-mono text-xs text-muted-foreground')}>{value}</p>
    </div>
  );
}

function LinkedStep({ step, projectId }: { step: Step; projectId: string }) {
  return (
    <Link
      href={`/project/${projectId}`}
      className="flex items-start gap-2 rounded-md border border-[var(--pg-border-soft)] bg-background/50 p-2 text-xs transition-colors hover:bg-muted"
    >
      <Link2 className="mt-0.5 size-3.5 shrink-0 text-[var(--pg-accent-cyan)]" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{step.title}</span>
        <span className="mt-0.5 block text-muted-foreground">{step.id} · {step.status.replace(/_/g, ' ')}</span>
      </span>
    </Link>
  );
}

function MemoryEntryCard({ entry }: { entry: MemoryEntry }) {
  return (
    <div className="rounded-md border border-[var(--pg-border-soft)] bg-background/50 p-2 text-xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px] capitalize">
          {entry.category.replace(/-/g, ' ')}
        </Badge>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock3 className="size-3" />
          {formatDate(entry.createdAt)}
        </span>
      </div>
      <p className="leading-5 text-muted-foreground">{entry.text}</p>
      {(entry.stepId || entry.path) && (
        <p className="mt-1 truncate font-mono text-[10px] text-[var(--pg-text-faint)]">
          {entry.path ?? entry.stepId}
        </p>
      )}
    </div>
  );
}

function projectNotes(project: Project): string {
  const exclusions = project.meta.mvpExclusions?.length
    ? project.meta.mvpExclusions.map((item) => `- ${item}`).join('\n')
    : '- None recorded';
  const stack = project.meta.stack?.length ? project.meta.stack.join(', ') : 'Not specified';

  return `# Project Notes - ${project.meta.name}

## Idea
${project.meta.idea}

## Stack
${stack}

## MVP Exclusions
${exclusions}

## Local Workspace
- Root path: \`${project.meta.rootPath}\`
- Template: \`${project.meta.templateId}\`
- Executor: \`${project.meta.selectedExecutor}\`
`;
}

function promptDocument(project: Project, step: Step): string {
  const prompt = getPromptForExecutor(step.prompts, project.meta.selectedExecutor);
  return `# Prompt - ${step.title}

## Step
- ID: \`${step.id}\`
- Status: \`${step.status}\`
- Type: \`${step.type}\`

## Prompt
\`\`\`text
${prompt}
\`\`\`
`;
}

function getPromptForExecutor(prompts: ToolPrompts, executor: ExecutorTool): string {
  if (executor === 'claude-code') return prompts.claudeCode ?? prompts.manual;
  if (executor === 'cursor') return prompts.cursor ?? prompts.manual;
  if (executor === 'antigravity') return prompts.antigravity ?? prompts.manual;
  if (executor === 'copilot') return prompts.copilot ?? prompts.manual;
  return prompts.manual;
}

function reportDocument(step: Step): string {
  const validation = step.validationReport
    ? `- Validation passed: ${step.validationReport.passed ? 'yes' : 'no'}\n- Summary: ${step.validationReport.summary}`
    : '- No validation report recorded';
  const execution = step.executionLog
    ? `- Duration: ${step.executionLog.durationMs}ms\n- Tokens: ${step.executionLog.tokens ? `${step.executionLog.tokens.input} in / ${step.executionLog.tokens.output} out` : 'not recorded'}`
    : '- No execution log recorded';

  return `# Report - ${step.title}

## Status
- Step status: \`${step.status}\`
- Report file: \`${step.reportFile ?? 'not written yet'}\`

## Execution
${execution}

## Validation
${validation}
`;
}

function formatDate(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
