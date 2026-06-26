import { spawnSync } from "node:child_process";

export function git(cwd: string, args: string[]): { stdout: string; stderr: string; code: number } {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    code: result.status ?? 1,
  };
}

export function requireGit(cwd: string, args: string[]): string {
  const result = git(cwd, args);
  if (result.code !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout;
}

export function head(cwd: string): string {
  return requireGit(cwd, ["rev-parse", "HEAD"]);
}

export function diffStat(cwd: string): { files_changed: number; insertions: number; deletions: number } {
  const out = git(cwd, ["diff", "--numstat", "HEAD"]);
  if (!out.stdout) return { files_changed: 0, insertions: 0, deletions: 0 };
  let insertions = 0;
  let deletions = 0;
  let files = 0;
  for (const line of out.stdout.split("\n").filter(Boolean)) {
    const [ins, del] = line.split("\t");
    if (ins === "-" || del === "-") continue;
    files++;
    insertions += parseInt(ins ?? "0", 10) || 0;
    deletions += parseInt(del ?? "0", 10) || 0;
  }
  const staged = git(cwd, ["diff", "--cached", "--numstat"]);
  for (const line of staged.stdout.split("\n").filter(Boolean)) {
    const [ins, del] = line.split("\t");
    if (ins === "-" || del === "-") continue;
    files++;
    insertions += parseInt(ins ?? "0", 10) || 0;
    deletions += parseInt(del ?? "0", 10) || 0;
  }
  return { files_changed: files, insertions, deletions };
}

export function changedFiles(cwd: string): Array<{ path: string; action: "edit" | "create" | "delete" }> {
  const out = requireGit(cwd, ["status", "--porcelain"]);
  const files: Array<{ path: string; action: "edit" | "create" | "delete" }> = [];
  for (const line of out.split("\n").filter(Boolean)) {
    const status = line.slice(0, 2);
    const path = line.slice(3).trim();
    if (status.includes("D")) files.push({ path, action: "delete" });
    else if (status.includes("A") || status.includes("?")) files.push({ path, action: "create" });
    else files.push({ path, action: "edit" });
  }
  return files;
}

export function commitAll(cwd: string, message: string): string {
  git(cwd, ["add", "-A"]);
  const result = git(cwd, ["commit", "-m", message]);
  if (result.code !== 0 && !result.stdout.includes("nothing to commit")) {
    throw new Error(result.stderr || "commit failed");
  }
  return head(cwd);
}
