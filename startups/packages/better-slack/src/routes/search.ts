import { Hono } from "hono";
import { z } from "zod";
import { search, rebuildSearchIndex } from "../search/index.ts";
import { getAuth } from "./middleware.ts";

/** COMM-022: Full-text search API */
export const searchRoutes = new Hono();

searchRoutes.get("/", (c) => {
  const { user } = getAuth(c);
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? "20");
  const typesParam = c.req.query("types");
  const types = typesParam ? (typesParam.split(",") as Array<"thread" | "message" | "post">) : undefined;

  const results = search({ workspaceId: user.workspace_id, query: q, limit, types });
  return c.json({ query: q, results, engine: process.env.MEILISEARCH_URL ? "meilisearch" : "sqlite-fts5" });
});

searchRoutes.post("/rebuild", (c) => {
  const { user } = getAuth(c);
  const count = rebuildSearchIndex(user.workspace_id);
  return c.json({ ok: true, indexed: count });
});

searchRoutes.post("/query", async (c) => {
  const { user } = getAuth(c);
  const body = z
    .object({
      query: z.string(),
      limit: z.number().optional(),
      types: z.array(z.enum(["thread", "message", "post"])).optional(),
    })
    .parse(await c.req.json());

  const results = search({
    workspaceId: user.workspace_id,
    query: body.query,
    limit: body.limit,
    types: body.types,
  });
  return c.json({ results });
});
