import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import type { SessionIntent, CheckpointRecord, TraceEvent } from "../types.js";
import { sessionDir, readIndex, writeIndex } from "./layout.js";
import { generateSessionId, generateCheckpointId } from "./ids.js";

export function writeIntent(bgitRoot: string, sessionId: string, intent: SessionIntent): void {
  const dir = sessionDir(bgitRoot, sessionId);
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, "prompts"), { recursive: true });
  mkdirSync(join(dir, "checkpoints"), { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(intent, null, 2) + "\n", "utf8");
}

export function readIntent(bgitRoot: string, sessionId: string): SessionIntent {
  const path = join(sessionDir(bgitRoot, sessionId), "meta.json");
  if (!existsSync(path)) throw new Error(`session not found: ${sessionId}`);
  return JSON.parse(readFileSync(path, "utf8")) as SessionIntent;
}

export function listSessions(bgitRoot: string): SessionIntent[] {
  const index = readIndex(bgitRoot);
  return Object.keys(index.sessions).map((id) => readIntent(bgitRoot, id));
}

export function getActiveSession(bgitRoot: string): SessionIntent | null {
  const sessions = listSessions(bgitRoot);
  return sessions.find((s) => s.status === "active") ?? null;
}

export function updateIntent(bgitRoot: string, intent: SessionIntent): void {
  writeIntent(bgitRoot, intent.session_id, intent);
  const index = readIndex(bgitRoot);
  index.sessions[intent.session_id] = {
    path: sessionDir(bgitRoot, intent.session_id),
    status: intent.status,
  };
  writeIndex(bgitRoot, index);
}

export function createSession(
  bgitRoot: string,
  opts: { goal: string; agent?: string; user?: string; issue_ref?: string; head: string },
): SessionIntent {
  const active = getActiveSession(bgitRoot);
  if (active) throw new Error(`active session exists: ${active.session_id}`);

  const sessionId = generateSessionId();
  const intent: SessionIntent = {
    session_id: sessionId,
    agent: opts.agent ?? "cli",
    user: opts.user ?? process.env.USER ?? "unknown",
    intent: opts.goal,
    issue_ref: opts.issue_ref,
    started_at: new Date().toISOString(),
    checkpoints: [],
    head_at_start: opts.head,
    status: "active",
  };
  updateIntent(bgitRoot, intent);
  return intent;
}

export function endSession(bgitRoot: string, sessionId: string, finalCommit?: string): SessionIntent {
  const intent = readIntent(bgitRoot, sessionId);
  intent.status = "ended";
  intent.ended_at = new Date().toISOString();
  if (finalCommit) intent.final_commit = finalCommit;
  updateIntent(bgitRoot, intent);
  return intent;
}

export function writeCheckpoint(bgitRoot: string, cp: CheckpointRecord): void {
  const dir = join(sessionDir(bgitRoot, cp.session_id), "checkpoints");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${cp.id}.json`), JSON.stringify(cp, null, 2) + "\n", "utf8");

  const intent = readIntent(bgitRoot, cp.session_id);
  if (!intent.checkpoints.includes(cp.id)) {
    intent.checkpoints.push(cp.id);
    updateIntent(bgitRoot, intent);
  }

  const index = readIndex(bgitRoot);
  for (const file of cp.files) {
    const key = file.path;
    if (!index.file_index[key]) index.file_index[key] = [];
    index.file_index[key].push({
      session_id: cp.session_id,
      checkpoint_id: cp.id,
      lines: file.lines,
    });
  }
  if (cp.commit) {
    index.commit_index[cp.commit] = cp.session_id;
  }
  writeIndex(bgitRoot, index);
}

export function readCheckpoint(bgitRoot: string, sessionId: string, cpId: string): CheckpointRecord {
  const path = join(sessionDir(bgitRoot, sessionId), "checkpoints", `${cpId}.json`);
  if (!existsSync(path)) throw new Error(`checkpoint not found: ${cpId}`);
  return JSON.parse(readFileSync(path, "utf8")) as CheckpointRecord;
}

export function listCheckpoints(bgitRoot: string, sessionId: string): CheckpointRecord[] {
  const intent = readIntent(bgitRoot, sessionId);
  return intent.checkpoints.map((id) => readCheckpoint(bgitRoot, sessionId, id));
}

export function appendTraceEvent(bgitRoot: string, sessionId: string, event: TraceEvent): void {
  const tracePath = join(sessionDir(bgitRoot, sessionId), "trace.jsonl");
  appendFileSync(tracePath, JSON.stringify(event) + "\n", "utf8");
}

export function readTraceEvents(bgitRoot: string, sessionId: string): TraceEvent[] {
  const tracePath = join(sessionDir(bgitRoot, sessionId), "trace.jsonl");
  if (!existsSync(tracePath)) return [];
  return readFileSync(tracePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as TraceEvent);
}

export function createCheckpointId(): string {
  return generateCheckpointId();
}
