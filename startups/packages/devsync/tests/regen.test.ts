import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  detectLockfile,
  shouldRegenNodeModules,
  regenNodeModules,
} from "../src/profiles/regen.ts";

describe("node_modules regen (SYNC-029)", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = join(tmpdir(), `devsync-regen-${Date.now()}`);
    mkdirSync(rootDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  test("detects package-lock.json", () => {
    writeFileSync(join(rootDir, "package-lock.json"), "{}");
    const lock = detectLockfile(rootDir);
    expect(lock?.manager).toBe("npm");
  });

  test("shouldRegen on lockfile change only", () => {
    expect(shouldRegenNodeModules(rootDir, "package-lock.json")).toBe(true);
    expect(shouldRegenNodeModules(rootDir, "src/index.ts")).toBe(false);
  });

  test("dry-run regen reports npm ci", () => {
    writeFileSync(join(rootDir, "package-lock.json"), "{}");
    const result = regenNodeModules(rootDir, "package-lock.json", { dryRun: true });
    expect(result.triggered).toBe(true);
    expect(result.packageManager).toBe("npm");
    expect(result.stdout).toContain("npm ci");
  });
});
