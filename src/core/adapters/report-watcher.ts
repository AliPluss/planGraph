import * as fs from 'fs/promises';
import * as path from 'path';
import chokidar, { type FSWatcher } from 'chokidar';
import { inputSanitizer } from '../security/input-sanitizer';
import { pathGuard } from '../security/path-guard';

export class ReportWatcher {
  private watcher: FSWatcher | null = null;
  private readonly seen = new Map<string, number>();
  private readonly reportsDir: string;

  constructor(
    private readonly projectId: string,
    projectRoot: string,
  ) {
    this.reportsDir = pathGuard.resolveSafe('reports', projectRoot);
  }

  async start(onReport: (stepId: string, contents: string) => void): Promise<void> {
    await fs.mkdir(this.reportsDir, { recursive: true });
    await this.stop();

    this.watcher = chokidar.watch(this.reportsDir, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    const handleFile = async (filePath: string) => {
      const safePath = pathGuard.resolveSafe(filePath, this.reportsDir);
      const fileName = path.basename(safePath);
      const match = fileName.match(/^(.+)_report\.md$/);
      if (!match) return;

      const now = Date.now();
      const lastSeen = this.seen.get(safePath) ?? 0;
      if (now - lastSeen < 1000) return;
      this.seen.set(safePath, now);

      const raw = await fs.readFile(safePath, 'utf8');
      onReport(match[1], inputSanitizer.sanitizeForLog(raw));
    };

    this.watcher.on('add', (filePath) => {
      void handleFile(filePath).catch(() => {
        // The SSE endpoint keeps watching even if one report cannot be read.
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.watcher) return;
    const watcher = this.watcher;
    this.watcher = null;
    await watcher.close();
  }

  get id(): string {
    return this.projectId;
  }
}
