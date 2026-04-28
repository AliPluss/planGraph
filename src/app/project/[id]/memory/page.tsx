'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MemoryEntry, Project } from '@/core/types';

const FILTERS: Array<{ id: string; label: string; headings?: string[] }> = [
  { id: 'all', label: 'All' },
  { id: 'decision', label: 'Decisions', headings: ['Decisions', 'Decisions Made'] },
  { id: 'convention', label: 'Conventions', headings: ['Conventions'] },
  { id: 'issue', label: 'Issues', headings: ['Issues', 'Known Issues'] },
  { id: 'file-map', label: 'File Map', headings: ['File Map'] },
];

export default function ProjectMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
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

  const sections = useMemo(() => {
    const map = new Map<string, string>();
    for (const filter of FILTERS) {
      if (!filter.headings) continue;
      map.set(filter.id, filter.headings.map((heading) => extractSection(content, heading)).filter(Boolean).join('\n'));
    }
    return map;
  }, [content]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-background">
      <div className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            href={`/project/${id}`}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Back to project"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{project?.meta.name ?? 'Project'} Memory</h1>
            <p className="text-xs text-muted-foreground">MEMORY.md</p>
          </div>
          <Badge variant="outline" className="text-[11px]">
            {project?.memory.length ?? 0} entries
          </Badge>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5 text-xs" />}>
              <Plus className="h-3.5 w-3.5" />
              Add entry
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

      <main className="mx-auto max-w-5xl px-4 py-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading memory...</p>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              {FILTERS.map((filter) => (
                <TabsTrigger key={filter.id} value={filter.id}>{filter.label}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="m-0">
              <MemoryMarkdown content={content} />
            </TabsContent>
            {FILTERS.filter((filter) => filter.id !== 'all').map((filter) => (
              <TabsContent key={filter.id} value={filter.id} className="m-0">
                <MemoryMarkdown content={`## ${filter.label}\n${sections.get(filter.id) || '_(empty)_'}`} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
}

function MemoryMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none rounded-lg border bg-card px-5 py-4 dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '_(empty)_'}</ReactMarkdown>
    </div>
  );
}

function extractSection(markdown: string, heading: string): string {
  const pattern = new RegExp(`(?:^|\\n)## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n## |$)`);
  return markdown.match(pattern)?.[1]?.trim() ?? '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
