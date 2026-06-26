import type { TraceEvent } from "../types.js";

/** Cursor log adapter — stub for v0.1; format TBD (GIT-022) */
export function parseCursorLog(_content: string): TraceEvent[] {
  return [
    {
      ts: new Date().toISOString(),
      type: "stub",
      summary: "Cursor log adapter not yet implemented",
      data: { adapter: "cursor", status: "stub" },
    },
  ];
}

export function ingestCursorLog(_path: string): TraceEvent[] {
  return parseCursorLog("");
}
