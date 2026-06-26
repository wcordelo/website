import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import { git } from "../git/run.js";

export interface ExportValidation {
  export_path: string;
  clone_path: string;
  git_compatible: boolean;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
}

function runGit(cwd: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { ok: r.status === 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Export repo without .bgit overlay and verify plain git clone works. */
export function exportAndValidate(repoRoot: string, outputDir?: string): ExportValidation {
  const exportPath = outputDir ?? mkdtempSync(join(tmpdir(), "bgit-export-"));
  const clonePath = join(exportPath, "clone-test");

  cpSync(repoRoot, exportPath, {
    recursive: true,
    filter: (src) => !src.endsWith("/.bgit") && !src.includes("/.bgit/"),
  });

  const bgitPath = join(exportPath, ".bgit");
  if (existsSync(bgitPath)) rmSync(bgitPath, { recursive: true, force: true });

  const checks: ExportValidation["checks"] = [];

  const status = runGit(exportPath, ["status", "--porcelain"]);
  checks.push({ name: "git status", ok: status.ok, detail: status.stderr || "clean" });

  const log = runGit(exportPath, ["log", "--oneline", "-1"]);
  checks.push({ name: "git log", ok: log.ok && log.stdout.length > 0, detail: log.stdout.trim() });

  const barePath = join(exportPath, "bare.git");
  const initBare = runGit(exportPath, ["init", "--bare", barePath]);
  checks.push({ name: "git init --bare", ok: initBare.ok });

  if (initBare.ok) {
    runGit(exportPath, ["remote", "add", "export-bare", barePath]);
    const push = runGit(exportPath, ["push", "export-bare", "HEAD:refs/heads/main", "--force"]);
    checks.push({ name: "git push to bare", ok: push.ok, detail: push.stderr });

    const clone = runGit(exportPath, ["clone", barePath, clonePath]);
    checks.push({ name: "git clone", ok: clone.ok, detail: clone.stderr });

    if (clone.ok) {
      const cloneStatus = runGit(clonePath, ["status"]);
      checks.push({ name: "clone git status", ok: cloneStatus.ok });
      const hasBgit = existsSync(join(clonePath, ".bgit"));
      checks.push({ name: "no .bgit in clone", ok: !hasBgit });
    }
  }

  const gitCompatible = checks.every((c) => c.ok);
  return { export_path: exportPath, clone_path: clonePath, git_compatible: gitCompatible, checks };
}

export async function exportCommand(options: OutputOptions, outputDir?: string): Promise<void> {
  const repoRoot = requireGitRoot();
  requireBgit(repoRoot);

  const result = exportAndValidate(repoRoot, outputDir);
  if (!result.git_compatible) {
    const failed = result.checks.filter((c) => !c.ok).map((c) => c.name).join(", ");
    emitError(`git compatibility check failed: ${failed}`, options);
  }

  emit(result, options, `export validated — git clone works without bgit\npath: ${result.export_path}`);
}

/** Assert that exported tree has no bgit-specific breakage. */
export function assertNoBgitRefs(repoRoot: string): boolean {
  const refs = git(repoRoot, ["for-each-ref", "--format=%(refname)", "refs/bgit/"]);
  return refs.code !== 0 || refs.stdout.length === 0;
}
