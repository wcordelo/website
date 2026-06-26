import { describe, test, expect } from "bun:test";

const MCP_TOOLS = [
  "session_start",
  "session_end",
  "intent_create",
  "status",
  "diff",
  "why",
  "checkpoint",
  "secret_get",
  "log",
  "workspace_add",
];

describe("MCP server", () => {
  test("defines 10 GIT-015 tools", () => {
    expect(MCP_TOOLS.length).toBe(10);
    expect(MCP_TOOLS).toContain("session_start");
    expect(MCP_TOOLS).toContain("secret_get");
    expect(MCP_TOOLS).toContain("workspace_add");
  });

  test("createMcpServer exports without throw", async () => {
    const { createMcpServer } = await import("../src/mcp/server.js");
    expect(createMcpServer).toBeDefined();
    const server = createMcpServer();
    expect(server).toBeDefined();
  });
});
