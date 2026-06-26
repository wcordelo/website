import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export function findGitRoot(start = process.cwd()): string | null {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) return null;
    dir = parent;
  }
}

export function requireGitRoot(): string {
  const root = findGitRoot();
  if (!root) throw new Error("not a git repository (or any parent up to mount point)");
  return root;
}

export function bgitDir(repoRoot: string): string {
  return join(repoRoot, ".bgit");
}

export function requireBgit(repoRoot: string): string {
  const dir = bgitDir(repoRoot);
  if (!existsSync(dir)) throw new Error(".bgit not initialized — run `bgit init`");
  return dir;
}
