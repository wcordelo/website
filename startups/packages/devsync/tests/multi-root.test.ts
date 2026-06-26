import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SyncEngine } from "../src/sync/engine.ts";
import type { DevSyncConfig, SyncRoot } from "../src/config.ts";

describe("multi-root support (SYNC-021)", () => {
  let rootDir: string;
  let transportDir: string;
  let dbPath: string;
  let config: DevSyncConfig;
  let roots: SyncRoot[];

  beforeEach(() => {
    const ts = Date.now();
    rootDir = join(tmpdir(), `devsync-multi-${ts}`);
    transportDir = join(tmpdir(), `devsync-transport-${ts}`);
    dbPath = join(tmpdir(), `devsync-state-${ts}.db`);

    const rootPaths = ["alpha", "beta", "gamma"].map((name) => {
      const path = join(rootDir, name);
      mkdirSync(join(path, "src"), { recursive: true });
      writeFileSync(join(path, "src", "index.ts"), `// ${name}\n`);
      writeFileSync(join(path, "README.md"), `# ${name}\n`);
      return path;
    });

    roots = rootPaths.map((path, i) => ({
      id: `root-${ts}-${i}`,
      path,
      profile: "default" as const,
      paused: false,
      addedAt: new Date().toISOString(),
    }));

    config = {
      version: 1,
      deviceId: "multi-device",
      deviceName: "test-multi",
      roots,
      peers: [],
      dangerouslySyncGit: false,
      transportDir,
      daemonSocket: "/tmp/devsync.sock",
    };
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
    rmSync(transportDir, { recursive: true, force: true });
    rmSync(dbPath, { force: true });
  });

  test("three roots scan independently", () => {
    const engine = new SyncEngine({ ...config }, { dbPath });
    const results = roots.map((r) => engine.scanRoot(r));

    expect(results[0]!.scanned).toBe(2);
    expect(results[1]!.scanned).toBe(2);
    expect(results[2]!.scanned).toBe(2);

    for (const root of roots) {
      const files = engine.getState().listFiles(root.id);
      expect(files.length).toBe(2);
    }

    engine.close();
  });

  test("pausing one root does not affect others", () => {
    roots[1]!.paused = true;
    const engine = new SyncEngine({ ...config, roots }, { dbPath });

    const r0 = engine.scanRoot(roots[0]!);
    const r1 = engine.scanRoot(roots[1]!);
    const r2 = engine.scanRoot(roots[2]!);

    expect(r0.paused).toBe(false);
    expect(r0.scanned).toBe(2);
    expect(r1.paused).toBe(true);
    expect(r1.scanned).toBe(0);
    expect(r2.scanned).toBe(2);

    engine.close();
  });

  test("transport namespaces are isolated per root", () => {
    const engine = new SyncEngine({ ...config }, { dbPath });
    for (const root of roots) {
      engine.scanRoot(root);
      engine.pushPending(root);
    }

    const transport = engine.getTransport();
    for (const root of roots) {
      const remote = transport.listRemoteFiles(root.id);
      expect(remote.length).toBeGreaterThan(0);
    }

    engine.close();
  });
});
