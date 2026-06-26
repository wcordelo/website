import type { ScanResult, SlackAlertPayload } from "../types.js";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Slack alert integration (MOB-034).
 * Posts scan summary to a Slack incoming webhook.
 */
export function buildSlackMessage(result: ScanResult, scanUrl?: string): SlackAlertPayload {
  const criticalCount = result.preflight.filter(
    (v) => !v.passed && v.severity === "error",
  ).length;

  return {
    healthScore: result.healthScore,
    projectName: result.graph.root,
    criticalCount,
    scanUrl,
  };
}

export function formatSlackBlocks(payload: SlackAlertPayload): Record<string, unknown> {
  const color = payload.healthScore >= 80 ? "#36a64f" : payload.healthScore >= 50 ? "#daa038" : "#dc3545";

  return {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: `ShipKit: ${payload.projectName}` },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Health Score*\n${payload.healthScore}/100` },
              { type: "mrkdwn", text: `*Critical Issues*\n${payload.criticalCount}` },
            ],
          },
          ...(payload.scanUrl
            ? [
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "View Report" },
                      url: payload.scanUrl,
                    },
                  ],
                },
              ]
            : []),
        ],
      },
    ],
  };
}

export async function sendSlackAlert(
  result: ScanResult,
  options: { scanUrl?: string; webhookUrl?: string } = {},
): Promise<{ sent: boolean; stub: boolean }> {
  const webhookUrl = options.webhookUrl ?? SLACK_WEBHOOK_URL;
  const payload = buildSlackMessage(result, options.scanUrl);
  const body = formatSlackBlocks(payload);

  if (!webhookUrl) {
    return { sent: false, stub: true };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return { sent: response.ok, stub: false };
}
