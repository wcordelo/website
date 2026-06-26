import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createConflictFile } from "../src/conflict/index.ts";
import { ConflictResolver } from "../src/tui/conflicts.ts";

describe("conflict TUI resolver (SYNC-023)", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = join(tmpdir(), `devsync-tui-${Date.now()}`);
    mkdirSync(join(rootDir, "src"), { recursive: true });
    writeFileSync(join(rootDir, "src", "app.ts"), "const local = true;\n");
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  test("lists conflict files in root", () => {
    createConflictFile(
      join(rootDir, "src", "app.ts"),
      "const local = true;\n",
      "remote-peer",
    );

    const resolver = new ConflictResolver(rootDir);
    const conflicts = resolver.listConflicts();
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]!.originalPath).toBe("src/app.ts");
    expect(conflicts[0]!.peer).toBe("remote-peer");
  });

  test("resolve keep_local writes conflict content to original", () => {
    const original = join(rootDir, "src", "app.ts");
    const { conflictPath } = createConflictFile(
      original,
      "const conflict = true;\n",
      "peer-a",
    );

    const resolver = new ConflictResolver(rootDir);
    resolver.resolve(conflictPath, "keep_local");

    const content = readFileSync(original, "utf8");
    expect(content).toBe("const conflict = true;\n");
  });

  test("formatSummary renders terminal output", () => {
    createConflictFile(
      join(rootDir, "src", "app.ts"),
      "conflict content\n",
      "peer-b",
    );

    const resolver = new ConflictResolver(rootDir);
    const summary = resolver.formatSummary();
    expect(summary).toContain("DevSync Conflicts");
    expect(summary).toContain("peer-b");
  });
});
