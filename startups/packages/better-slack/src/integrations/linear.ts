/** COMM-021: Linear integration — webhook stub for issue sync */

import { getDb } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { logAudit } from "../permissions/engine.ts";

export interface LinearWebhookPayload {
  action: string;
  type: string;
  data: {
    id: string;
    title?: string;
    identifier?: string;
    url?: string;
    state?: { name: string };
    team?: { key: string };
  };
  url?: string;
}

export interface LinearWebhookResult {
  ok: boolean;
  action: string;
  threadId?: string;
  message?: string;
}

/**
 * Handle Linear webhook events. Maps issue updates to threads in #linear channel.
 * Configure webhook URL: POST /api/webhooks/linear
 * Docs: https://developers.linear.app/docs/graphql/webhooks
 */
export function handleLinearWebhook(workspaceId: string, payload: LinearWebhookPayload): LinearWebhookResult {
  const db = getDb();

  if (payload.type !== "Issue") {
    return { ok: true, action: "ignored", message: `Unhandled type: ${payload.type}` };
  }

  const channel = db
    .query("SELECT id FROM channels WHERE workspace_id = ? AND slug = ?",)
    .get(workspaceId, "linear") as { id: string } | null;

  if (!channel) {
    return { ok: true, action: "ignored", message: "No #linear channel configured" };
  }

  const issue = payload.data;
  const title = issue.identifier ? `[${issue.identifier}] ${issue.title ?? "Issue update"}` : (issue.title ?? "Linear issue");
  const slug = `linear-${(issue.identifier ?? issue.id).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const existing = db
    .query("SELECT id FROM threads WHERE channel_id = ? AND slug = ?")
    .get(channel.id, slug) as { id: string } | null;

  if (existing) {
    const msgId = newId();
    const body = `Linear ${payload.action}: ${issue.state?.name ?? "updated"} — ${issue.url ?? payload.url ?? ""}`;
    db.run(
      "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'agent', ?)",
      msgId,
      existing.id,
      "linear-bot",
      body,
    );
    db.run("UPDATE threads SET updated_at = datetime('now') WHERE id = ?", existing.id);
    logAudit(workspaceId, "agent", "linear-bot", "linear.issue.update", "thread", existing.id, { action: payload.action });
    return { ok: true, action: "updated", threadId: existing.id };
  }

  const threadId = newId();
  db.run(
    `INSERT INTO threads (id, channel_id, title, slug, status, created_by, created_by_type)
     VALUES (?, ?, ?, ?, 'open', ?, 'agent')`,
    threadId,
    channel.id,
    title,
    slug,
    "linear-bot",
  );
  db.run(
    "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'agent', ?)",
    newId(),
    threadId,
    "linear-bot",
    `Issue created in Linear: ${issue.url ?? payload.url ?? issue.id}`,
  );
  logAudit(workspaceId, "agent", "linear-bot", "linear.issue.create", "thread", threadId, { identifier: issue.identifier });

  return { ok: true, action: "created", threadId };
}
