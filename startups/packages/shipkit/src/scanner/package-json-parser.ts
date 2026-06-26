import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ParsedPackageJson {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  allDependencies: Record<string, string>;
}

export function parsePackageJson(projectPath: string): ParsedPackageJson | null {
  const pkgPath = join(projectPath, "package.json");
  if (!existsSync(pkgPath)) return null;

  const raw = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };

  const dependencies = raw.dependencies ?? {};
  const devDependencies = raw.devDependencies ?? {};
  const peerDependencies = raw.peerDependencies ?? {};

  return {
    name: raw.name ?? "unknown",
    version: raw.version ?? "0.0.0",
    dependencies,
    devDependencies,
    peerDependencies,
    allDependencies: { ...dependencies, ...devDependencies, ...peerDependencies },
  };
}

export function parseLockfileVersions(projectPath: string): Record<string, string> {
  const versions: Record<string, string> = {};
  const lockPaths = [
    join(projectPath, "bun.lock"),
    join(projectPath, "package-lock.json"),
    join(projectPath, "yarn.lock"),
  ];

  for (const lockPath of lockPaths) {
    if (!existsSync(lockPath)) continue;
    const content = readFileSync(lockPath, "utf-8");

    if (lockPath.endsWith("package-lock.json")) {
      try {
        const lock = JSON.parse(content) as {
          packages?: Record<string, { version?: string }>;
        };
        for (const [pkgPath, info] of Object.entries(lock.packages ?? {})) {
          const name = pkgPath.replace("node_modules/", "");
          if (name && info.version) versions[name] = info.version;
        }
      } catch {
        // ignore malformed lockfile
      }
    } else if (lockPath.endsWith("bun.lock")) {
      const matches = content.matchAll(/"([^"]+)"@([^"]+)/g);
      for (const match of matches) {
        const name = match[1];
        const version = match[2];
        if (name && version) versions[name] = version;
      }
    }
  }

  return versions;
}
