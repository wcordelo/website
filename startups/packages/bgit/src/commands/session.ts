import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import { createSession, endSession, getActiveSession, readIntent } from "../store/sessions.js";
import { head, commitAll } from "../git/run.js";
import { setSessionRef } from "../git/refs.js";
import { addCommitNote } from "../git/notes.js";
import { listCheckpoints } from "../store/sessions.js";

export async function sessionStartCommand(
  goal: string,
  opts: { agent?: string; user?: string; issue?: string } & OutputOptions,
): Promise<void> {
  if (!goal) emitError("goal is required: bgit session start --goal \"...\"", opts);

  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);
  const session = createSession(bgitRoot, {
    goal,
    agent: opts.agent,
    user: opts.user,
    issue_ref: opts.issue,
    head: head(repoRoot),
  });

  setSessionRef(repoRoot, session.session_id, session.head_at_start ?? head(repoRoot));

  emit(
    { session_id: session.session_id, intent: session.intent, started_at: session.started_at },
    opts,
    `session started: ${session.session_id}\ngoal: ${session.intent}`,
  );
}

export async function sessionEndCommand(
  opts: { squash?: boolean; sessionId?: string } & OutputOptions,
): Promise<void> {
  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);

  const session = opts.sessionId
    ? readIntent(bgitRoot, opts.sessionId)
    : getActiveSession(bgitRoot);

  if (!session) emitError("no active session", opts);
  if (session.status === "ended") emitError(`session already ended: ${session.session_id}`, opts);

  let finalCommit: string | undefined;

  if (opts.squash) {
    const cps = listCheckpoints(bgitRoot, session.session_id);
    const msg = `bgit session ${session.session_id}: ${session.intent}\n\nbgit-trace: ${session.session_id}\nSquashed ${cps.length} checkpoint(s)`;
    finalCommit = commitAll(repoRoot, msg);
    addCommitNote(repoRoot, finalCommit, session.session_id);
  }

  const ended = endSession(bgitRoot, session.session_id, finalCommit);

  emit(
    {
      session_id: ended.session_id,
      ended_at: ended.ended_at,
      final_commit: ended.final_commit,
      squashed: Boolean(opts.squash),
    },
    opts,
    `session ended: ${ended.session_id}${finalCommit ? `\ncommit: ${finalCommit.slice(0, 7)}` : ""}`,
  );
}
