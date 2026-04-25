import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";

// We need to override CWD so paths.ts uses our temp dir
// We do this by monkeypatching process.cwd before importing storage

let tempDir: string;

// Create temp workspace before all tests
const tmpBase = path.join(os.tmpdir(), `plangraph-storage-${Date.now()}`);
const originalCwd = process.cwd;

// Override cwd to point to our temp dir so Storage uses it
process.cwd = () => tmpBase;

import { Storage } from "../storage.js";
import type { UserProfile, Project, ProjectMeta } from "../../types.js";

function makeProfile(): UserProfile {
  return {
    level: "intermediate",
    languages: ["TypeScript"],
    tools: ["claude-code"],
    preferredLocale: "en",
    communicationStyle: "concise",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeProject(id: string): Project {
  const meta: ProjectMeta = {
    id,
    name: "Test Project",
    idea: "A test idea",
    rootPath: path.join(tmpBase, "workspace", "projects", id),
    templateId: "nextjs-saas",
    locale: "en",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    selectedExecutor: "manual",
  };
  return { meta, steps: [], edges: [], executionOrder: [], memory: [] };
}

describe("Storage", () => {
  before(async () => {
    await fs.mkdir(path.join(tmpBase, "workspace", "projects"), { recursive: true });
  });

  it("readProfile returns null when no profile file", async () => {
    const store = new Storage();
    const result = await store.readProfile();
    assert.equal(result, null);
  });

  it("writeProfile then readProfile round-trips correctly", async () => {
    const store = new Storage();
    const profile = makeProfile();
    await store.writeProfile(profile);
    const read = await store.readProfile();
    assert.deepEqual(read, profile);
  });

  it("writeProject then readProject round-trips", async () => {
    const store = new Storage();
    const project = makeProject("test-proj-001");
    await store.writeProject(project);
    const read = await store.readProject("test-proj-001");
    assert.equal(read?.meta.id, "test-proj-001");
    assert.equal(read?.meta.name, "Test Project");
  });

  it("listProjects returns only ProjectMeta objects", async () => {
    const store = new Storage();
    const p1 = makeProject("list-test-001");
    const p2 = makeProject("list-test-002");
    await store.writeProject(p1);
    await store.writeProject(p2);
    const list = await store.listProjects();
    assert.ok(list.length >= 2);
    for (const meta of list) {
      assert.ok(typeof meta.id === "string");
      assert.ok(typeof meta.name === "string");
    }
  });

  it("appendMemory appends without losing prior content", async () => {
    const store = new Storage();
    const projectId = "memory-test-001";
    await store.writeProject(makeProject(projectId));

    await store.appendMemory(projectId, {
      stepId: "step_01",
      category: "decision",
      text: "Used TypeScript strict mode",
      createdAt: new Date().toISOString(),
    });

    await store.appendMemory(projectId, {
      stepId: "step_02",
      category: "convention",
      text: "All files use .ts extension",
      createdAt: new Date().toISOString(),
    });

    const memory = await store.readMemory(projectId);
    assert.ok(memory.includes("Used TypeScript strict mode"));
    assert.ok(memory.includes("All files use .ts extension"));
  });

  it("appendAudit appends a JSON line", async () => {
    const store = new Storage();
    const projectId = "audit-test-001";
    await store.writeProject(makeProject(projectId));

    await store.appendAudit(
      {
        timestamp: new Date().toISOString(),
        action: "STEP_STARTED",
        projectId,
        stepId: "step_01",
      },
      projectId
    );

    const { getAuditFile } = await import("../paths.js");
    const logPath = getAuditFile(projectId);
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim().split("\n")[0]);
    assert.equal(parsed.action, "STEP_STARTED");
  });

  // Restore cwd after tests
  it("cleanup: restore cwd", () => {
    process.cwd = originalCwd;
    assert.ok(true);
  });
});
