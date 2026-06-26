import { git } from "./run.js";

export function addCommitNote(repoRoot: string, commit: string, sessionId: string): void {
  git(repoRoot, ["notes", "--ref=refs/notes/bgit", "add", "-m", `bgit-session-id: ${sessionId}`, commit]);
}

export function getCommitNote(repoRoot: string, commit: string): string | null {
  const result = git(repoRoot, ["notes", "--ref=refs/notes/bgit", "show", commit]);
  if (result.code !== 0) return null;
  return result.stdout;
}

export function parseSessionIdFromNote(note: string): string | null {
  const match = note.match(/bgit-session-id:\s*(\S+)/);
  return match?.[1] ?? null;
}
