import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface RegenResult {
  triggered: boolean;
  packageManager: PackageManager | null;
  lockfile: string | null;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  reason: string;
}

const LOCKFILES: { file: string; manager: PackageManager; installCmd: string[] }[] = [
  { file: "package-lock.json", manager: "npm", installCmd: ["npm", "ci"] },
  { file: "pnpm-lock.yaml", manager: "pnpm", installCmd: ["pnpm", "install", "--frozen-lockfile"] },
  { file: "yarn.lock", manager: "yarn", installCmd: ["yarn", "install", "--frozen-lockfile"] },
  { file: "bun.lockb", manager: "bun", installCmd: ["bun", "install", "--frozen-lockfile"] },
  { file: "bun.lock", manager: "bun", installCmd: ["bun", "install", "--frozen-lockfile"] },
];

/**
 * SYNC-029: node_modules regen profile — trigger install when lockfile syncs.
 * Used with `node_regen` ignore profile: peers receive lockfiles, not node_modules.
 */
export function detectLockfile(rootPath: string): (typeof LOCKFILES)[number] | null {
  for (const entry of LOCKFILES) {
    if (existsSync(join(rootPath, entry.file))) {
      return entry;
    }
  }
  return null;
}

export function shouldRegenNodeModules(
  _rootPath: string,
  changedRelativePath: string,
): boolean {
  const basename = changedRelativePath.split("/").pop() ?? changedRelativePath;
  return LOCKFILES.some((l) => l.file === basename);
}

export interface RegenOptions {
  dryRun?: boolean;
  cwd?: string;
}

export function regenNodeModules(
  rootPath: string,
  changedRelativePath: string,
  options: RegenOptions = {},
): RegenResult {
  const cwd = options.cwd ?? rootPath;

  if (!shouldRegenNodeModules(rootPath, changedRelativePath)) {
    return {
      triggered: false,
      packageManager: null,
      lockfile: null,
      exitCode: null,
      stdout: "",
      stderr: "",
      reason: "not a lockfile change",
    };
  }

  const lock = detectLockfile(rootPath);
  if (!lock) {
    return {
      triggered: false,
      packageManager: null,
      lockfile: changedRelativePath,
      exitCode: null,
      stdout: "",
      stderr: "",
      reason: "no supported lockfile found in root",
    };
  }

  if (options.dryRun) {
    return {
      triggered: true,
      packageManager: lock.manager,
      lockfile: lock.file,
      exitCode: 0,
      stdout: `[dry-run] would run: ${lock.installCmd.join(" ")}`,
      stderr: "",
      reason: "dry run",
    };
  }

  const result = spawnSync(lock.installCmd[0]!, lock.installCmd.slice(1), {
    cwd,
    encoding: "utf8",
    timeout: 300_000,
  });

  return {
    triggered: true,
    packageManager: lock.manager,
    lockfile: lock.file,
    exitCode: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    reason: result.status === 0 ? "install completed" : "install failed",
  };
}

/** Compare lockfile hash to detect remote sync (for watcher integration). */
export function lockfileHash(rootPath: string): string | null {
  const lock = detectLockfile(rootPath);
  if (!lock) return null;
  const content = readFileSync(join(rootPath, lock.file));
  return Bun.hash(content).toString(16);
}
