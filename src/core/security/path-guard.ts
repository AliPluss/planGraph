import * as path from "path";

const FORBIDDEN_PATHS = [
  "/etc",
  "/usr",
  "/bin",
  "/System",
  "/root",
  "C:\\Windows",
  "C:/Windows",
];

function hasForbiddenPrefix(resolved: string): boolean {
  const normalized = resolved.replace(/\\/g, "/");
  return FORBIDDEN_PATHS.some((f) => {
    const fn = f.replace(/\\/g, "/");
    return normalized === fn || normalized.startsWith(fn + "/");
  });
}

function isSshPath(resolved: string): boolean {
  const normalized = resolved.replace(/\\/g, "/");
  return normalized.includes("/.ssh/") || normalized.endsWith("/.ssh");
}

export class PathGuard {
  constructor(private allowedRoots: string[]) {}

  resolveSafe(targetPath: string, baseRoot: string): string {
    // Check raw path for Unix-style forbidden patterns before OS resolution
    const rawNormalized = targetPath.replace(/\\/g, "/");
    if (hasForbiddenPrefix(rawNormalized)) {
      throw new Error(`Path targets a forbidden system location: ${targetPath}`);
    }
    if (isSshPath(rawNormalized)) {
      throw new Error(`Path targets .ssh directory: ${targetPath}`);
    }

    const resolved = path.resolve(baseRoot, targetPath);

    if (resolved.includes("..")) {
      throw new Error(`Path traversal detected in: ${targetPath}`);
    }

    const normalizedResolved = resolved.replace(/\\/g, "/");
    const normalizedBase = path.resolve(baseRoot).replace(/\\/g, "/");

    if (!normalizedResolved.startsWith(normalizedBase + "/") && normalizedResolved !== normalizedBase) {
      throw new Error(`Path escapes base root: ${resolved}`);
    }

    if (hasForbiddenPrefix(resolved)) {
      throw new Error(`Path targets a forbidden system location: ${resolved}`);
    }

    if (isSshPath(resolved)) {
      throw new Error(`Path targets .ssh directory: ${resolved}`);
    }

    return resolved;
  }

  isInsideRoot(targetPath: string, root: string): boolean {
    try {
      const resolved = path.resolve(targetPath).replace(/\\/g, "/");
      const normalizedRoot = path.resolve(root).replace(/\\/g, "/");
      return resolved.startsWith(normalizedRoot + "/") || resolved === normalizedRoot;
    } catch {
      return false;
    }
  }
}

export const pathGuard = new PathGuard([]);
