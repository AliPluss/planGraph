import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";

const tmpBase = path.join(os.tmpdir(), `plangraph-mdwriter-${Date.now()}`);
const originalCwd = process.cwd;
process.cwd = () => tmpBase;

import { MarkdownWriter } from "../md-writer.js";
import type { Project, ProjectMeta, Step } from "../../types.js";

function makeStep(id: string): Step {
  return {
    id,
    title: `Step ${id}`,
    type: "setup",
    status: "not_started",
    goal: `Goal for ${id}`,
    contextFiles: [],
    recommendedLibraries: [
      { name: "typescript", purpose: "Type safety", required: true },
    ],
    successCriteria: ["Criterion one", "Criterion two"],
    restrictions: ["Do not touch .env"],
    protectedFiles: [".env"],
    prompts: {
      manual: `Manual prompt for ${id}`,
      claudeCode: `Claude Code prompt for ${id}`,
    },
    dependsOn: [],
    affects: [],
    mdFile: `${id}.md`,
    position: { x: 0, y: 0 },
  };
}

function makeProject(id: string): Project {
  const meta: ProjectMeta = {
    id,
    name: "MD Writer Test Project",
    idea: "A test idea for markdown writing",
    rootPath: path.join(tmpBase, "workspace", "projects", id),
    templateId: "nextjs-saas",
    locale: "en",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    selectedExecutor: "manual",
  };
  return {
    meta,
    steps: [makeStep("01_setup"), makeStep("02_impl")],
    edges: [{ id: "01->02", source: "01_setup", target: "02_impl" }],
    executionOrder: ["01_setup", "02_impl"],
    memory: [],
  };
}

describe("MarkdownWriter", () => {
  let projectId: string;
  let writer: MarkdownWriter;
  let project: Project;
  let projectDir: string;

  before(async () => {
    await fs.mkdir(path.join(tmpBase, "workspace", "projects"), {
      recursive: true,
    });
    writer = new MarkdownWriter();
    projectId = `test-${Date.now()}`;
    project = makeProject(projectId);
    projectDir = path.join(tmpBase, "workspace", "projects", projectId);
    await writer.writeProject(project);
    process.cwd = originalCwd;
  });

  it("creates OVERVIEW.md", async () => {
    const p = path.join(projectDir, "OVERVIEW.md");
    const content = await fs.readFile(p, "utf-8");
    assert.ok(content.includes("MD Writer Test Project"));
    assert.ok(content.includes("01_setup") || content.includes("Step 01_setup"));
  });

  it("creates ROADMAP.md with step rows", async () => {
    const p = path.join(projectDir, "ROADMAP.md");
    const content = await fs.readFile(p, "utf-8");
    assert.ok(content.includes("01_setup"));
    assert.ok(content.includes("02_impl"));
  });

  it("creates MEMORY.md skeleton with required sections", async () => {
    const p = path.join(projectDir, "MEMORY.md");
    const content = await fs.readFile(p, "utf-8");
    assert.ok(content.includes("Decisions Made"));
    assert.ok(content.includes("Conventions"));
    assert.ok(content.includes("Known Issues"));
    assert.ok(content.includes("File Map"));
  });

  it("creates a steps/ directory", async () => {
    const stepsDir = path.join(projectDir, "steps");
    const stat = await fs.stat(stepsDir);
    assert.ok(stat.isDirectory());
  });

  it("creates a .md file for each step", async () => {
    for (const step of project.steps) {
      const p = path.join(projectDir, "steps", `${step.id}.md`);
      await assert.doesNotReject(fs.access(p), `Expected ${step.id}.md to exist`);
    }
  });

  it("each step .md contains the goal text", async () => {
    for (const step of project.steps) {
      const p = path.join(projectDir, "steps", `${step.id}.md`);
      const content = await fs.readFile(p, "utf-8");
      assert.ok(
        content.includes(step.goal),
        `Expected step .md for ${step.id} to contain its goal`,
      );
    }
  });

  it("each step .md contains at least one prompt section", async () => {
    for (const step of project.steps) {
      const p = path.join(projectDir, "steps", `${step.id}.md`);
      const content = await fs.readFile(p, "utf-8");
      assert.ok(
        content.includes("## 🤖 Execution prompts") ||
          content.includes("Manual") ||
          content.includes("prompt"),
        `Expected step .md for ${step.id} to include a prompt section`,
      );
    }
  });

  it("each step .md contains success criteria", async () => {
    for (const step of project.steps) {
      const p = path.join(projectDir, "steps", `${step.id}.md`);
      const content = await fs.readFile(p, "utf-8");
      assert.ok(
        content.includes("Criterion one"),
        `Expected step .md for ${step.id} to include success criteria`,
      );
    }
  });

  it("MEMORY.md is not overwritten on second writeProject call", async () => {
    const memPath = path.join(projectDir, "MEMORY.md");
    await fs.appendFile(memPath, "\n## Custom section\nUser-written content.");
    process.cwd = () => tmpBase;
    await writer.writeProject(project);
    process.cwd = originalCwd;
    const content = await fs.readFile(memPath, "utf-8");
    assert.ok(
      content.includes("User-written content."),
      "MEMORY.md should not be overwritten on second call",
    );
  });

  it("creates a reports/ directory", async () => {
    const reportsDir = path.join(projectDir, "reports");
    const stat = await fs.stat(reportsDir);
    assert.ok(stat.isDirectory());
  });
});
