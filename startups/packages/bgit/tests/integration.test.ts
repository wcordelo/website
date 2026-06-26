import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

function runGit(cwd: string, args: string[]) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
}

function runBgit(cwd: string, args: string[]) {
  const cli = join(import.meta.dir, "..", "src", "cli.ts");
  return spawnSync("bun", [cli, ...args], { cwd, encoding: "utf8", env: { ...process.env, BGIT_MASTER_KEY: "test-key-32-chars-long!!!!!!" } });
}

describe("bgit integration", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "bgit-test-"));
    runGit(dir, ["init"]);
    runGit(dir, ["config", "user.email", "test@bgit.dev"]);
    runGit(dir, ["config", "user.name", "bgit test"]);
    writeFileSync(join(dir, "README.md"), "# test\n");
    runGit(dir, ["add", "README.md"]);
    runGit(dir, ["commit", "-m", "initial"]);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("init creates .bgit layout", () => {
    const r = runBgit(dir, ["init", "--json"]);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.ok).toBe(true);
    expect(out.initialized).toBe(true);
    expect(out.bgit_dir).toContain(".bgit");
    expect(out.filter_installed).toBe(true);
  });

  test("session lifecycle with checkpoint and why", () => {
    runBgit(dir, ["init"]);
    const start = runBgit(dir, ["session", "start", "--goal", "add feature", "--json"]);
    const started = JSON.parse(start.stdout);
    const sessionId = started.session_id as string;

    writeFileSync(join(dir, "feature.ts"), "export const x = 1;\n");
    runGit(dir, ["add", "feature.ts"]);

    const cp = runBgit(dir, ["checkpoint", "add feature file", "--json"]);
    expect(cp.status).toBe(0);

    const why = runBgit(dir, ["why", "feature.ts", "--json"]);
    const whyOut = JSON.parse(why.stdout);
    expect(whyOut.session_id).toBe(sessionId);
    expect(whyOut.intent).toBe("add feature");

    const trace = runBgit(dir, ["trace", sessionId, "--json"]);
    const traceOut = JSON.parse(trace.stdout);
    expect(traceOut.session_id).toBe(sessionId);
    expect(traceOut.checkpoints.length).toBeGreaterThan(0);

    const end = runBgit(dir, ["session", "end", "--json"]);
    expect(end.status).toBe(0);
    const ended = JSON.parse(end.stdout);
    expect(ended.session_id).toBe(sessionId);
  });

  test("secret set and get", () => {
    runBgit(dir, ["init"]);
    const set = runBgit(dir, ["secret", "set", "API_KEY", "secret-value", "--json"]);
    expect(set.status).toBe(0);
    const get = runBgit(dir, ["secret", "get", "API_KEY", "--json"]);
    const got = JSON.parse(get.stdout);
    expect(got.value).toBe("secret-value");
  });

  test("session end with squash", () => {
    runBgit(dir, ["init"]);
    runBgit(dir, ["session", "start", "--goal", "squash test"]);
    writeFileSync(join(dir, "a.txt"), "a\n");
    runGit(dir, ["add", "a.txt"]);
    runBgit(dir, ["checkpoint", "--json"]);
    const end = runBgit(dir, ["session", "end", "--squash", "--json"]);
    const out = JSON.parse(end.stdout);
    expect(out.squashed).toBe(true);
    expect(out.final_commit).toBeTruthy();
  });

  test("export validates git compatibility", () => {
    runBgit(dir, ["init"]);
    const r = runBgit(dir, ["export", "--json"]);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.git_compatible).toBe(true);
    expect(out.checks.some((c: { name: string; ok: boolean }) => c.name === "git clone" && c.ok)).toBe(true);
  });
});
