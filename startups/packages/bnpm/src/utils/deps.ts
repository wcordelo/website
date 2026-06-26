import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ResolvedDeps {
  fromLockfile: boolean;
  dependencies: Array<{ name: string; version: string }>;
}

export function readPackageJsonDeps(cwd: string): Array<{ name: string; version: string }> {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return [];

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<
    string,
    Record<string, string> | undefined
  >;

  const sections = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ] as const;

  const deps: Array<{ name: string; version: string }> = [];
  for (const section of sections) {
    const block = pkg[section];
    if (!block) continue;
    for (const [name, version] of Object.entries(block)) {
      deps.push({ name, version });
    }
  }
  return deps;
}

/** Best-effort lockfile parse for block gate pre-check (not full arborist). */
export function readLockfileDeps(cwd: string): ResolvedDeps {
  const lockPath = join(cwd, "package-lock.json");
  if (!existsSync(lockPath)) {
    return { fromLockfile: false, dependencies: readPackageJsonDeps(cwd) };
  }

  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf-8")) as {
      packages?: Record<string, { version?: string }>;
    };

    const deps: Array<{ name: string; version: string }> = [];
    if (lock.packages) {
      for (const [path, meta] of Object.entries(lock.packages)) {
        if (!meta.version) continue;
        const name = path === "" ? null : path.replace(/^node_modules\//, "");
        if (!name) continue;
        deps.push({ name, version: meta.version });
      }
    }

    if (deps.length > 0) {
      return { fromLockfile: true, dependencies: deps };
    }
  } catch {
    // fall through
  }

  return { fromLockfile: false, dependencies: readPackageJsonDeps(cwd) };
}

export function collectInstallTargets(
  cwd: string,
  extraPackages: string[],
): Array<{ name: string; version: string }> {
  const base = readLockfileDeps(cwd).dependencies;
  const extra = extraPackages
    .filter((p) => !p.startsWith("-"))
    .map((spec) => {
      const at = spec.lastIndexOf("@");
      if (at <= 0) return { name: spec, version: "*" };
      return { name: spec.slice(0, at), version: spec.slice(at + 1) };
    });

  const seen = new Set<string>();
  const merged: Array<{ name: string; version: string }> = [];
  for (const dep of [...base, ...extra]) {
    const key = `${dep.name}@${dep.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(dep);
  }
  return merged;
}
