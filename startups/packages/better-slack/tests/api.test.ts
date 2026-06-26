import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import { unlinkSync, existsSync, mkdirSync } from "node:fs";

const TEST_DB = join(import.meta.dir, "../data/test.db");
const PORT = 13847;
let baseUrl: string;
let token: string;
let workspaceId: string;
let channelId: string;
let threadId: string;
let postId: string;
let agentKey: string;

beforeAll(async () => {
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  mkdirSync(join(import.meta.dir, "../data"), { recursive: true });

  process.env.BETTER_SLACK_DB = TEST_DB;
  process.env.PORT = String(PORT);

  await import("../src/server.ts");
  await new Promise((r) => setTimeout(r, 500));
  baseUrl = `http://localhost:${PORT}`;

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@better-slack.dev" }),
  });
  const loginData = (await loginRes.json()) as { token: string; user: { workspace_id: string } };
  token = loginData.token;
  workspaceId = loginData.user.workspace_id;
});

afterAll(() => {
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
});

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

describe("COMM-001: Thread data model", () => {
  test("health check", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    expect(data).toEqual({ ok: true, version: "0.1.0" });
  });

  test("lists channels", async () => {
    const res = await fetch(`${baseUrl}/api/channels`, { headers: authHeaders() });
    const data = (await res.json()) as { channels: { id: string; slug: string }[] };
    expect(data.channels.length).toBeGreaterThan(0);
    channelId = data.channels[0]!.id;
  });

  test("lists threads in channel", async () => {
    const res = await fetch(`${baseUrl}/api/threads/channel/eng`, { headers: authHeaders() });
    const data = (await res.json()) as { threads: { id: string }[] };
    expect(data.threads.length).toBeGreaterThan(0);
    threadId = data.threads[0]!.id;
  });
});

describe("COMM-005: Thread status workflow", () => {
  test("transitions open → in_progress → resolved", async () => {
    const res1 = await fetch(`${baseUrl}/api/threads/${threadId}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(res1.ok).toBe(true);
    const d1 = (await res1.json()) as { thread: { status: string } };
    expect(d1.thread.status).toBe("in_progress");

    const res2 = await fetch(`${baseUrl}/api/threads/${threadId}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "resolved", summary: "Test resolution" }),
    });
    const d2 = (await res2.json()) as { thread: { status: string; summary: string } };
    expect(d2.thread.status).toBe("resolved");
    expect(d2.thread.summary).toBe("Test resolution");
  });
});

