import type { TraceEvent } from "../types.js";
import { redact, redactObject } from "./redaction.js";

export interface ClaudeLogLine {
  type?: string;
  message?: { role?: string; content?: string | Array<{ type: string; text?: string }> };
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  timestamp?: string;
}

export function parseClaudeLogLine(line: string): TraceEvent | null {
  let raw: ClaudeLogLine;
  try {
    raw = JSON.parse(line) as ClaudeLogLine;
  } catch {
    return null;
  }

  const ts = raw.timestamp ?? new Date().toISOString();
  const type = raw.type ?? "unknown";

  if (type === "assistant" && raw.message?.content) {
    const content =
      typeof raw.message.content === "string"
        ? raw.message.content
        : raw.message.content.map((c) => c.text ?? "").join("");
    return {
      ts,
      type: "prompt",
      summary: redact(content.slice(0, 200)),
      data: { role: raw.message.role },
    };
  }

  if (type === "tool_use" || raw.tool_name) {
    const input = raw.tool_input ? redactObject(raw.tool_input) : {};
    return {
      ts,
      type: "tool_call",
      summary: `${raw.tool_name ?? "tool"}: ${JSON.stringify(input).slice(0, 120)}`,
      data: { tool: raw.tool_name, input },
    };
  }

  return {
    ts,
    type,
    summary: redact(JSON.stringify(redactObject(raw as Record<string, unknown>)).slice(0, 200)),
  };
}

export function parseClaudeLog(content: string): TraceEvent[] {
  return content
    .split("\n")
    .filter(Boolean)
    .map(parseClaudeLogLine)
    .filter((e): e is TraceEvent => e !== null);
}
