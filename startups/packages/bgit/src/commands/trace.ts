import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import { traceSession } from "../store/provenance.js";

export async function traceCommand(sessionId: string, options: OutputOptions): Promise<void> {
  if (!sessionId) emitError("usage: bgit trace <session-id>", options);

  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);

  try {
    const result = traceSession(bgitRoot, sessionId);
    if (options.json) {
      emit(result, options);
    } else {
      console.log(`session: ${result.session_id}`);
      console.log(`intent: ${result.intent}`);
      console.log(`agent: ${result.agent}`);
      console.log(`started: ${result.started_at}`);
      if (result.ended_at) console.log(`ended: ${result.ended_at}`);
      console.log(`checkpoints: ${result.checkpoints.length}`);
      console.log(`events: ${result.events.length}`);
      console.log(`commits: ${result.commits.map((c) => c.slice(0, 7)).join(", ") || "none"}`);
    }
  } catch (e) {
    emitError(e instanceof Error ? e.message : String(e), options);
  }
}
