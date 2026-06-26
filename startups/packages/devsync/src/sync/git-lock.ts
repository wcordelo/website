import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * SYNC-016: Git lock awareness — pause sync when `.git/index.lock` is present.
 * Git creates this lock during index writes (commit, merge, rebase, etc.).
 */
export const GIT_INDEX_LOCK = ".git/index.lock";

export function gitIndexLockPath(rootPath: string): string {
  return join(rootPath, ".git", "index.lock");
}

export function isGitIndexLocked(rootPath: string): boolean {
  return existsSync(gitIndexLockPath(rootPath));
}

export interface GitLockStatus {
  locked: boolean;
  lockPath: string | null;
  reason: string | null;
}

export function checkGitLock(rootPath: string): GitLockStatus {
  const lockPath = gitIndexLockPath(rootPath);
  if (existsSync(lockPath)) {
    return {
      locked: true,
      lockPath,
      reason: "Git index lock present — sync paused until lock is released",
    };
  }
  return { locked: false, lockPath: null, reason: null };
}

/** Returns true when sync operations should be skipped for this root. */
export function shouldPauseForGitLock(rootPath: string): boolean {
  return isGitIndexLocked(rootPath);
}
