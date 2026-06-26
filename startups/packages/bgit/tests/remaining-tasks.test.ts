import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  storeWrappedKey,
  retrieveWrappedKey,
  detectKeychainBackend,
  FILE_KEYCHAIN_DIR,
} from "../src/crypto/keychain.js";
import { cleanFilter, smudgeFilter } from "../src/git/filters.js";
import { extractFunctions, semanticDiff, parseWithTreeSitter } from "../src/diff/semantic.js";
import { exportAndValidate } from "../src/commands/export.js";
import { detectWorkspaceBackend } from "../src/commands/workspace.js";
import { spawnSync } from "node:child_process";

describe("GIT-018 keychain", () => {
  const service = "bgit-test";
  const account = `test-${Date.now()}`;

  afterEach(() => {
    const path = join(FILE_KEYCHAIN_DIR, `${service}--${account}.json`);
    if (existsSync(path)) rmSync(path);
  });

  test("detects backend", () => {
    const backend = detectKeychainBackend();
    expect(["macos-keychain", "file-fallback"]).toContain(backend);
  });

  test("stores and retrieves wrapped key via file fallback", () => {
    const payload = "wrapped-key-blob-base64";
    const used = storeWrappedKey(service, account, payload);
    expect(used).toBe("file-fallback");
    expect(retrieveWrappedKey(service, account)).toBe(payload);
  });
});

describe("GIT-019 git filters", () => {
  test("smudge replaces placeholders with secrets", () => {
    const out = smudgeFilter("key=bgit-secret:API_KEY\n", {
      resolveSecret: (n) => (n === "API_KEY" ? "secret-value" : ""),
    });
    expect(out).toBe("key=secret-value\n");
  });

  test("clean replaces secrets with placeholders", () => {
    const out = cleanFilter("key=secret-value\n", {
      resolveSecret: (n) => (n === "API_KEY" ? "secret-value" : ""),
      listSecrets: () => ["API_KEY"],
    });
    expect(out).toContain("bgit-secret:");
  });
});

describe("GIT-030 semantic diff", () => {
  const before = `export function hello() {
  return 1;
}
`;

  const after = `export function hello() {
  return 2;
}

export const added = () => 3;
`;

  test("extracts functions from TS", () => {
    const fns = extractFunctions(before, "foo.ts");
    expect(fns.some((f) => f.name === "hello")).toBe(true);
  });

  test("detects added and modified functions", () => {
    const diff = semanticDiff(before, after, "foo.ts");
    expect(diff.parser).toBe("regex");
    expect(diff.functions.find((f) => f.name === "added")?.change).toBe("added");
    expect(diff.functions.find((f) => f.name === "hello")?.change).toBe("modified");
  });

  test("tree-sitter stub returns null", () => {
    expect(parseWithTreeSitter("function x() {}", "javascript")).toBeNull();
  });
});

describe("GIT-027 export", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "bgit-export-test-"));
    spawnSync("git", ["init"], { cwd: dir });
    spawnSync("git", ["config", "user.email", "t@t.dev"], { cwd: dir });
    spawnSync("git", ["config", "user.name", "t"], { cwd: dir });
    const readme = join(dir, "README.md");
    writeFileSync(readme, "# ok\n");
    spawnSync("git", ["add", "README.md"], { cwd: dir });
    spawnSync("git", ["commit", "-m", "init"], { cwd: dir });
    const bgit = join(dir, ".bgit");
    mkdirSync(bgit);
    writeFileSync(join(bgit, "config.yaml"), "version: 0.1.0\n");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("export validates git clone without bgit", () => {
    const outDir = mkdtempSync(join(tmpdir(), "bgit-export-out-"));
    const result = exportAndValidate(dir, outDir);
    expect(result.git_compatible).toBe(true);
    expect(existsSync(join(outDir, ".bgit"))).toBe(false);
    expect(result.checks.find((c) => c.name === "git clone")?.ok).toBe(true);
    rmSync(outDir, { recursive: true, force: true });
  });
});

describe("GIT-029 workspace backend", () => {
  test("defaults to git-worktree without jj", () => {
    const dir = mkdtempSync(join(tmpdir(), "bgit-ws-"));
    spawnSync("git", ["init"], { cwd: dir });
    expect(detectWorkspaceBackend(dir)).toBe("git-worktree");
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("GIT docs deliverables", () => {
  test("design partner program exists", () => {
    const p = join(import.meta.dir, "..", "gtm", "design-partner-program.md");
    const content = readFileSync(p, "utf8");
    expect(content).toContain("Agreement Template");
    expect(content).toContain("Feedback Cadence");
  });

  test("launch blog exists", () => {
    const p = join(import.meta.dir, "..", "content", "launch-blog.md");
    const content = readFileSync(p, "utf8");
    expect(content).toContain("Git Was Not Built For Agents");
  });
});
