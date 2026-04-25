import * as fs from "fs/promises";
import * as path from "path";

export class SafeWriter {
  async writeJson(filePath: string, data: unknown): Promise<void> {
    const tmp = `${filePath}.tmp`;
    const backup = `${filePath}.backup`;
    const content = JSON.stringify(data, null, 2);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(tmp, content, "utf8");

    // Verify by reading back
    const readBack = await fs.readFile(tmp, "utf8");
    JSON.parse(readBack);

    // Backup existing file if present
    try {
      await fs.access(filePath);
      await fs.copyFile(filePath, backup);
    } catch {
      // no existing file
    }

    await fs.rename(tmp, filePath);
  }

  async writeText(filePath: string, content: string): Promise<void> {
    const tmp = `${filePath}.tmp`;
    const backup = `${filePath}.backup`;

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(tmp, content, "utf8");

    // Verify readable
    await fs.readFile(tmp, "utf8");

    try {
      await fs.access(filePath);
      await fs.copyFile(filePath, backup);
    } catch {
      // no existing file
    }

    await fs.rename(tmp, filePath);
  }

  async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      try {
        return JSON.parse(content) as T;
      } catch (e) {
        throw new Error(`Failed to parse JSON at ${filePath}: ${(e as Error).message}`);
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
}

export const safeWriter = new SafeWriter();