describe("COMM-008/010: Post versioning", () => {
  test("creates post with version", async () => {
    const res = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        title: "Test ADR",
        content: "# Test\n\nVersion 1 content",
        template: "adr",
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { post: { id: string }; version: { version: number } };
    postId = data.post.id;
    expect(data.version.version).toBe(1);
  });

  test("creates new version and diff", async () => {
    await fetch(`${baseUrl}/api/posts/${postId}/versions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content: "# Test\n\nVersion 2 content\n\nNew paragraph", changeSummary: "v2" }),
    });

    const res = await fetch(`${baseUrl}/api/posts/${postId}/diff?from=1&to=2`, { headers: authHeaders() });
    const data = (await res.json()) as { diff: { added: string[] } };
    expect(data.diff.added.length).toBeGreaterThan(0);
  });
});

describe("COMM-016: Capability engine — deny wins", () => {
  test("CI reporter allowed on #ci, denied on #private", async () => {
    const agentsRes = await fetch(`${baseUrl}/api/agents`, { headers: authHeaders() });
    const agents = (await agentsRes.json()) as { agents: { id: string; name: string }[] };
    const ciAgent = agents.agents.find((a) => a.name === "CI Reporter");
    expect(ciAgent).toBeDefined();

    const db = (await import("../src/db/schema.ts")).getDb();
    const row = db.query("SELECT api_key FROM agents WHERE id = ?").get(ciAgent!.id) as { api_key: string };
    agentKey = row.api_key;

    const allowRes = await fetch(`${baseUrl}/api/agents/evaluate`, {
      method: "POST",
      headers: { "X-Agent-Key": agentKey, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "thread:write", channelSlug: "ci" }),
    });
    const allowData = (await allowRes.json()) as { allowed: boolean };
    expect(allowData.allowed).toBe(true);

    const denyRes = await fetch(`${baseUrl}/api/agents/evaluate`, {
      method: "POST",
      headers: { "X-Agent-Key": agentKey, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "channel:read", channelSlug: "private" }),
    });
    const denyData = (await denyRes.json()) as { allowed: boolean };
    expect(denyData.allowed).toBe(false);
  });
});

describe("COMM-019/020: GitHub webhook → CI thread", () => {
  test("creates thread on workflow failure", async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-GitHub-Event": "workflow_run" },
      body: JSON.stringify({
        action: "completed",
        workflow_run: {
          name: "CI",
          conclusion: "failure",
          head_branch: "main",
          head_sha: "abc123def456",
          html_url: "https://github.com/example/repo/actions/runs/1",
          repository: { full_name: "example/repo" },
        },
      }),
    });
    const data = (await res.json()) as { ok: boolean; threadId?: string };
    expect(data.ok).toBe(true);
    expect(data.threadId).toBeDefined();

    const threadsRes = await fetch(`${baseUrl}/api/threads/channel/ci`, { headers: authHeaders() });
    const threads = (await threadsRes.json()) as { threads: { title: string }[] };
    expect(threads.threads.some((t) => t.title.includes("CI failed"))).toBe(true);
  });
});

describe("COMM-013: Auth stub", () => {
  test("signup creates user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@test.dev", name: "New User" }),
    });
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { token: string };
    expect(data.token).toBeDefined();
  });
});

describe("COMM-017: Audit log", () => {
  test("records agent actions", async () => {
    const res = await fetch(`${baseUrl}/api/agents/audit?limit=10`, { headers: authHeaders() });
    const data = (await res.json()) as { entries: { action: string }[] };
    expect(data.entries.length).toBeGreaterThan(0);
  });
});

describe("COMM-012: WebSocket", () => {
  test("connects and receives connected event", async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws?workspace=${workspaceId}`);
    const msg = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 3000);
      ws.onmessage = (e) => {
        clearTimeout(timer);
        resolve(e.data as string);
        ws.close();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error("ws error"));
      };
    });
    const parsed = JSON.parse(msg) as { type: string };
    expect(parsed.type).toBe("connected");
  });
});

describe("COMM-003: Thread composer", () => {
  test("creates thread with initial message", async () => {
    const res = await fetch(`${baseUrl}/api/threads/channel/eng`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title: "Composer test thread", body: "Opening message body" }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { thread: { id: string; title: string } };
    expect(data.thread.title).toBe("Composer test thread");

    const msgs = await fetch(`${baseUrl}/api/messages/thread/${data.thread.id}`, { headers: authHeaders() });
    const msgData = (await msgs.json()) as { messages: { body: string }[] };
    expect(msgData.messages.some((m) => m.body === "Opening message body")).toBe(true);
  });
});

describe("COMM-004: Sub-thread creation", () => {
  test("splits discussion into sub-thread", async () => {
    const res = await fetch(`${baseUrl}/api/threads/${threadId}/split`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title: "Side discussion" }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { thread: { id: string; parent_thread_id: string } };
    expect(data.thread.parent_thread_id).toBe(threadId);

    const listRes = await fetch(`${baseUrl}/api/threads/${threadId}/subthreads`, { headers: authHeaders() });
    const list = (await listRes.json()) as { subthreads: { title: string }[] };
    expect(list.subthreads.some((t) => t.title === "Side discussion")).toBe(true);
  });
});

