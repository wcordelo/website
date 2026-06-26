import type { SessionIntent } from "../types.js";
import { readIntent, writeIntent } from "./sessions.js";

export function getIntent(bgitRoot: string, sessionId: string): SessionIntent {
  return readIntent(bgitRoot, sessionId);
}

export function saveIntent(bgitRoot: string, intent: SessionIntent): void {
  writeIntent(bgitRoot, intent.session_id, intent);
}
