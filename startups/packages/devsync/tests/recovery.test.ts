import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SyncState } from "../src/sync/state.ts";
import { FileBasedQuicTransport } from "../src/transport/quic.ts";
import { TransferRecovery } from "../src/sync/recovery.ts";
import type { SyncRoot } from "../src/config.ts";

describe("crash recovery (SYNC-017)", () => {
  let rootDir: string;
  let transportDir: string;
  let dbPath: string;

  beforeEach(() => {
    const id = Date.now();
    rootDir = join(tmpdir(), `devsync-recovery-${id}`);
    transportDir = join(tmpdir(), `devsync-quic-${id}`);
    dbPath = join(tmpdir(), `devsync-recovery-${id}.db`);
    mkdirSync(rootDir, { recursive: true });
    writeFileSync(join(rootDir, "data.txt"), "chunked content for recovery test\n");
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
    rmSync(transportDir, { recursive: true, force: true });
    if (existsSync(dbPath)) rmSync(dbPath);
  });

  test("records partial chunk progress and resumes transfer", () => {
    const state = new SyncState(dbPath);
    const transport = new FileBasedQuicTransport("device-a", transportDir);
    const recovery = new TransferRecovery(state, transport);

    const transferId = recovery.beginTransfer("root-1", "data.txt", "push", 3);
    recovery.recordChunk(transferId, 0);
    recovery.recordChunk(transferId, 1);

    const partials = recovery.listInterrupted("root-1");
    expect(partials.length).toBe(1);
    expect(partials[0]!.completedChunks).toEqual([0, 1]);

    const root: SyncRoot = {
      id: "root-1",
      path: rootDir,
      profile: "default",
      paused: false,
      addedAt: new Date().toISOString(),
    };

    const result = recovery.recoverRoot(root);
    expect(result.resumed).toBe(1);
    expect(result.completed).toBe(1);

    const completed = recovery.listInterrupted("root-1");
    expect(completed.length).toBe(0);

    state.close();
  });

  test("fails recovery when source file missing", () => {
    const state = new SyncState(dbPath);
    const transport = new FileBasedQuicTransport("device-a", transportDir);
    const recovery = new TransferRecovery(state, transport);

    recovery.beginTransfer("root-1", "missing.txt", "push", 1);

    const root: SyncRoot = {
      id: "root-1",
      path: rootDir,
      profile: "default",
      paused: false,
      addedAt: new Date().toISOString(),
    };

    const result = recovery.recoverRoot(root);
    expect(result.failed).toBe(1);

    state.close();
  });
});
