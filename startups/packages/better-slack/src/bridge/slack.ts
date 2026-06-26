/** COMM-027: Slack bridge bot — read-only mirror stub */

export interface SlackBridgeConfig {
  slackBotToken: string;
  slackSigningSecret: string;
  workspaceId: string;
  /** Channel slug → Slack channel ID mapping */
  channelMap: Record<string, string>;
}

export interface SlackEventPayload {
  type: string;
  challenge?: string;
  event?: {
    type: string;
    channel: string;
    user?: string;
    text?: string;
    ts: string;
    thread_ts?: string;
  };
}

export interface MirroredMessage {
  slackChannelId: string;
  slackTs: string;
  threadTs: string | null;
  authorSlackId: string;
  body: string;
  mirroredAt: string;
}

/**
 * Read-only Slack → Better Slack mirror stub.
 * Receives Slack Events API payloads and returns normalized messages for indexing.
 * Does NOT post back to Slack (read-only by design).
 *
 * Setup:
 * 1. Create Slack app with `channels:history`, `channels:read` scopes
 * 2. Enable Events API → POST /api/bridge/slack/events
 * 3. Map Slack channel IDs in SLACK_BRIDGE_CHANNEL_MAP env JSON
 */
export function parseSlackEvent(payload: SlackEventPayload): MirroredMessage | null {
  if (payload.type === "url_verification" && payload.challenge) {
    return null;
  }

  const event = payload.event;
  if (!event || event.type !== "message" || !event.text || event.text.startsWith("bot_message")) {
    return null;
  }

  return {
    slackChannelId: event.channel,
    slackTs: event.ts,
    threadTs: event.thread_ts ?? null,
    authorSlackId: event.user ?? "unknown",
    body: event.text,
    mirroredAt: new Date().toISOString(),
  };
}

export function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  const base = `v0:${timestamp}:${body}`;
  const hmac = new Bun.CryptoHasher("sha256", signingSecret);
  hmac.update(base);
  const expected = `v0=${hmac.digest("hex")}`;
  return signature === expected;
}

export function loadBridgeConfig(): SlackBridgeConfig | null {
  const token = process.env.SLACK_BOT_TOKEN;
  const secret = process.env.SLACK_SIGNING_SECRET;
  const workspaceId = process.env.SLACK_BRIDGE_WORKSPACE_ID;
  const mapJson = process.env.SLACK_BRIDGE_CHANNEL_MAP ?? "{}";

  if (!token || !secret || !workspaceId) return null;

  return {
    slackBotToken: token,
    slackSigningSecret: secret,
    workspaceId,
    channelMap: JSON.parse(mapJson) as Record<string, string>,
  };
}
