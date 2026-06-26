import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SyncEngine } from "../src/sync/engine.ts";
import type { DevSyncConfig, SyncRoot } from "../src/config.ts";
import {
  isGitIndexLocked,
  checkGitLock,
  shouldPauseForGitLock,
} from "../src/sync/git-lock.ts";

describe("git lock awareness (SYNC-016)", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = join(tmpdir(), `devsync-lock-${Date.now()}`);
    mkdirSync(join(rootDir, ".git"), { recursive: true });
    writeFileSync(join(rootDir, "src.ts"), "export {};\n");
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  test("no lock when index.lock absent", () => {
    expect(isGitIndexLocked(rootDir)).toBe(false);
    expect(shouldPauseForGitLock(rootDir)).toBe(false);
    const status = checkGitLock(rootDir);
    expect(status.locked).toBe(false);
  });

  test("detects index.lock and pauses sync", () => {
    writeFileSync(join(rootDir, ".git", "index.lock"), "locked\n");
    expect(isGitIndexLocked(rootDir)).toBe(true);
    expect(shouldPauseForGitLock(rootDir)).toBe(true);
    const status = checkGitLock(rootDir);
    expect(status.locked).toBe(true);
    expect(status.reason).toContain("index lock");
  });

  test("engine scan pauses when git lock present", () => {
    writeFileSync(join(rootDir, ".git", "index.lock"), "locked\n");

    const config: DevSyncConfig = {
      version: 1,
      deviceId: "device-a",
      deviceName: "test",
      roots: [],
      peers: [],
      dangerouslySyncGit: false,
      transportDir: join(tmpdir(), `devsync-transport-${Date.now()}`),
      daemonSocket: "/tmp/devsync.sock",
    };

    const root: SyncRoot = {
      id: "root-1",
      path: rootDir,
      profile: "default",
      paused: false,
      addedAt: new Date().toISOString(),
    };

    const engine = new SyncEngine({ ...config, roots: [root] });
    const result = engine.scanRoot(root);
    engine.close();

    expect(result.paused).toBe(true);
    expect(result.gitLock?.locked).toBe(true);
    expect(result.scanned).toBe(0);
  });
});
