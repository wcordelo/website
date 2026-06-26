import { requireGit } from "./run.js";

export function setSessionRef(repoRoot: string, sessionId: string, commit: string): void {
  requireGit(repoRoot, ["update-ref", `refs/bgit/sessions/${sessionId}`, commit]);
}

export function getSessionRef(repoRoot: string, sessionId: string): string | null {
  try {
    return requireGit(repoRoot, ["rev-parse", `refs/bgit/sessions/${sessionId}`]);
  } catch {
    return null;
  }
}

export function listSessionRefs(repoRoot: string): string[] {
  try {
    const out = requireGit(repoRoot, ["for-each-ref", "--format=%(refname:short)", "refs/bgit/sessions/"]);
    return out.split("\n").filter(Boolean).map((r) => r.replace("refs/bgit/sessions/", "bgit/sessions/").split("/").pop()!);
  } catch {
    return [];
  }
}
