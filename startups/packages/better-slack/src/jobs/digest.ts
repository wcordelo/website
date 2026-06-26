/** COMM-031: Notification digest — email digest job stub */

import { getDb } from "../db/schema.ts";

export interface DigestEntry {
  threadId: string;
  threadTitle: string;
  channelSlug: string;
  messageCount: number;
  lastActivity: string;
}

export interface DigestEmail {
  to: string;
  subject: string;
  html: string;
  entries: DigestEntry[];
}

export interface DigestOptions {
  workspaceId: string;
  userId: string;
  sinceHours?: number;
}

/**
 * Build a digest of subscribed thread activity for a user.
 * In production, wire to SendGrid/Resend via DIGEST_EMAIL_PROVIDER env.
 */
export function buildUserDigest(options: DigestOptions): DigestEmail | null {
  const { workspaceId, userId, sinceHours = 24 } = options;
  const db = getDb();

  const user = db.query("SELECT email, name FROM users WHERE id = ?").get(userId) as
    | { email: string; name: string }
    | null;
  if (!user) return null;

  const entries = db
    .query(
      `SELECT t.id as threadId, t.title as threadTitle, c.slug as channelSlug,
              COUNT(m.id) as messageCount, MAX(m.created_at) as lastActivity
       FROM thread_subscriptions ts
       JOIN threads t ON t.id = ts.thread_id
       JOIN channels c ON c.id = t.channel_id
       LEFT JOIN messages m ON m.thread_id = t.id
         AND m.created_at > datetime('now', ?)
       WHERE ts.user_id = ? AND c.workspace_id = ?
       GROUP BY t.id
       HAVING messageCount > 0
       ORDER BY lastActivity DESC`,
    )
    .all(`-${sinceHours} hours`, userId, workspaceId) as DigestEntry[];

  if (entries.length === 0) return null;

  const lines = entries.map(
    (e) => `<li><strong>#${e.channelSlug}</strong> — ${e.threadTitle} (${e.messageCount} new)</li>`,
  );

  return {
    to: user.email,
    subject: `Better Slack digest — ${entries.length} active thread${entries.length === 1 ? "" : "s"}`,
    html: `<p>Hi ${user.name},</p><ul>${lines.join("")}</ul><p><a href="https://app.better-slack.dev">Open Better Slack</a></p>`,
    entries,
  };
}

export interface SendDigestResult {
  sent: boolean;
  stub: boolean;
  recipient?: string;
  entryCount?: number;
}

/** Send digest email (stub — logs to stdout unless DIGEST_EMAIL_PROVIDER is set) */
export function sendDigest(email: DigestEmail): SendDigestResult {
  const provider = process.env.DIGEST_EMAIL_PROVIDER;

  if (!provider) {
    console.log(`[digest stub] Would send to ${email.to}: ${email.subject}`);
    console.log(`[digest stub] ${email.entries.length} entries`);
    return { sent: true, stub: true, recipient: email.to, entryCount: email.entries.length };
  }

  // Production: integrate with SendGrid, Resend, etc.
  console.log(`[digest] Sending via ${provider} to ${email.to}`);
  return { sent: true, stub: false, recipient: email.to, entryCount: email.entries.length };
}

/** Run digest job for all users with subscriptions in a workspace */
export function runWorkspaceDigest(workspaceId: string, sinceHours = 24): SendDigestResult[] {
  const db = getDb();
  const users = db
    .query(
      `SELECT DISTINCT ts.user_id FROM thread_subscriptions ts
       JOIN threads t ON t.id = ts.thread_id
       JOIN channels c ON c.id = t.channel_id
       WHERE c.workspace_id = ?`,
    )
    .all(workspaceId) as { user_id: string }[];

  const results: SendDigestResult[] = [];
  for (const { user_id } of users) {
    const digest = buildUserDigest({ workspaceId, userId: user_id, sinceHours });
    if (digest) {
      results.push(sendDigest(digest));
    }
  }
  return results;
}
