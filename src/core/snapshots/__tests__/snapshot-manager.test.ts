import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { SnapshotManager } from "../snapshot-manager";

async function makeProjectRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plangraph-snapshots-"));
  await fs.writeFile(path.join(root, "README.md"), "# Test project\n", "utf8");
  return root;
}

describe("SnapshotManager", () => {
  it("creates a PlanGraph tag for a snapshot", async () => {
    const root = await makeProjectRoot();
    const manager = new SnapshotManager(root);

    const result = await manager.snapshot("before-setup");
    const snapshots = await manager.listSnapshots();

    assert.match(result.tag, /^plangraph\/before-setup-/);
    assert.equal(snapshots[0].tag, result.tag);
    assert.match(snapshots[0].subject, /PlanGraph: before-setup/);
  });

  it("rolls back to a confirmed snapshot", async () => {
    const root = await makeProjectRoot();
    const manager = new SnapshotManager(root);
    const first = await manager.snapshot("before-edit");
    const filePath = path.join(root, "README.md");

    await fs.writeFile(filePath, "# Changed\n", "utf8");
    await manager.snapshot("after-edit");
    await manager.rollbackConfirmed(first.tag);

    const content = (await fs.readFile(filePath, "utf8")).replace(/\r\n/g, "\n");
    assert.equal(content, "# Test project\n");
  });
});
