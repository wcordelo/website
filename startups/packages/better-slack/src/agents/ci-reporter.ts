import { getDb } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { evaluateAgentCapability, logAudit } from "../permissions/engine.ts";
import { pubsub } from "../ws/pubsub.ts";
import { findCiReporterAgent } from "./registry.ts";

export interface GitHubWorkflowRunPayload {
  action?: string;
  workflow_run?: {
    name?: string;
    conclusion?: string;
    html_url?: string;
    head_branch?: string;
    head_sha?: string;
    repository?: { full_name?: string };
  };
}

/**
 * COMM-019: CI Reporter agent stub — creates a thread on failed GitHub Actions runs.
 * COMM-020: GitHub webhook stub integration.
 */
export function handleGitHubWorkflowWebhook(workspaceId: string, payload: GitHubWorkflowRunPayload): {
  ok: boolean;
  threadId?: string;
  reason?: string;
} {
  const conclusion = payload.workflow_run?.conclusion;
  const action = payload.action;

  if (action !== "completed" || conclusion !== "failure") {
    return { ok: true, reason: "ignored: not a failure completion" };
  }

  const agent = findCiReporterAgent(workspaceId);
  if (!agent) {
    return { ok: false, reason: "CI Reporter agent not registered" };
  }

  const allowed = evaluateAgentCapability(agent.id, "thread:write", {
    workspaceId,
    channelSlug: "ci",
  });
  if (!allowed) {
    logAudit(workspaceId, "agent", agent.id, "ci.blocked", "thread", null, { reason: "capability denied" });
    return { ok: false, reason: "capability denied for channel:#ci" };
  }

  const db = getDb();
  const channel = db
    .query("SELECT * FROM channels WHERE workspace_id = ? AND slug = 'ci'")
    .get(workspaceId) as { id: string } | null;

  if (!channel) {
    return { ok: false, reason: "CI channel not found" };
  }

  const run = payload.workflow_run!;
  const title = `CI failed: ${run.name ?? "workflow"} on ${run.head_branch ?? "branch"}`;
  const slug = `ci-fail-${(run.head_sha ?? newId()).slice(0, 8)}-${Date.now()}`;
  const threadId = newId();
  const messageId = newId();

  const body = [
    `**Workflow:** ${run.name ?? "unknown"}`,
    `**Branch:** ${run.head_branch ?? "unknown"}`,
    `**Commit:** \`${(run.head_sha ?? "").slice(0, 7)}\``,
    `**Repo:** ${run.repository?.full_name ?? "unknown"}`,
    run.html_url ? `**Run:** ${run.html_url}` : "",
    "",
    "```",
    "Build failed — see GitHub Actions logs for details.",
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  db.run(
    `INSERT INTO threads (id, channel_id, title, slug, status, created_by, created_by_type)
     VALUES (?, ?, ?, ?, 'open', ?, 'agent')`,
    threadId,
    channel.id,
    title,
    slug,
    agent.id,
  );
  db.run(
    "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'agent', ?)",
    messageId,
    threadId,
    agent.id,
    body,
  );

  const thread = db.query("SELECT * FROM threads WHERE id = ?").get(threadId);
  pubsub.publish(workspaceId, { type: "thread.created", thread });
  pubsub.publish(workspaceId, {
    type: "agent.action",
    action: "ci.failure_thread",
    details: { threadId, workflow: run.name },
  });
  logAudit(workspaceId, "agent", agent.id, "ci.failure_thread", "thread", threadId, {
    workflow: run.name,
    branch: run.head_branch,
  });

  return { ok: true, threadId };
}
