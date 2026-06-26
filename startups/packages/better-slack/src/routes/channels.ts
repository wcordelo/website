import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/schema.ts";
import type { Channel } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { evaluateHumanChannelPermission } from "../permissions/engine.ts";
import { getAuth } from "./middleware.ts";

const createChannelSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

export const channelRoutes = new Hono();

channelRoutes.get("/", (c) => {
  const { user } = getAuth(c);
  const db = getDb();
  const channels = db
    .query("SELECT * FROM channels WHERE workspace_id = ? ORDER BY name")
    .all(user.workspace_id) as Channel[];
  return c.json({ channels });
});

channelRoutes.get("/:slug", (c) => {
  const { user } = getAuth(c);
  const slug = c.req.param("slug");
  const db = getDb();
  const channel = db
    .query("SELECT * FROM channels WHERE workspace_id = ? AND slug = ?")
    .get(user.workspace_id, slug) as Channel | null;

  if (!channel) return c.json({ error: "Channel not found" }, 404);
  if (!evaluateHumanChannelPermission(user.id, channel.id, "read")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  return c.json({ channel });
});

channelRoutes.post("/", async (c) => {
  const { user } = getAuth(c);
  const body = createChannelSchema.parse(await c.req.json());
  const db = getDb();
  const id = newId();

  db.run(
    "INSERT INTO channels (id, workspace_id, name, slug, description) VALUES (?, ?, ?, ?, ?)",
    id,
    user.workspace_id,
    body.name,
    body.slug,
    body.description ?? "",
  );
  db.run(
    "INSERT INTO channel_permissions (id, channel_id, user_id, level) VALUES (?, ?, ?, ?)",
    newId(),
    id,
    user.id,
    "admin",
  );

  const channel = db.query("SELECT * FROM channels WHERE id = ?").get(id);
  return c.json({ channel }, 201);
});
