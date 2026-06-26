import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import { createSession, endSession, getActiveSession, writeCheckpoint, createCheckpointId, appendTraceEvent } from "../store/sessions.js";
import { head, diffStat, changedFiles } from "../git/run.js";
import { setSessionRef } from "../git/refs.js";
import { whyLookup } from "../store/provenance.js";
import { getSecret } from "../crypto/secrets.js";
import type { CheckpointRecord } from "../types.js";

const SECRET_GET_ENABLED = process.env.BGIT_MCP_SECRET_GET === "1";

export function createMcpServer(): Server {
  const server = new Server(
    { name: "bgit", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: "session_start", description: "Start a bgit agent session", inputSchema: { type: "object", properties: { goal: { type: "string" }, agent: { type: "string" }, issue_ref: { type: "string" } }, required: ["goal"] } },
      { name: "session_end", description: "End the active session", inputSchema: { type: "object", properties: { session_id: { type: "string" }, squash: { type: "boolean" } } } },
      { name: "intent_create", description: "Create session intent (alias for session_start)", inputSchema: { type: "object", properties: { intent: { type: "string" }, agent: { type: "string" } }, required: ["intent"] } },
      { name: "status", description: "Workspace and session status", inputSchema: { type: "object", properties: {} } },
      { name: "diff", description: "Current diff stat", inputSchema: { type: "object", properties: {} } },
      { name: "why", description: "Reverse provenance lookup", inputSchema: { type: "object", properties: { file: { type: "string" }, line: { type: "number" } }, required: ["file"] } },
      { name: "checkpoint", description: "Create checkpoint in active session", inputSchema: { type: "object", properties: { message: { type: "string" } } } },
      { name: "secret_get", description: "Get encrypted secret (gated by BGIT_MCP_SECRET_GET=1)", inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
      { name: "log", description: "Append trace log event", inputSchema: { type: "object", properties: { message: { type: "string" }, type: { type: "string" } }, required: ["message"] } },
      { name: "workspace_add", description: "Add workspace root (stub)", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args ?? {}) as Record<string, unknown>;

    try {
      const repoRoot = requireGitRoot();
      const bgitRoot = requireBgit(repoRoot);

      switch (name) {
        case "session_start":
        case "intent_create": {
          const goal = String(a.goal ?? a.intent ?? "");
          const session = createSession(bgitRoot, {
            goal,
            agent: a.agent ? String(a.agent) : "mcp",
            issue_ref: a.issue_ref ? String(a.issue_ref) : undefined,
            head: head(repoRoot),
          });
          setSessionRef(repoRoot, session.session_id, session.head_at_start ?? head(repoRoot));
          return textResult({ session_id: session.session_id, intent: session.intent });
        }
        case "session_end": {
          const active = getActiveSession(bgitRoot);
          if (!active) throw new Error("no active session");
          const ended = endSession(bgitRoot, active.session_id);
          return textResult({ session_id: ended.session_id, ended_at: ended.ended_at });
        }
        case "status": {
          const active = getActiveSession(bgitRoot);
          return textResult({
            repo_root: repoRoot,
            bgit_root: bgitRoot,
            head: head(repoRoot),
            active_session: active?.session_id ?? null,
          });
        }
        case "diff": {
          return textResult({ diff_stat: diffStat(repoRoot), files: changedFiles(repoRoot) });
        }
        case "why": {
          const file = String(a.file);
          const line = a.line !== undefined ? Number(a.line) : undefined;
          const spec = line !== undefined ? `${file}:${line}` : file;
          return textResult(whyLookup(bgitRoot, spec));
        }
        case "checkpoint": {
          const session = getActiveSession(bgitRoot);
          if (!session) throw new Error("no active session");
          const cp: CheckpointRecord = {
            id: createCheckpointId(),
            session_id: session.session_id,
            created_at: new Date().toISOString(),
            head: head(repoRoot),
            diff_stat: diffStat(repoRoot),
            files: changedFiles(repoRoot).map((f) => ({ path: f.path, action: f.action })),
          };
          writeCheckpoint(bgitRoot, cp);
          return textResult({ checkpoint_id: cp.id });
        }
        case "secret_get": {
          if (!SECRET_GET_ENABLED) {
            throw new Error("secret_get disabled — set BGIT_MCP_SECRET_GET=1 to enable");
          }
          const secretName = String(a.name);
          return textResult({ name: secretName, value: getSecret(bgitRoot, secretName) });
        }
        case "log": {
          const session = getActiveSession(bgitRoot);
          if (!session) throw new Error("no active session");
          appendTraceEvent(bgitRoot, session.session_id, {
            ts: new Date().toISOString(),
            type: String(a.type ?? "log"),
            summary: String(a.message),
          });
          return textResult({ logged: true });
        }
        case "workspace_add": {
          return textResult({ stub: true, path: String(a.path), message: "workspace_add not implemented in v0.1" });
        }
        default:
          throw new Error(`unknown tool: ${name}`);
      }
    } catch (e) {
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }) }],
        isError: true,
      };
    }
  });

  return server;
}

function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify({ ok: true, ...((typeof data === "object" && data !== null) ? data as object : { data }) }) }] };
}

export async function runMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
