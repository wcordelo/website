import { Hono } from "hono";
import { getAuth } from "./middleware.ts";
import { importSlackChannel } from "../import/slack.ts";
import type { SlackExportFile } from "../import/slack.ts";

/** COMM-035: Slack history import API */
export const importRoutes = new Hono();

importRoutes.post("/slack", async (c) => {
  const { user } = getAuth(c);
  const data = (await c.req.json()) as SlackExportFile;
  const result = importSlackChannel(user.workspace_id, user.id, data);
  return c.json({ result });
});
