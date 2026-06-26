import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface BumpOptions {
  packages: Record<string, string>;
}

export function bumpPackageJson(projectPath: string, options: BumpOptions): string[] {
  const pkgPath = join(projectPath, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const changed: string[] = [];

  for (const [name, version] of Object.entries(options.packages)) {
    if (pkg.dependencies?.[name] !== undefined) {
      pkg.dependencies[name] = version;
      changed.push(`${name} → ${version}`);
    } else if (pkg.devDependencies?.[name] !== undefined) {
      pkg.devDependencies[name] = version;
      changed.push(`${name} → ${version} (dev)`);
    } else if (name === "expo" || name === "react-native") {
      pkg.dependencies ??= {};
      pkg.dependencies[name] = version;
      changed.push(`${name} → ${version} (added)`);
    }
  }

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return changed;
}

export function previewPackageJsonBump(
  projectPath: string,
  options: BumpOptions,
): string[] {
  const pkgPath = join(projectPath, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const preview: string[] = [];
  for (const [name, version] of Object.entries(options.packages)) {
    const current =
      pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? "(missing)";
    preview.push(`${name}: ${current} → ${version}`);
  }
  return preview;
}