describe("COMM-006: Thread subscriptions", () => {
  test("subscribe and unsubscribe", async () => {
    const subRes = await fetch(`${baseUrl}/api/threads/${threadId}/subscribe`, {
      method: "POST",
      headers: authHeaders(),
    });
    expect((await subRes.json()).subscribed).toBe(true);

    const checkRes = await fetch(`${baseUrl}/api/threads/${threadId}/subscribe`, { headers: authHeaders() });
    expect((await checkRes.json()).subscribed).toBe(true);

    const unsubRes = await fetch(`${baseUrl}/api/threads/${threadId}/subscribe`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect((await unsubRes.json()).subscribed).toBe(false);
  });
});

describe("COMM-007: Cross-thread references", () => {
  test("returns thread preview", async () => {
    const res = await fetch(`${baseUrl}/api/threads/${threadId}/preview`, { headers: authHeaders() });
    const data = (await res.json()) as { preview: { id: string; title: string } };
    expect(data.preview.id).toBe(threadId);
    expect(data.preview.title).toBeDefined();
  });
});

describe("COMM-011: Post templates API", () => {
  test("lists templates including runbook", async () => {
    const res = await fetch(`${baseUrl}/api/posts/templates`, { headers: authHeaders() });
    const data = (await res.json()) as { templates: { id: string }[] };
    expect(data.templates.map((t) => t.id)).toContain("runbook");
  });
});

describe("COMM-018: Agent proposal flow", () => {
  test("agent proposes, human approves", async () => {
    const proposeRes = await fetch(`${baseUrl}/api/posts/propose`, {
      method: "POST",
      headers: { "X-Agent-Key": agentKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Agent proposed ADR",
        content: "# Proposed by agent\n\nNeeds review.",
        template: "adr",
      }),
    });
    expect(proposeRes.status).toBe(201);
    const proposed = (await proposeRes.json()) as { post: { id: string; status: string } };
    expect(proposed.post.status).toBe("proposed");

    const approveRes = await fetch(`${baseUrl}/api/posts/${proposed.post.id}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    const approved = (await approveRes.json()) as { post: { status: string } };
    expect(approved.post.status).toBe("published");
  });
});

describe("COMM-021: Linear webhook", () => {
  test("handles issue webhook when linear channel exists", async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/linear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        type: "Issue",
        data: {
          id: "issue-1",
          title: "Fix auth bug",
          identifier: "ENG-99",
          url: "https://linear.app/team/issue/ENG-99",
          state: { name: "In Progress" },
        },
      }),
    });
    const data = (await res.json()) as { ok: boolean; threadId?: string };
    expect(data.ok).toBe(true);
    expect(data.threadId).toBeDefined();
  });
});

describe("COMM-022: Full-text search API", () => {
  test("searches indexed content", async () => {
    await fetch(`${baseUrl}/api/search/rebuild`, { method: "POST", headers: authHeaders() });

    const res = await fetch(`${baseUrl}/api/search?q=forum`, { headers: authHeaders() });
    const data = (await res.json()) as { results: unknown[]; engine: string };
    expect(data.engine).toBe("sqlite-fts5");
    expect(data.results.length).toBeGreaterThanOrEqual(0);
  });
});

describe("COMM-028: Billing API", () => {
  test("returns tier info", async () => {
    const res = await fetch(`${baseUrl}/api/billing/tier`, { headers: authHeaders() });
    const data = (await res.json()) as { tier: string; limits: { maxChannels: number } };
    expect(data.tier).toBe("free");
    expect(data.limits.maxChannels).toBe(3);
  });
});

describe("COMM-029: SAML SSO stub", () => {
  test("stub login returns token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/saml/stub-login?org=demo`);
    const data = (await res.json()) as { token: string; sso: boolean; stub: boolean };
    expect(data.token).toBeDefined();
    expect(data.sso).toBe(true);
    expect(data.stub).toBe(true);
  });
});

describe("COMM-030: Thread resolution requires summary", () => {
  test("rejects resolve without summary", async () => {
    const createRes = await fetch(`${baseUrl}/api/threads/channel/eng`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title: "Resolve test" }),
    });
    const { thread } = (await createRes.json()) as { thread: { id: string } };

    const res = await fetch(`${baseUrl}/api/threads/${thread.id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "resolved" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("COMM-035: Slack import API", () => {
  test("imports channel via API", async () => {
    const res = await fetch(`${baseUrl}/api/import/slack`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        channel: { id: "C99", name: "random" },
        messages: [{ type: "message", user: "U1", text: "Imported message", ts: "2000.0001" }],
      }),
    });
    const data = (await res.json()) as { result: { messagesImported: number } };
    expect(data.result.messagesImported).toBe(1);
  });
});
