import { readIndex } from "./layout.js";
import { readIntent, readCheckpoint, listCheckpoints, readTraceEvents } from "./sessions.js";
import type { WhyResult } from "../types.js";

export function whyLookup(
  bgitRoot: string,
  fileSpec: string,
): WhyResult {
  const [file, lineStr] = fileSpec.split(":");
  const line = lineStr ? parseInt(lineStr, 10) : undefined;
  if (!file) throw new Error("usage: bgit why <file>[:<line>]");

  const index = readIndex(bgitRoot);
  const entries = index.file_index[file] ?? [];

  if (entries.length === 0) {
    throw new Error(`no provenance found for ${fileSpec}`);
  }

  const match = line
    ? entries.find((e) => !e.lines || e.lines.includes(line)) ?? entries[entries.length - 1]
    : entries[entries.length - 1];

  if (!match) throw new Error(`no provenance found for ${fileSpec}`);

  const intent = readIntent(bgitRoot, match.session_id);
  const cp = readCheckpoint(bgitRoot, match.session_id, match.checkpoint_id);

  const chain = [
    `${file}${line ? `:${line}` : ""}`,
    `checkpoint ${cp.id} (${cp.created_at})`,
    `session ${intent.session_id}`,
    `intent: "${intent.intent}"`,
  ];
  if (cp.commit) chain.push(`commit ${cp.commit.slice(0, 7)}`);

  return {
    file,
    line,
    session_id: intent.session_id,
    checkpoint_id: cp.id,
    intent: intent.intent,
    prompt_summary: intent.intent,
    commit: cp.commit ?? intent.final_commit,
    chain,
  };
}

export function traceSession(bgitRoot: string, sessionId: string) {
  const intent = readIntent(bgitRoot, sessionId);
  const checkpoints = listCheckpoints(bgitRoot, sessionId);
  const events = readTraceEvents(bgitRoot, sessionId);
  const commits = [
    ...new Set(
      checkpoints.map((c) => c.commit).filter((c): c is string => Boolean(c)).concat(intent.final_commit ? [intent.final_commit] : []),
    ),
  ];
  return {
    session_id: intent.session_id,
    intent: intent.intent,
    agent: intent.agent,
    started_at: intent.started_at,
    ended_at: intent.ended_at,
    checkpoints,
    events,
    commits,
  };
}
