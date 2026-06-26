import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HoldoutVault } from "../src/vault/holdout-vault.ts";
import type { BenchTask } from "../src/types.ts";

const sampleTask: BenchTask = {
  id: "vault-test-001",
  title: "Test task",
  description: "Private holdout task for vault tests",
  language: "python",
  files: ["src/main.py"],
  testCommand: "pytest",
  temporal: { createdAt: "2025-06-01T00:00:00Z", licenseId: "test" },
};

describe("HoldoutVault", () => {
  let vaultDir: string;
  let vault: HoldoutVault;

  beforeEach(async () => {
    vaultDir = await mkdtemp(join(tmpdir(), "benchtrust-vault-"));
    vault = new HoldoutVault({ vaultDir, masterKey: "test-master-key-32chars!!!!" });
    await vault.init();
  });

  afterEach(async () => {
    await rm(vaultDir, { recursive: true, force: true });
  });

  test("encrypt/decrypt roundtrip", () => {
    const blob = vault.encrypt('{"secret": "holdout"}');
    const plain = vault.decrypt(blob);
    expect(JSON.parse(plain)).toEqual({ secret: "holdout" });
  });

  test("store and retrieve task", async () => {
    await vault.storeTask(sampleTask, "test-runner");
    const retrieved = await vault.retrieveTask(sampleTask.id, "test-runner");
    expect(retrieved.id).toBe(sampleTask.id);
    expect(retrieved.title).toBe(sampleTask.title);
    expect(retrieved.description).toBe(sampleTask.description);
  });

  test("listTaskIds returns stored tasks", async () => {
    await vault.storeTask(sampleTask, "test");
    const ids = await vault.listTaskIds();
    expect(ids).toContain(sampleTask.id);
  });

  test("audit log records store and retrieve", async () => {
    await vault.storeTask(sampleTask, "auditor");
    await vault.retrieveTask(sampleTask.id, "auditor");
    const log = await vault.readAuditLog();
    expect(log.length).toBeGreaterThanOrEqual(2);
    expect(log.some((e) => e.action === "store")).toBe(true);
    expect(log.some((e) => e.action === "retrieve")).toBe(true);
  });

  test("different keys produce different ciphertext", async () => {
    const blob1 = vault.encrypt("same plaintext");
    const vault2Dir = vaultDir + "-2";
    const vault2 = new HoldoutVault({
      vaultDir: vault2Dir,
      masterKey: "different-key-32characters!!!",
    });
    await vault2.init();
    const blob2 = vault2.encrypt("same plaintext");
    expect(blob1.ciphertext).not.toBe(blob2.ciphertext);
    await rm(vault2Dir, { recursive: true, force: true });
  });
});
