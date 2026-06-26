import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot } from "../workspace.js";

export type WorkspaceBackend = "jj" | "git-worktree";

function commandExists(cmd: string): boolean {
  const r = spawnSync("which", [cmd], { encoding: "utf8" });
  return r.status === 0 && Boolean(r.stdout?.trim());
}

function runJj(repoRoot: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync("jj", args, { cwd: repoRoot, encoding: "utf8" });
  return { ok: r.status === 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function runGitWorktree(repoRoot: string, name: string, path: string): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync("git", ["worktree", "add", path, "-b", name], { cwd: repoRoot, encoding: "utf8" });
  return { ok: r.status === 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/**
 * GIT-029 spike: prefer jj workspace when available, else git worktree.
 * Production decision deferred — overlay model remains default.
 */
export async function workspaceAddCommand(name: string, options: OutputOptions): Promise<void> {
  if (!name) emitError("usage: bgit workspace add <name> [--json]", options);

  const repoRoot = requireGitRoot();
  const targetPath = join(repoRoot, "..", `${name}-workspace`);

  let backend: WorkspaceBackend = "git-worktree";
  let result: { ok: boolean; stdout: string; stderr: string };

  if (commandExists("jj") && existsSync(join(repoRoot, ".jj"))) {
    backend = "jj";
    result = runJj(repoRoot, ["workspace", "add", targetPath, "--name", name]);
    if (!result.ok) {
      backend = "git-worktree";
      result = runGitWorktree(repoRoot, name, targetPath);
    }
  } else {
    result = runGitWorktree(repoRoot, name, targetPath);
  }

  if (!result.ok) emitError(result.stderr || "workspace add failed", options);

  emit(
    {
      backend,
      name,
      path: targetPath,
      note: backend === "jj" ? "jj workspace spike — evaluate only" : "git worktree fallback",
    },
    options,
    `workspace added (${backend}): ${targetPath}`,
  );
}

export function detectWorkspaceBackend(repoRoot: string): WorkspaceBackend {
  if (commandExists("jj") && existsSync(join(repoRoot, ".jj"))) return "jj";
  return "git-worktree";
}
