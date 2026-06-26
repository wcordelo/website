import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SyncEngine } from "../src/sync/engine.ts";
import type { DevSyncConfig, SyncRoot } from "../src/config.ts";

const FILE_COUNT = 1000;

describe("stress test (SYNC-018)", () => {
  let rootDir: string;
  let transportDir: string;
  let dbPath: string;
  let config: DevSyncConfig;
  let root: SyncRoot;

  beforeEach(() => {
    const id = Date.now();
    rootDir = join(tmpdir(), `devsync-stress-${id}`);
    transportDir = join(tmpdir(), `devsync-transport-${id}`);
    dbPath = join(tmpdir(), `devsync-stress-db-${id}.db`);
    mkdirSync(rootDir, { recursive: true });

    for (let i = 0; i < FILE_COUNT; i++) {
      const subdir = join(rootDir, `dir-${i % 50}`);
      mkdirSync(subdir, { recursive: true });
      writeFileSync(
        join(subdir, `file-${i}.txt`),
        `content-${i}-${"x".repeat(100)}\n`,
      );
    }

    root = {
      id: "stress-root",
      path: rootDir,
      profile: "default",
      paused: false,
      addedAt: new Date().toISOString(),
    };

    config = {
      version: 1,
      deviceId: "stress-device",
      deviceName: "stress-test",
      roots: [root],
      peers: [],
      dangerouslySyncGit: false,
      transportDir,
      daemonSocket: "/tmp/devsync.sock",
    };
  }, 60_000);

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
    rmSync(transportDir, { recursive: true, force: true });
    rmSync(dbPath, { force: true });
  });

  test(
    `scans and indexes ${FILE_COUNT} files within time budget`,
    () => {
      const engine = new SyncEngine(config, { dbPath });

      const start = performance.now();
      const result = engine.scanRoot(root);
      const scanMs = performance.now() - start;

      expect(result.scanned).toBe(FILE_COUNT);
      expect(result.queued).toBe(FILE_COUNT);

      const pushStart = performance.now();
      const pushed = engine.pushPending(root);
      const pushMs = performance.now() - pushStart;

      const files = engine.getState().listFiles(root.id);
      expect(files.length).toBe(FILE_COUNT);
      expect(pushed).toBe(FILE_COUNT);

      // Generous budget for CI: scan < 60s, push < 60s
      expect(scanMs).toBeLessThan(60_000);
      expect(pushMs).toBeLessThan(60_000);

      console.log(
        `SYNC-018 benchmark: ${FILE_COUNT} files — scan ${scanMs.toFixed(0)}ms, push ${pushMs.toFixed(0)}ms`,
      );

      engine.close();
    },
    120_000,
  );
});
