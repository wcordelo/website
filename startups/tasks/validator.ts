import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { TaskCheck, TaskDefinition } from "./types.ts";

const STARTUPS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_ROOT = join(STARTUPS_ROOT, "packages");

function resolvePackagePath(packageName: string, relativePath: string): string {
  return join(PACKAGES_ROOT, packageName, relativePath);
}

function countFiles(dir: string, extension?: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(full, extension);
    } else if (!extension || entry.name.endsWith(extension)) {
      count += 1;
    }
  }
  return count;
}

function packageHasTestTag(packageName: string, taskId: string): boolean {
  const testsDir = join(PACKAGES_ROOT, packageName, "tests");
  const roots = [
    testsDir,
    join(STARTUPS_ROOT, "tests"),
    join(PACKAGES_ROOT, packageName, "src"),
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const stack = [root];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "dist") continue;
          stack.push(full);
        } else if (/\.(ts|tsx|md)$/.test(entry.name)) {
          const content = readFileSync(full, "utf8");
          if (content.includes(taskId)) return true;
        }
      }
    }
  }
  return false;
}

export function runCheck(check: TaskCheck, task: TaskDefinition): string | null {
  const pkg = check.type === "testTagged" ? check.package : task.package;

  switch (check.type) {
    case "file": {
      const full = resolvePackagePath(pkg, check.path);
      if (!existsSync(full)) return `missing file: ${check.path}`;
      return null;
    }
    case "fileContains": {
      const full = resolvePackagePath(pkg, check.path);
      if (!existsSync(full)) return `missing file: ${check.path}`;
      const content = readFileSync(full, "utf8");
      if (!content.includes(check.includes)) {
        return `file ${check.path} missing content: "${check.includes}"`;
      }
      return null;
    }
    case "fileMatches": {
      const full = resolvePackagePath(pkg, check.path);
      if (!existsSync(full)) return `missing file: ${check.path}`;
      const content = readFileSync(full, "utf8");
      const re = new RegExp(check.pattern);
      if (!re.test(content)) {
        return `file ${check.path} does not match /${check.pattern}/`;
      }
      return null;
    }
    case "dirMinFiles": {
      const full = resolvePackagePath(pkg, check.path);
      if (!existsSync(full)) return `missing directory: ${check.path}`;
      const ext = check.glob?.replace("*", "") ?? undefined;
      const count = countFiles(full, ext);
      if (count < check.min) {
        return `directory ${check.path} has ${count} files, expected >= ${check.min}`;
      }
      return null;
    }
    case "jsonMinLength": {
      const full = resolvePackagePath(pkg, check.path);
      if (!existsSync(full)) return `missing json: ${check.path}`;
      const data = JSON.parse(readFileSync(full, "utf8")) as unknown;
      const len = Array.isArray(data) ? data.length : Object.keys(data as object).length;
      if (len < check.min) {
        return `json ${check.path} length ${len} < ${check.min}`;
      }
      return null;
    }
    case "testTagged": {
      if (!packageHasTestTag(check.package, check.taskId)) {
        return `no test references task id ${check.taskId} in package ${check.package}`;
      }
      return null;
    }
    default:
      return "unknown check type";
  }
}

export function validateTask(task: TaskDefinition): string[] {
  const errors: string[] = [];
  for (const check of task.checks) {
    const err = runCheck(check, task);
    if (err) errors.push(err);
  }
  return errors;
}

export function packageRoot(packageName: string): string {
  const root = resolvePackagePath(packageName, ".");
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`unknown package: ${packageName}`);
  }
  return root;
}
