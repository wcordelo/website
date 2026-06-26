#!/usr/bin/env bun
/**
 * COMM-024: MCP server for Better Slack agent integration.
 * Run: bun run src/mcp/server.ts
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.BETTER_SLACK_URL ?? "http://localhost:3847";
const AGENT_KEY = process.env.BETTER_SLACK_AGENT_KEY ?? "";
const HUMAN_TOKEN = process.env.BETTER_SLACK_TOKEN ?? "";

async function apiRequest(method: string, path: string, body?: unknown, useAgent = false): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (useAgent && AGENT_KEY) headers["X-Agent-Key"] = AGENT_KEY;
  else if (HUMAN_TOKEN) headers["Authorization"] = `Bearer ${HUMAN_TOKEN}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const server = new Server(
  { name: "better-slack", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_threads",
      description: "List threads in a channel (forum-first view)",
      inputSchema: {
        type: "object",
        properties: { channelSlug: { type: "string", description: "Channel slug, e.g. eng" } },
        required: ["channelSlug"],
      },
    },
    {
      name: "get_thread",
      description: "Get a thread by ID with messages",
      inputSchema: {
        type: "object",
        properties: { threadId: { type: "string" } },
        required: ["threadId"],
      },
    },
    {
      name: "create_thread",
      description: "Create a new thread in a channel",
      inputSchema: {
        type: "object",
        properties: {
          channelSlug: { type: "string" },
          title: { type: "string" },
        },
        required: ["channelSlug", "title"],
      },
    },
    {
      name: "reply_thread",
      description: "Reply to a thread with a message",
      inputSchema: {
        type: "object",
        properties: {
          threadId: { type: "string" },
          body: { type: "string" },
        },
        required: ["threadId", "body"],
      },
    },
    {
      name: "get_post",
      description: "Get a post with all versions",
      inputSchema: {
        type: "object",
        properties: { postId: { type: "string" } },
        required: ["postId"],
      },
    },
    {
      name: "propose_post",
      description: "Propose a new post (agent draft)",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          template: { type: "string", enum: ["adr", "incident", "rfc"] },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "agent_status",
      description: "Check agent capability for an action",
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string" },
          channelSlug: { type: "string" },
        },
        required: ["action"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, string>;

  try {
    let result: unknown;

    switch (name) {
      case "list_threads":
        result = await apiRequest("GET", `/api/threads/channel/${a.channelSlug}`);
        break;
      case "get_thread": {
        const thread = await apiRequest("GET", `/api/threads/${a.threadId}`);
        const messages = await apiRequest("GET", `/api/messages/thread/${a.threadId}`);
        result = { thread, messages };
        break;
      }
      case "create_thread":
        result = await apiRequest("POST", `/api/threads/channel/${a.channelSlug}`, { title: a.title });
        break;
      case "reply_thread":
        result = await apiRequest("POST", `/api/messages/thread/${a.threadId}`, { body: a.body });
        break;
      case "get_post":
        result = await apiRequest("GET", `/api/posts/${a.postId}`);
        break;
      case "propose_post":
        result = await apiRequest("POST", "/api/posts", {
          title: a.title,
          content: a.content,
          template: a.template,
        });
        break;
      case "agent_status":
        result = await apiRequest(
          "POST",
          "/api/agents/evaluate",
          { action: a.action, channelSlug: a.channelSlug },
          true,
        );
        break;
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
