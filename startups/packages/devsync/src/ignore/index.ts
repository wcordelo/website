import { join, relative } from "node:path";
import type { IgnoreProfile } from "../config.ts";
import { shouldExcludeGit } from "./git-exclude.ts";
import { loadGitignoreChain } from "./gitignore.ts";
import { profileMatcher } from "./profiles.ts";

export { parseGitignore, createMatcher, loadGitignoreFile } from "./gitignore.ts";
export { shouldExcludeGit, isGitInternalPath, gitLockPath } from "./git-exclude.ts";
export { PROFILE_PATTERNS, profileMatcher, describeProfile } from "./profiles.ts";

export interface IgnoreContext {
  rootDir: string;
  profile: IgnoreProfile;
  dangerouslySyncGit: boolean;
}

/**
 * Determine if a file should be excluded from sync.
 * Order: git hard-exclude → profile → .gitignore chain.
 */
export function shouldIgnore(
  ctx: IgnoreContext,
  absolutePath: string,
  isDirectory = false,
): boolean {
  const rel = relative(ctx.rootDir, absolutePath);
  if (!rel || rel.startsWith("..")) return true;

  if (shouldExcludeGit(rel, ctx.dangerouslySyncGit)) return true;

  const profile = profileMatcher(ctx.profile);
  if (profile.isIgnored(rel, isDirectory)) return true;

  const gitignore = loadGitignoreChain(ctx.rootDir, absolutePath);
  if (gitignore.isIgnored(rel, isDirectory)) return true;

  return false;
}

export function listIgnoredReasons(
  ctx: IgnoreContext,
  absolutePath: string,
  isDirectory = false,
): string[] {
  const reasons: string[] = [];
  const rel = relative(ctx.rootDir, absolutePath);
  if (!rel || rel.startsWith("..")) return ["outside root"];

  if (shouldExcludeGit(rel, ctx.dangerouslySyncGit)) {
    reasons.push("git hard-exclude (SYNC-007)");
  }

  const profile = profileMatcher(ctx.profile);
  if (profile.isIgnored(rel, isDirectory)) {
    reasons.push(`profile: ${ctx.profile}`);
  }

  const gitignore = loadGitignoreChain(ctx.rootDir, absolutePath);
  if (gitignore.isIgnored(rel, isDirectory)) {
    reasons.push(".gitignore");
  }

  return reasons;
}

export function gitignorePath(rootDir: string): string {
  return join(rootDir, ".gitignore");
}
