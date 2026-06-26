import { Hono } from "hono";
import { getDb } from "../db/schema.ts";
import { handleGitHubWorkflowWebhook } from "../agents/ci-reporter.ts";
import { handleLinearWebhook } from "../integrations/linear.ts";
import { parseSlackEvent, verifySlackSignature, loadBridgeConfig } from "../bridge/slack.ts";

/** COMM-020, COMM-021, COMM-027: Webhook and bridge stubs */
export const webhookRoutes = new Hono();

webhookRoutes.post("/github", async (c) => {
  const event = c.req.header("X-GitHub-Event");
  const payload = await c.req.json();

  const db = getDb();
  const workspace = db.query("SELECT id FROM workspaces LIMIT 1").get() as { id: string } | null;
  if (!workspace) {
    return c.json({ error: "No workspace configured" }, 404);
  }

  if (event === "workflow_run") {
    const result = handleGitHubWorkflowWebhook(workspace.id, payload);
    return c.json(result);
  }

  return c.json({ ok: true, ignored: true, event });
});

webhookRoutes.post("/linear", async (c) => {
  const payload = await c.req.json();
  const db = getDb();
  const workspace = db.query("SELECT id FROM workspaces LIMIT 1").get() as { id: string } | null;
  if (!workspace) {
    return c.json({ error: "No workspace configured" }, 404);
  }

  const result = handleLinearWebhook(workspace.id, payload);
  return c.json(result);
});

webhookRoutes.post("/slack/events", async (c) => {
  const config = loadBridgeConfig();
  const rawBody = await c.req.text();
  const payload = JSON.parse(rawBody);

  if (payload.type === "url_verification") {
    return c.json({ challenge: payload.challenge });
  }

  if (config) {
    const timestamp = c.req.header("X-Slack-Request-Timestamp") ?? "";
    const signature = c.req.header("X-Slack-Signature") ?? "";
    if (!verifySlackSignature(config.slackSigningSecret, timestamp, rawBody, signature)) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  const mirrored = parseSlackEvent(payload);
  return c.json({ ok: true, mirrored, readOnly: true });
});
