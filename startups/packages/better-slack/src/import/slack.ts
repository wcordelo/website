/** COMM-035: Slack history import — basic JSON export format */

import { getDb } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { indexDocument } from "../search/index.ts";

export interface SlackExportChannel {
  id: string;
  name: string;
}

export interface SlackExportMessage {
  type: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
}

export interface SlackExportFile {
  channel: SlackExportChannel;
  messages: SlackExportMessage[];
}

export interface ImportResult {
  channelsCreated: number;
  threadsCreated: number;
  messagesImported: number;
  errors: string[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

/**
 * Import Slack JSON export (one channel file).
 * Expected format: Slack workspace export JSON with `channel` and `messages` keys.
 *
 * Usage:
 * ```ts
 * const data = JSON.parse(await Bun.file("general.json").text());
 * importSlackChannel(workspaceId, userId, data);
 * ```
 */
export function importSlackChannel(
  workspaceId: string,
  importedBy: string,
  data: SlackExportFile,
): ImportResult {
  const db = getDb();
  const result: ImportResult = {
    channelsCreated: 0,
    threadsCreated: 0,
    messagesImported: 0,
    errors: [],
  };

  const channelSlug = `slack-${slugify(data.channel.name)}`;
  let channel = db
    .query("SELECT id FROM channels WHERE workspace_id = ? AND slug = ?")
    .get(workspaceId, channelSlug) as { id: string } | null;

  if (!channel) {
    const channelId = newId();
    db.run(
      "INSERT INTO channels (id, workspace_id, name, slug, description) VALUES (?, ?, ?, ?, ?)",
      channelId,
      workspaceId,
      data.channel.name,
      channelSlug,
      `Imported from Slack #${data.channel.name}`,
    );
    channel = { id: channelId };
    result.channelsCreated++;
  }

  const threadMap = new Map<string, string>();

  for (const msg of data.messages) {
    if (msg.type !== "message" || msg.subtype || !msg.text) continue;

    try {
      const isReply = msg.thread_ts && msg.thread_ts !== msg.ts;
      let threadId: string;

      if (isReply) {
        threadId = threadMap.get(msg.thread_ts!)!;
        if (!threadId) {
          result.errors.push(`Orphan reply at ts=${msg.ts}`);
          continue;
        }
      } else {
        const title = msg.text.slice(0, 80).replace(/\n/g, " ");
        const slug = `import-${msg.ts.replace(".", "-")}`;
        threadId = newId();
        db.run(
          `INSERT INTO threads (id, channel_id, title, slug, status, created_by, created_by_type)
           VALUES (?, ?, ?, ?, 'resolved', ?, 'human')`,
          threadId,
          channel.id,
          title,
          slug,
          importedBy,
        );
        threadMap.set(msg.ts, threadId);
        result.threadsCreated++;
        indexDocument("thread", threadId, workspaceId, title, "");
      }

      const messageId = newId();
      db.run(
        "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'human', ?)",
        messageId,
        threadId,
        msg.user ?? "slack-import",
        msg.text,
      );
      indexDocument("message", messageId, workspaceId, titleFromThread(db, threadId), msg.text);
      result.messagesImported++;
    } catch (err) {
      result.errors.push(`Failed ts=${msg.ts}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

function titleFromThread(db: ReturnType<typeof getDb>, threadId: string): string {
  const row = db.query("SELECT title FROM threads WHERE id = ?").get(threadId) as { title: string } | null;
  return row?.title ?? "";
}

/** Import multiple Slack channel export files */
export function importSlackExport(
  workspaceId: string,
  importedBy: string,
  files: SlackExportFile[],
): ImportResult {
  const combined: ImportResult = {
    channelsCreated: 0,
    threadsCreated: 0,
    messagesImported: 0,
    errors: [],
  };

  for (const file of files) {
    const r = importSlackChannel(workspaceId, importedBy, file);
    combined.channelsCreated += r.channelsCreated;
    combined.threadsCreated += r.threadsCreated;
    combined.messagesImported += r.messagesImported;
    combined.errors.push(...r.errors);
  }

  return combined;
}
