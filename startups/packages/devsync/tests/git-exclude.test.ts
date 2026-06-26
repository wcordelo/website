import { describe, expect, test } from "bun:test";
import {
  isGitInternalPath,
  shouldExcludeGit,
  gitLockPath,
} from "../src/ignore/git-exclude.ts";
import { shouldIgnore } from "../src/ignore/index.ts";

describe("git hard-exclude (SYNC-007)", () => {
  test("detects .git directory paths", () => {
    expect(isGitInternalPath(".git")).toBe(true);
    expect(isGitInternalPath(".git/config")).toBe(true);
    expect(isGitInternalPath(".git/objects/pack/pack-abc.idx")).toBe(true);
    expect(isGitInternalPath("src/index.ts")).toBe(false);
  });

  test("detects nested git worktrees", () => {
    expect(isGitInternalPath("submodule/.git")).toBe(true);
    expect(isGitInternalPath("packages/foo/.git/HEAD")).toBe(true);
  });

  test("shouldExcludeGit returns true by default", () => {
    expect(shouldExcludeGit(".git/index", false)).toBe(true);
    expect(shouldExcludeGit("src/main.rs", false)).toBe(false);
  });

  test("dangerouslySyncGit allows .git paths", () => {
    expect(shouldExcludeGit(".git/config", true)).toBe(false);
    expect(shouldExcludeGit(".git/index", true)).toBe(false);
  });

  test("detects index.lock paths", () => {
    expect(gitLockPath(".git/index.lock")).toBe(true);
    expect(gitLockPath("sub/.git/index.lock")).toBe(true);
    expect(gitLockPath("src/index.ts")).toBe(false);
  });

  test("shouldIgnore excludes .git even when not in gitignore", () => {
    const ctx = {
      rootDir: "/tmp/project",
      profile: "default" as const,
      dangerouslySyncGit: false,
    };
    expect(shouldIgnore(ctx, "/tmp/project/.git/config")).toBe(true);
    expect(shouldIgnore(ctx, "/tmp/project/.git", true)).toBe(true);
    expect(shouldIgnore(ctx, "/tmp/project/README.md")).toBe(false);
  });

  test(".gitignore cannot override git hard-exclude", () => {
    const ctx = {
      rootDir: "/tmp/project",
      profile: "minimal" as const,
      dangerouslySyncGit: false,
    };
    // Even if someone adds !.git to gitignore, hard exclude wins first
    expect(shouldIgnore(ctx, "/tmp/project/.git/HEAD")).toBe(true);
  });

  test("profile patterns do not affect .git exclusion", () => {
    const ctx = {
      rootDir: "/tmp/project",
      profile: "node_regen" as const,
      dangerouslySyncGit: false,
    };
    expect(shouldIgnore(ctx, "/tmp/project/.git/refs/heads/main")).toBe(true);
  });
});
