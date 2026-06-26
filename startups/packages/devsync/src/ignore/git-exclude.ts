import { sep } from "node:path";

/**
 * SYNC-007: Hard-exclude .git/ directories from sync.
 * Never synced unless dangerouslySyncGit is explicitly enabled.
 */
export const GIT_DIR_NAMES = [".git"] as const;

export function isGitInternalPath(relativePath: string): boolean {
  const normalized = relativePath.split(sep).join("/");
  const segments = normalized.split("/").filter(Boolean);

  for (const segment of segments) {
    if (GIT_DIR_NAMES.includes(segment as (typeof GIT_DIR_NAMES)[number])) {
      return true;
    }
  }

  return false;
}

export function shouldExcludeGit(
  relativePath: string,
  dangerouslySyncGit: boolean,
): boolean {
  if (dangerouslySyncGit) return false;
  return isGitInternalPath(relativePath);
}

export function gitLockPath(relativePath: string): boolean {
  const normalized = relativePath.split(sep).join("/");
  return (
    normalized === ".git/index.lock" ||
    normalized.endsWith("/.git/index.lock") ||
    normalized.includes(".git/index.lock")
  );
}
