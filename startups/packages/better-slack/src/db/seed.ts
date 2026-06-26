import { randomUUID } from "node:crypto";
import { getDb } from "./schema.ts";
import { indexDocument } from "../search/index.ts";

export function newId(): string {
  return randomUUID();
}

export function seedDemoData(): void {
  const db = getDb();
  const existing = db.query("SELECT id FROM workspaces LIMIT 1").get();
  if (existing) return;

  const workspaceId = newId();
  const userId = newId();
  const channelId = newId();
  const threadId = newId();
  const postId = newId();
  const versionId = newId();
  const agentId = newId();
  const apiKey = `bsk_${randomUUID().replace(/-/g, "")}`;

  db.transaction(() => {
    db.run(
      "INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)",
      workspaceId,
      "Demo Workspace",
      "demo",
    );
    db.run(
      "INSERT INTO users (id, workspace_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
      userId,
      workspaceId,
      "demo@better-slack.dev",
      "Demo User",
      "stub-hash",
      "admin",
    );
    db.run(
      "INSERT INTO channels (id, workspace_id, name, slug, description) VALUES (?, ?, ?, ?, ?)",
      channelId,
      workspaceId,
      "Engineering",
      "eng",
      "Forum-first engineering discussions",
    );
    db.run(
      "INSERT INTO channel_permissions (id, channel_id, user_id, level) VALUES (?, ?, ?, ?)",
      newId(),
      channelId,
      userId,
      "admin",
    );
    db.run(
      `INSERT INTO threads (id, channel_id, title, slug, status, created_by, created_by_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      threadId,
      channelId,
      "Welcome to Better Slack",
      "welcome",
      "open",
      userId,
      "human",
    );
    db.run(
      "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, ?, ?)",
      newId(),
      threadId,
      userId,
      "human",
      "This is a forum-first channel. Threads, not firehoses.",
    );
    db.run(
      `INSERT INTO posts (id, workspace_id, thread_id, title, slug, template, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      postId,
      workspaceId,
      threadId,
      "ADR-001: Forum-first channels",
      "adr-001-forum-first",
      "adr",
      "published",
      userId,
    );
    db.run(
      `INSERT INTO post_versions (id, post_id, version, content, change_summary, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      versionId,
      postId,
      1,
      "# ADR-001: Forum-first channels\n\n## Status\nAccepted\n\n## Context\nChat firehoses bury decisions.\n\n## Decision\nChannels show thread lists, not message streams.",
      "Initial version",
      userId,
    );
    db.run(
      `INSERT INTO agents (id, workspace_id, name, description, owner_id, api_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      agentId,
      workspaceId,
      "CI Reporter",
      "Posts GitHub Actions failures to #ci threads",
      userId,
      apiKey,
    );
    db.run(
      "INSERT INTO agent_capabilities (id, agent_id, capability, effect, resource_pattern) VALUES (?, ?, ?, ?, ?)",
      newId(),
      agentId,
      "thread:write",
      "allow",
      "channel:#ci",
    );
    db.run(
      "INSERT INTO agent_capabilities (id, agent_id, capability, effect, resource_pattern) VALUES (?, ?, ?, ?, ?)",
      newId(),
      agentId,
      "post:propose",
      "allow",
      "*",
    );
    db.run(
      "INSERT INTO agent_capabilities (id, agent_id, capability, effect, resource_pattern) VALUES (?, ?, ?, ?, ?)",
      newId(),
      agentId,
      "channel:read",
      "deny",
      "channel:#private",
    );
    db.run(
      `INSERT INTO channels (id, workspace_id, name, slug, description) VALUES (?, ?, ?, ?, ?)`,
      newId(),
      workspaceId,
      "CI",
      "ci",
      "Automated CI failure threads",
    );
    db.run(
      `INSERT INTO channels (id, workspace_id, name, slug, description) VALUES (?, ?, ?, ?, ?)`,
      newId(),
      workspaceId,
      "Linear",
      "linear",
      "Linear issue sync threads",
    );
  })();

  indexDocument("thread", threadId, workspaceId, "Welcome to Better Slack", "");
  indexDocument("post", postId, workspaceId, "ADR-001: Forum-first channels", "");
}
