import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { evaluateHumanChannelPermission, logAudit } from "../permissions/engine.ts";
import { indexDocument } from "../search/index.ts";
import { pubsub } from "../ws/pubsub.ts";
import { getAuth } from "./middleware.ts";
import { parseThreadRefs } from "../utils/thread-refs.ts";

const createMessageSchema = z.object({
  body: z.string().min(1),
});

export const messageRoutes = new Hono();

messageRoutes.get("/thread/:threadId", (c) => {
  const threadId = c.req.param("threadId");
  const db = getDb();
  const messages = db
    .query("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC")
    .all(threadId) as import("../db/schema.ts").Message[];
  return c.json({ messages });
});

messageRoutes.post("/thread/:threadId", async (c) => {
  const { user } = getAuth(c);
  const threadId = c.req.param("threadId");
  const body = createMessageSchema.parse(await c.req.json());
  const db = getDb();

  const thread = db.query("SELECT * FROM threads WHERE id = ?").get(threadId) as
    | { channel_id: string; title: string }
    | null;
  if (!thread) return c.json({ error: "Thread not found" }, 404);

  const channel = db.query("SELECT * FROM channels WHERE id = ?").get(thread.channel_id) as {
    id: string;
    workspace_id: string;
  };
  if (!evaluateHumanChannelPermission(user.id, channel.id, "write")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = newId();
  db.run(
    "INSERT INTO messages (id, thread_id, author_id, author_type, body) VALUES (?, ?, ?, 'human', ?)",
    id,
    threadId,
    user.id,
    body.body,
  );
  db.run("UPDATE threads SET updated_at = datetime('now') WHERE id = ?", threadId);
  indexDocument("message", id, channel.workspace_id, thread.title, body.body);

  const refs = parseThreadRefs(body.body);
  const message = db.query("SELECT * FROM messages WHERE id = ?").get(id) as import("../db/schema.ts").Message;
  pubsub.publish(channel.workspace_id, { type: "message.created", message, threadId, refs });
  logAudit(user.workspace_id, "human", user.id, "message.create", "message", id, { threadId, refCount: refs.length });

  return c.json({ message, refs }, 201);
});
