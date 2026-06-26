import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import {
  getActiveSession,
  writeCheckpoint,
  createCheckpointId,
  appendTraceEvent,
} from "../store/sessions.js";
import { head, diffStat, changedFiles, commitAll } from "../git/run.js";
import { addCommitNote } from "../git/notes.js";
import type { CheckpointRecord } from "../types.js";

export async function checkpointCommand(
  opts: { message?: string; auto?: boolean; bindCommit?: boolean } & OutputOptions,
): Promise<void> {
  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);

  const session = getActiveSession(bgitRoot);
  if (!session) {
    if (opts.auto || opts.bindCommit) return;
    emitError("no active session — run `bgit session start`", opts);
  }

  const currentHead = head(repoRoot);
  const stat = diffStat(repoRoot);
  const files = changedFiles(repoRoot).map((f) => ({
    path: f.path,
    action: f.action,
  }));

  let commitSha: string | undefined;
  if (!opts.auto && !opts.bindCommit && (opts.message || stat.files_changed > 0)) {
    const msg =
      opts.message ??
      `bgit checkpoint ${session!.session_id}\n\nbgit-trace: ${session!.session_id}`;
    commitSha = commitAll(repoRoot, msg);
    addCommitNote(repoRoot, commitSha, session!.session_id);
  } else if (opts.bindCommit) {
    commitSha = currentHead;
    addCommitNote(repoRoot, commitSha, session!.session_id);
  }

  const cp: CheckpointRecord = {
    id: createCheckpointId(),
    session_id: session!.session_id,
    created_at: new Date().toISOString(),
    head: currentHead,
    commit: commitSha,
    diff_stat: stat,
    files,
  };

  writeCheckpoint(bgitRoot, cp);
  appendTraceEvent(bgitRoot, session!.session_id, {
    ts: cp.created_at,
    type: "checkpoint",
    summary: `checkpoint ${cp.id}: ${stat.files_changed} files`,
    data: { checkpoint_id: cp.id, commit: commitSha },
  });

  emit(
    { checkpoint_id: cp.id, session_id: cp.session_id, commit: commitSha, diff_stat: stat },
    opts,
    `checkpoint ${cp.id}${commitSha ? ` → ${commitSha.slice(0, 7)}` : ""}`,
  );
}
