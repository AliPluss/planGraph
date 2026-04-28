import * as fs from "fs/promises";
import * as path from "path";
import { pathGuard } from "../security/path-guard";
import { safeCommandRunner } from "../security/command-runner";

export interface SnapshotEntry {
  tag: string;
  date: string;
  subject: string;
}

interface EnsureRepoOptions {
  allowNestedRepo?: boolean;
}

const DEFAULT_GITIGNORE = [
  "node_modules",
  ".env*",
  ".plangraph/PROMPT.md",
  "",
].join("\n");

function normalize(value: string): string {
  return path.resolve(value).replace(/\\/g, "/");
}

function sanitizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "snapshot";
}

function parseTagLine(line: string): SnapshotEntry | null {
  const [tag, date, ...subjectParts] = line.split("\t");
  if (!tag || !date) return null;
  return {
    tag,
    date,
    subject: subjectParts.join("\t") || "PlanGraph snapshot",
  };
}

export class SnapshotManager {
  private readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);
  }

  private resolveInsideRoot(target = "."): string {
    return pathGuard.resolveSafe(target, this.rootPath);
  }

  async ensureRepo(options: EnsureRepoOptions = {}): Promise<void> {
    await fs.mkdir(this.rootPath, { recursive: true });
    this.resolveInsideRoot();

    const currentRoot = await this.currentGitRoot();
    if (currentRoot && normalize(currentRoot) !== normalize(this.rootPath)) {
      if (!options.allowNestedRepo) {
        throw new Error(
          `Project is inside an existing git repo at ${currentRoot}. Enable snapshots for this project to create a dedicated repo at ${this.rootPath}.`,
        );
      }
    }

    const gitDir = path.join(this.rootPath, ".git");
    try {
      await fs.stat(gitDir);
    } catch {
      const init = await safeCommandRunner.run("git", ["init"], this.rootPath, { timeoutMs: 30_000 });
      if (init.exitCode !== 0) {
        throw new Error(`git init failed: ${init.stderr || init.stdout}`);
      }
    }

    await this.ensureLocalIdentity();
    await this.ensureGitignore();
  }

  async snapshot(label: string): Promise<{ tag: string }> {
    await this.ensureRepo({ allowNestedRepo: true });
    const safeLabel = sanitizeLabel(label);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tag = `plangraph/${safeLabel}-${timestamp}`;

    await this.runGit(["add", "-A"]);
    await this.runGit(["commit", "--allow-empty", "-m", `PlanGraph: ${label}`]);
    await this.runGit(["tag", tag]);

    return { tag };
  }

  async listSnapshots(): Promise<SnapshotEntry[]> {
    await this.ensureRepo({ allowNestedRepo: true });
    const result = await this.runGit([
      "for-each-ref",
      "refs/tags/plangraph",
      "--sort=-creatordate",
      "--format=%(refname:short)%09%(creatordate:iso-strict)%09%(subject)",
    ]);

    return result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseTagLine)
      .filter((entry): entry is SnapshotEntry => entry !== null);
  }

  async rollback(tag: string): Promise<void> {
    this.assertPlanGraphTag(tag);
    await this.ensureRepo({ allowNestedRepo: true });
    const status = await this.runGit(["status", "--porcelain"]);
    if (status.stdout.trim()) {
      throw new Error("Rollback refused: uncommitted work is present. Confirm from the UI before retrying with force.");
    }
    await this.runGit(["reset", "--hard", tag]);
  }

  async rollbackConfirmed(tag: string): Promise<void> {
    this.assertPlanGraphTag(tag);
    await this.ensureRepo({ allowNestedRepo: true });
    await this.runGit(["reset", "--hard", tag]);
  }

  async diff(tag: string): Promise<string> {
    this.assertPlanGraphTag(tag);
    await this.ensureRepo({ allowNestedRepo: true });
    const result = await this.runGit(["diff", tag, "HEAD", "--stat"]);
    return result.stdout.trim() || "No changes since this snapshot.";
  }

  private async currentGitRoot(): Promise<string | null> {
    try {
      const result = await safeCommandRunner.run(
        "git",
        ["rev-parse", "--show-toplevel"],
        this.rootPath,
        { timeoutMs: 30_000 },
      );
      return result.exitCode === 0 ? result.stdout.trim() : null;
    } catch {
      return null;
    }
  }

  private async ensureGitignore(): Promise<void> {
    const gitignorePath = this.resolveInsideRoot(".gitignore");
    try {
      await fs.stat(gitignorePath);
    } catch {
      await fs.writeFile(gitignorePath, DEFAULT_GITIGNORE, "utf8");
    }
  }

  private async ensureLocalIdentity(): Promise<void> {
    await this.runGit(["config", "user.name", "PlanGraph"]);
    await this.runGit(["config", "user.email", "plangraph@local"]);
  }

  private async runGit(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const result = await safeCommandRunner.run("git", args, this.rootPath, { timeoutMs: 120_000 });
    if (result.exitCode !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
    }
    return result;
  }

  private assertPlanGraphTag(tag: string): void {
    if (!/^plangraph\/[a-z0-9._-]+-\d{4}-\d{2}-\d{2}t/i.test(tag)) {
      throw new Error("Only PlanGraph snapshot tags can be used for this operation.");
    }
  }
}
