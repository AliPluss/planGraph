import { spawn } from "child_process";

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export class SafeCommandRunner {
  private allowedCommands = ["git", "npm", "node", "claude", "cursor", "code"];

  async run(
    command: string,
    args: string[],
    cwd: string,
    opts?: { timeoutMs?: number }
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.allowedCommands.includes(command)) {
      throw new Error(`Command not allowed: ${command}. Allowed: ${this.allowedCommands.join(", ")}`);
    }

    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, shell: false });
      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
      }, timeoutMs);

      child.stdout.on("data", (d) => { stdout += String(d); });
      child.stderr.on("data", (d) => { stderr += String(d); });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (!timedOut) {
          resolve({ stdout, stderr, exitCode: code ?? 0 });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async runStream(
    command: string,
    args: string[],
    cwd: string,
    opts: { timeoutMs?: number } | undefined,
    onChunk: (data: string) => void
  ): Promise<{ exitCode: number; stderr: string; fullStdout: string }> {
    if (!this.allowedCommands.includes(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, shell: false });
      let fullStdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
      }, timeoutMs);

      child.stdout.on("data", (d) => {
        const chunk = String(d);
        fullStdout += chunk;
        onChunk(chunk);
      });

      child.stderr.on("data", (d) => { stderr += String(d); });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (!timedOut) {
          resolve({ exitCode: code ?? 0, stderr, fullStdout });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

export const safeCommandRunner = new SafeCommandRunner();
