import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/schema.ts";
import type { Thread, ThreadStatus } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { evaluateHumanChannelPermission, logAudit } from "../permissions/engine.ts";
import { indexDocument } from "../search/index.ts";
import { pubsub } from "../ws/pubsub.ts";
import { getAuth } from "./middleware.ts";

const createThreadSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  parentThreadId: z.string().optional(),
});

const splitThreadSchema = z.object({
  title: z.string().min(1),
  fromMessageId: z.string().optional(),
});

const VALID_TRANSITIONS: Record<ThreadStatus, ThreadStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["open", "resolved"],
  resolved: ["open"],
};

/** COMM-003, COMM-004, COMM-005, COMM-006, COMM-007: Thread routes */
const updateStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]),
  summary: z.string().optional(),
});

export const threadRoutes = new Hono();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function uniqueSlug(db: ReturnType<typeof getDb>, channelId: string, base: string): string {
  let slug = base;
  let n = 1;
  while (db.query("SELECT id FROM threads WHERE channel_id = ? AND slug = ?").get(channelId, slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

threadRoutes.get("/channel/:channelSlug", (c) => {
  const { user } = getAuth(c);
  const channelSlug = c.req.param("channelSlug");
  const db = getDb();

  const channel = db
    .query("SELECT * FROM channels WHERE workspace_id = ? AND slug = ?")
    .get(user.workspace_id, channelSlug) as { id: string } | null;
  if (!channel) return c.json({ error: "Channel not found" }, 404);

  const threads = db
    .query(
      `SELECT t.*, (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) as message_count
       FROM threads t WHERE t.channel_id = ? AND t.parent_thread_id IS NULL
       ORDER BY t.updated_at DESC`,
    )
    .all(channel.id) as (Thread & { message_count: number })[];

  return c.json({ threads });
});

threadRoutes.get("/:threadId", (c) => {
  const threadId = c.req.param("threadId");
  const db = getDb();
  const thread = db.query("SELECT * FROM threads WHERE id = ?").get(threadId) as Thread | null;
  if (!thread) return c.json({ error: "Thread not found" }, 404);
  return c.json({ thread });
});

/** COMM-007: Thread preview for cross-thread references */
threadRoutes.get("/:threadId/preview", (c) => {
  const threadId = c.req.param("threadId");
  const db = getDb();
  const row = db
    .query(
      `SELECT t.id, t.title, t.status, t.summary, c.slug as channel_slug,
              (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) as message_count
       FROM threads t JOIN channels c ON c.id = t.channel_id
       WHERE t.id = ?`,
    )
    .get(threadId) as {
    id: string;
    title: string;
    status: string;
    summary: string | null;
    channel_slug: string;
    message_count: number;
  } | null;

  if (!row) return c.json({ error: "Thread not found" }, 404);
  return c.json({ preview: row });
});

threadRoutes.post("/previews", async (c) => {
  const body = z.object({ threadIds: z.array(z.string()).min(1).max(20) }).parse(await c.req.json());
  const db = getDb();
  const previews = body.threadIds.map((id) => {
    const row = db
      .query(
        `SELECT t.id, t.title, t.status, c.slug as channel_slug
         FROM threads t JOIN channels c ON c.id = t.channel_id WHERE t.id = ?`,
      )
      .get(id) as { id: string; title: string; status: string; channel_slug: string } | null;
    return row ? { ...row, found: true } : { id, found: false };
  });
  return c.json({ previews });
});

/** COMM-004: List sub-threads */
threadRoutes.get("/:threadId/subthreads", (c) => {
  const parentId = c.req.param("threadId");
  const db = getDb();
  const subthreads = db
    .query(
      `SELECT t.*, (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) as message_count
       FROM threads t WHERE t.parent_thread_id = ? ORDER BY t.created_at ASC`,
    )
    .all(parentId) as (Thread & { message_count: number })[];
  return c.json({ subthreads });
});

/** COMM-003: Create thread with optional initial message */
threadRoutes.post("/channel/:channelSlug", async (c) => {
  const { user } = getAuth(c);
  const channelSlug = c.req.param("channelSlug");
  const body = createThreadSchema.parse(await c.req.json());
  const db = getDb();

  const channel = db
    .query("SELECT * FROM channels WHERE workspace_id = ? AND slug = ?")
    .get(user.workspace_id, channelSlug) as { id: string; workspace_id: string } | null;
  if (!channel) return c.json({ error: "Channel not found" }, 404);
  if (!evaluateHumanChannelPermission(user.id, channel.id, "write")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (body.parentThreadId) {
    const parent = db.query("SELECT channel_id FROM threads WHERE id = ?").get(body.parentThreadId) as
      | { channel_id: string }
      | null;
    if (!parent || parent.channel_id !== channel.id) {
      return c.json({ error: "Parent thread not found in this channel" }, 400);
    }
  }

  const baseSlug = body.slug ?? slugify(body.title);
  const slug = uniqueSlug(db, channel.id, baseSlug);
  const id = newId();

  db.run(
    `INSERT INTO threads (id, channel_id, parent_thread_id, title, slug, status, created_by, created_by_type)
     VALUES (?, ?, ?, ?, ?, 'open', ?, 'human')`,
    id,
    channel.id,
    body.parentThreadId ?? null,
    body.title,
    slug,
    user.id,
  );

  if (body.body?.trim()) {
    const msgId = newId();
    db.run(
      "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'human', ?)",
      msgId,
      id,
      user.id,
      body.body.trim(),
    );
    indexDocument("message", msgId, channel.workspace_id, body.title, body.body.trim());
  }

  indexDocument("thread", id, channel.workspace_id, body.title, body.body ?? "");

  const thread = db.query("SELECT * FROM threads WHERE id = ?").get(id) as Thread;
  pubsub.publish(channel.workspace_id, { type: "thread.created", thread });
  logAudit(user.workspace_id, "human", user.id, "thread.create", "thread", id, {
    title: body.title,
    parentThreadId: body.parentThreadId,
  });

  return c.json({ thread }, 201);
});

/** COMM-004: Split discussion into sub-thread */
threadRoutes.post("/:threadId/split", async (c) => {
  const { user } = getAuth(c);
  const parentId = c.req.param("threadId");
  const body = splitThreadSchema.parse(await c.req.json());
  const db = getDb();

  const parent = db.query("SELECT * FROM threads WHERE id = ?").get(parentId) as Thread | null;
  if (!parent) return c.json({ error: "Thread not found" }, 404);

  const channel = db.query("SELECT * FROM channels WHERE id = ?").get(parent.channel_id) as {
    id: string;
    workspace_id: string;
  };
  if (!evaluateHumanChannelPermission(user.id, channel.id, "write")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const slug = uniqueSlug(db, channel.id, slugify(body.title));
  const subId = newId();
  db.run(
    `INSERT INTO threads (id, channel_id, parent_thread_id, title, slug, status, created_by, created_by_type)
     VALUES (?, ?, ?, ?, ?, 'open', ?, 'human')`,
    subId,
    channel.id,
    parentId,
    body.title,
    slug,
    user.id,
  );

  if (body.fromMessageId) {
    const sourceMsg = db.query("SELECT body FROM messages WHERE id = ? AND thread_id = ?").get(
      body.fromMessageId,
      parentId,
    ) as { body: string } | null;
    if (sourceMsg) {
      const msgId = newId();
      db.run(
        "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'human', ?)",
        msgId,
        subId,
        user.id,
        `Split from parent thread:\n\n${sourceMsg.body}`,
      );
      indexDocument("message", msgId, channel.workspace_id, body.title, sourceMsg.body);
    }
  }

  indexDocument("thread", subId, channel.workspace_id, body.title, "");

  const subthread = db.query("SELECT * FROM threads WHERE id = ?").get(subId) as Thread;
  pubsub.publish(channel.workspace_id, { type: "thread.split", parentId, thread: subthread });
  logAudit(user.workspace_id, "human", user.id, "thread.split", "thread", subId, { parentId });

  return c.json({ thread: subthread }, 201);
});

/** COMM-006: Subscribe to thread */
threadRoutes.post("/:threadId/subscribe", (c) => {
  const { user } = getAuth(c);
  const threadId = c.req.param("threadId");
  const db = getDb();

  const thread = db.query("SELECT id FROM threads WHERE id = ?").get(threadId);
  if (!thread) return c.json({ error: "Thread not found" }, 404);

  const existing = db
    .query("SELECT id FROM thread_subscriptions WHERE thread_id = ? AND user_id = ?")
    .get(threadId, user.id);
  if (!existing) {
    db.run(
      "INSERT INTO thread_subscriptions (id, thread_id, user_id) VALUES (?, ?, ?)",
      newId(),
      threadId,
      user.id,
    );
    logAudit(user.workspace_id, "human", user.id, "thread.subscribe", "thread", threadId, {});
  }

  return c.json({ subscribed: true });
});

threadRoutes.delete("/:threadId/subscribe", (c) => {
  const { user } = getAuth(c);
  const threadId = c.req.param("threadId");
  const db = getDb();

  db.run("DELETE FROM thread_subscriptions WHERE thread_id = ? AND user_id = ?", threadId, user.id);
  logAudit(user.workspace_id, "human", user.id, "thread.unsubscribe", "thread", threadId, {});

  return c.json({ subscribed: false });
});

threadRoutes.get("/:threadId/subscribe", (c) => {
  const { user } = getAuth(c);
  const threadId = c.req.param("threadId");
  const db = getDb();

  const row = db
    .query("SELECT id FROM thread_subscriptions WHERE thread_id = ? AND user_id = ?")
    .get(threadId, user.id);

  return c.json({ subscribed: !!row });
});

threadRoutes.patch("/:threadId/status", async (c) => {
  const { user } = getAuth(c);
  const threadId = c.req.param("threadId");
  const body = updateStatusSchema.parse(await c.req.json());
  const db = getDb();

  const thread = db.query("SELECT * FROM threads WHERE id = ?").get(threadId) as Thread | null;
  if (!thread) return c.json({ error: "Thread not found" }, 404);

  const channel = db.query("SELECT * FROM channels WHERE id = ?").get(thread.channel_id) as {
    id: string;
    workspace_id: string;
  };
  if (!evaluateHumanChannelPermission(user.id, channel.id, "write")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const allowed = VALID_TRANSITIONS[thread.status];
  if (!allowed.includes(body.status)) {
    return c.json({ error: `Cannot transition from ${thread.status} to ${body.status}` }, 400);
  }

  if (body.status === "resolved" && !body.summary?.trim()) {
    return c.json({ error: "Resolution summary is required" }, 400);
  }

  if (body.status === "resolved" && body.summary) {
    db.run(
      "UPDATE threads SET status = ?, summary = ?, updated_at = datetime('now') WHERE id = ?",
      body.status,
      body.summary.trim(),
      threadId,
    );
    indexDocument("thread", threadId, channel.workspace_id, thread.title, body.summary.trim());
  } else {
    db.run("UPDATE threads SET status = ?, updated_at = datetime('now') WHERE id = ?", body.status, threadId);
  }

  const updated = db.query("SELECT * FROM threads WHERE id = ?").get(threadId) as Thread;
  pubsub.publish(channel.workspace_id, { type: "thread.updated", thread: updated });
  logAudit(user.workspace_id, "human", user.id, "thread.status", "thread", threadId, { status: body.status });

  return c.json({ thread: updated });
});
