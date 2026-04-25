import * as path from "path";
import { pathGuard } from "../security/path-guard.js";

function repoRoot(): string {
  // Walk up from __dirname to find the project root (where package.json lives)
  return path.resolve(process.cwd());
}

export function getWorkspaceRoot(): string {
  return path.join(repoRoot(), "workspace");
}

export function getProfilePath(): string {
  const ws = getWorkspaceRoot();
  return pathGuard.resolveSafe("profile.json", ws);
}

export function getProjectsDir(): string {
  return path.join(getWorkspaceRoot(), "projects");
}

export function getProjectDir(projectId: string): string {
  const projects = getProjectsDir();
  return pathGuard.resolveSafe(projectId, projects);
}

export function getProjectFile(projectId: string): string {
  const dir = getProjectDir(projectId);
  return pathGuard.resolveSafe("project.json", dir);
}

export function getMemoryFile(projectId: string): string {
  const dir = getProjectDir(projectId);
  return pathGuard.resolveSafe("MEMORY.md", dir);
}

export function getStepsDir(projectId: string): string {
  const dir = getProjectDir(projectId);
  return pathGuard.resolveSafe("steps", dir);
}

export function getStepFile(projectId: string, stepId: string): string {
  const steps = getStepsDir(projectId);
  return pathGuard.resolveSafe(`${stepId}.md`, steps);
}

export function getReportsDir(projectId: string): string {
  const dir = getProjectDir(projectId);
  return pathGuard.resolveSafe("reports", dir);
}

export function getAuditFile(projectId: string): string {
  const dir = getProjectDir(projectId);
  return pathGuard.resolveSafe("audit.log", dir);
}
