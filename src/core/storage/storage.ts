import * as fs from "fs/promises";
import * as path from "path";
import { SafeWriter } from "../security/safe-writer";
import type { UserProfile, Project, ProjectMeta, MemoryEntry, AuditEntry } from "../types";
import {
  getProfilePath,
  getProjectsDir,
  getProjectFile,
  getProjectDir,
  getMemoryFile,
  getStepFile,
  getAuditFile,
  getWorkspaceRoot,
} from "./paths";

export class Storage {
  private writer: SafeWriter;

  constructor() {
    this.writer = new SafeWriter();
  }

  async readProfile(): Promise<UserProfile | null> {
    return this.writer.readJson<UserProfile>(getProfilePath());
  }

  async writeProfile(profile: UserProfile): Promise<void> {
    await this.writer.writeJson(getProfilePath(), profile);
  }

  async listProjects(): Promise<ProjectMeta[]> {
    const dir = getProjectsDir();
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const metas: ProjectMeta[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const projectFile = getProjectFile(entry.name);
        const project = await this.writer.readJson<Project>(projectFile);
        if (project) metas.push(project.meta);
      }
      return metas;
    } catch {
      return [];
    }
  }

  async readProject(id: string): Promise<Project | null> {
    return this.writer.readJson<Project>(getProjectFile(id));
  }

  async writeProject(project: Project): Promise<void> {
    await this.writer.writeJson(getProjectFile(project.meta.id), project);
  }

  async deleteProject(id: string): Promise<void> {
    const src = getProjectDir(id);
    const trashDir = path.join(getWorkspaceRoot(), ".trash");
    await fs.mkdir(trashDir, { recursive: true });
    const dest = path.join(trashDir, `${id}-${Date.now()}`);
    await fs.rename(src, dest);
  }

  async readMemory(projectId: string): Promise<string> {
    try {
      return await fs.readFile(getMemoryFile(projectId), "utf8");
    } catch {
      return "";
    }
  }

  async appendMemory(projectId: string, entry: MemoryEntry): Promise<void> {
    const existing = await this.readMemory(projectId);
    const sectionMap: Record<string, string> = {
      decision: "## Decisions",
      convention: "## Conventions",
      issue: "## Issues",
      "file-map": "## File Map",
      note: "## Notes",
    };
    const section = sectionMap[entry.category] ?? "## Notes";
    const line = `- [${entry.stepId}] ${entry.text} _(${entry.createdAt})_`;

    let updated: string;
    if (existing.includes(section)) {
      updated = existing.replace(section, `${section}\n${line}`);
    } else {
      updated = existing + `\n\n${section}\n${line}\n`;
    }

    await this.writer.writeText(getMemoryFile(projectId), updated);
  }

  async writeStepMd(projectId: string, stepId: string, content: string): Promise<void> {
    await this.writer.writeText(getStepFile(projectId, stepId), content);
  }

  async readStepMd(projectId: string, stepId: string): Promise<string | null> {
    try {
      return await fs.readFile(getStepFile(projectId, stepId), "utf8");
    } catch {
      return null;
    }
  }

  async appendAudit(entry: AuditEntry, projectId?: string): Promise<void> {
    const id = projectId ?? entry.projectId;
    if (!id) return;
    const logPath = getAuditFile(id);
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    const line = JSON.stringify(entry) + "\n";
    await fs.appendFile(logPath, line, "utf8");
  }
}

export const storage = new Storage();
