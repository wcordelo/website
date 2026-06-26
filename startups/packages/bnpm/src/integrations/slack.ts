import type { BlockMatch } from "../types.js";

export interface SlackWebhookConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface BlockEventPayload {
  event: "block" | "warn";
  match: BlockMatch;
  orgId?: string;
  project?: string;
  ciRunUrl?: string;
}

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: Array<{ type: string; text: string }>;
}

export function formatBlockSlackMessage(payload: BlockEventPayload): SlackMessage {
  const { match } = payload;
  const emoji = payload.event === "block" ? ":no_entry:" : ":warning:";
  const severity = match.severity.toUpperCase();

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Better npm ${payload.event === "block" ? "blocked" : "warned"} install`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Package:*\n\`${match.package}@${match.version}\`` },
        { type: "mrkdwn", text: `*Severity:*\n${severity}` },
        { type: "mrkdwn", text: `*Action:*\n${match.action}` },
        { type: "mrkdwn", text: `*Source:*\n${match.source}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Reason:*\n${match.reason}` },
    },
  ];

  if (match.remediation) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Remediation:*\n${match.remediation}` },
    });
  }

  if (payload.project || payload.orgId) {
    blocks.push({
      type: "context",
      text: {
        type: "mrkdwn",
        text: [payload.orgId && `Org: ${payload.orgId}`, payload.project && `Project: ${payload.project}`]
          .filter(Boolean)
          .join(" · "),
      },
    });
  }

  if (payload.ciRunUrl) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `<${payload.ciRunUrl}|View CI run>` },
    });
  }

  return {
    text: `bnpm ${payload.event}: ${match.package}@${match.version} — ${match.reason}`,
    blocks,
  };
}

export async function postBlockEvent(
  config: SlackWebhookConfig,
  payload: BlockEventPayload,
): Promise<{ ok: boolean; status: number }> {
  const message = formatBlockSlackMessage(payload);
  const body = {
    channel: config.channel,
    username: config.username ?? "Better npm",
    icon_emoji: config.iconEmoji ?? ":shield:",
    ...message,
  };

  const res = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return { ok: res.ok, status: res.status };
}

export function resolveWebhookFromEnv(): SlackWebhookConfig | null {
  const url = process.env.BNPM_SLACK_WEBHOOK_URL ?? process.env.SLACK_WEBHOOK_URL;
  if (!url) return null;
  return {
    webhookUrl: url,
    channel: process.env.BNPM_SLACK_CHANNEL,
    username: process.env.BNPM_SLACK_USERNAME,
  };
}

export async function notifyBlockIfConfigured(payload: BlockEventPayload): Promise<boolean> {
  const config = resolveWebhookFromEnv();
  if (!config) return false;
  const result = await postBlockEvent(config, payload);
  return result.ok;
}
