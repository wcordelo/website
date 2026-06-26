import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/schema.ts";
import type { Post, PostVersion } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { listTemplates, getTemplate } from "../posts/templates.ts";
import { logAudit } from "../permissions/engine.ts";
import { indexDocument } from "../search/index.ts";
import { pubsub } from "../ws/pubsub.ts";
import { getAuth, getAgent } from "./middleware.ts";

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1),
  template: z.enum(["adr", "incident", "rfc", "runbook"]).optional(),
  threadId: z.string().optional(),
  changeSummary: z.string().optional(),
});

const proposePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  template: z.enum(["adr", "incident", "rfc", "runbook"]).optional(),
  threadId: z.string().optional(),
  changeSummary: z.string().optional(),
});

const newVersionSchema = z.object({
  content: z.string().min(1),
  changeSummary: z.string().optional(),
});

/** COMM-008, COMM-009, COMM-010, COMM-011, COMM-018: Post routes */
export const postRoutes = new Hono();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function lineDiff(oldText: string, newText: string): { added: string[]; removed: string[]; unchanged: number } {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  return {
    added: newLines.filter((l) => !oldSet.has(l)),
    removed: oldLines.filter((l) => !newSet.has(l)),
    unchanged: newLines.filter((l) => oldSet.has(l)).length,
  };
}

/** COMM-011: List post templates */
postRoutes.get("/templates", (c) => {
  return c.json({ templates: listTemplates() });
});

postRoutes.get("/templates/:templateId", (c) => {
  const template = getTemplate(c.req.param("templateId"));
  if (!template) return c.json({ error: "Template not found" }, 404);
  return c.json({ template });
});

postRoutes.get("/", (c) => {
  const { user } = getAuth(c);
  const status = c.req.query("status");
  const db = getDb();

  let posts: Post[];
  if (status) {
    posts = db
      .query("SELECT * FROM posts WHERE workspace_id = ? AND status = ? ORDER BY updated_at DESC")
      .all(user.workspace_id, status) as Post[];
  } else {
    posts = db
      .query("SELECT * FROM posts WHERE workspace_id = ? ORDER BY updated_at DESC")
      .all(user.workspace_id) as Post[];
  }
  return c.json({ posts });
});

postRoutes.get("/:postId", (c) => {
  const postId = c.req.param("postId");
  const db = getDb();
  const post = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post | null;
  if (!post) return c.json({ error: "Post not found" }, 404);

  const versions = db
    .query("SELECT * FROM post_versions WHERE post_id = ? ORDER BY version ASC")
    .all(postId) as PostVersion[];
  const latest = versions[versions.length - 1];
  return c.json({ post, versions, latestVersion: latest });
});

postRoutes.get("/:postId/diff", (c) => {
  const postId = c.req.param("postId");
  const from = Number(c.req.query("from") ?? "1");
  const to = Number(c.req.query("to"));
  const db = getDb();

  const versions = db
    .query("SELECT * FROM post_versions WHERE post_id = ? ORDER BY version ASC")
    .all(postId) as PostVersion[];
  if (versions.length === 0) return c.json({ error: "No versions" }, 404);

  const toVersion = to || versions[versions.length - 1]!.version;
  const vFrom = versions.find((v) => v.version === from);
  const vTo = versions.find((v) => v.version === toVersion);
  if (!vFrom || !vTo) return c.json({ error: "Version not found" }, 404);

  const diff = lineDiff(vFrom.content, vTo.content);
  return c.json({
    from: vFrom.version,
    to: vTo.version,
    diff,
    fromContent: vFrom.content,
    toContent: vTo.content,
  });
});

postRoutes.post("/", async (c) => {
  const { user } = getAuth(c);
  const body = createPostSchema.parse(await c.req.json());
  const db = getDb();
  const postId = newId();
  const versionId = newId();
  const slug = body.slug ?? slugify(body.title);

  let content = body.content;
  if (body.template) {
    const tmpl = getTemplate(body.template);
    if (tmpl && content === body.content) {
      content = tmpl.content.replace("[Title]", body.title);
    }
  }

  db.run(
    `INSERT INTO posts (id, workspace_id, thread_id, title, slug, template, status, created_by, created_by_type)
     VALUES (?, ?, ?, ?, ?, ?, 'published', ?, 'human')`,
    postId,
    user.workspace_id,
    body.threadId ?? null,
    body.title,
    slug,
    body.template ?? null,
    user.id,
  );
  db.run(
    `INSERT INTO post_versions (id, post_id, version, content, change_summary, created_by, created_by_type)
     VALUES (?, ?, 1, ?, ?, ?, 'human')`,
    versionId,
    postId,
    content,
    body.changeSummary ?? "Initial version",
    user.id,
  );

  indexDocument("post", postId, user.workspace_id, body.title, content);

  const post = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post;
  const version = db.query("SELECT * FROM post_versions WHERE id = ?").get(versionId) as PostVersion;
  pubsub.publish(user.workspace_id, { type: "post.created", post, version });
  logAudit(user.workspace_id, "human", user.id, "post.create", "post", postId, { title: body.title });

  return c.json({ post, version }, 201);
});

/** COMM-018: Agent proposes a post for human approval — handler exported for unauthenticated route */
export async function proposePostHandler(c: import("hono").Context): Promise<Response> {
  const agent = getAgent(c);
  const body = proposePostSchema.parse(await c.req.json());
  const db = getDb();
  const postId = newId();
  const versionId = newId();
  const slug = slugify(body.title);

  db.run(
    `INSERT INTO posts (id, workspace_id, thread_id, title, slug, template, status, created_by, created_by_type)
     VALUES (?, ?, ?, ?, ?, ?, 'proposed', ?, 'agent')`,
    postId,
    agent.workspace_id,
    body.threadId ?? null,
    body.title,
    slug,
    body.template ?? null,
    agent.id,
  );
  db.run(
    `INSERT INTO post_versions (id, post_id, version, content, change_summary, created_by, created_by_type)
     VALUES (?, ?, 1, ?, ?, ?, 'agent')`,
    versionId,
    postId,
    body.content,
    body.changeSummary ?? "Agent proposal",
    agent.id,
  );

  const post = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post;
  const version = db.query("SELECT * FROM post_versions WHERE id = ?").get(versionId) as PostVersion;
  pubsub.publish(agent.workspace_id, { type: "post.proposed", post, version });
  logAudit(agent.workspace_id, "agent", agent.id, "post.propose", "post", postId, { title: body.title });

  return c.json({ post, version }, 201);
}

/** COMM-018: Approve proposed post */
postRoutes.post("/:postId/approve", async (c) => {
  const { user } = getAuth(c);
  const postId = c.req.param("postId");
  const db = getDb();

  const post = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post | null;
  if (!post) return c.json({ error: "Post not found" }, 404);
  if (post.workspace_id !== user.workspace_id) return c.json({ error: "Forbidden" }, 403);
  if (post.status !== "proposed") return c.json({ error: "Post is not pending approval" }, 400);

  db.run("UPDATE posts SET status = 'published', updated_at = datetime('now') WHERE id = ?", postId);

  const version = db
    .query("SELECT content FROM post_versions WHERE post_id = ? ORDER BY version DESC LIMIT 1")
    .get(postId) as { content: string };
  indexDocument("post", postId, user.workspace_id, post.title, version.content);

  const updated = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post;
  pubsub.publish(user.workspace_id, { type: "post.approved", post: updated });
  logAudit(user.workspace_id, "human", user.id, "post.approve", "post", postId, {});

  return c.json({ post: updated });
});

postRoutes.post("/:postId/reject", async (c) => {
  const { user } = getAuth(c);
  const postId = c.req.param("postId");
  const body = z.object({ reason: z.string().optional() }).parse(await c.req.json().catch(() => ({})));
  const db = getDb();

  const post = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post | null;
  if (!post) return c.json({ error: "Post not found" }, 404);
  if (post.workspace_id !== user.workspace_id) return c.json({ error: "Forbidden" }, 403);
  if (post.status !== "proposed") return c.json({ error: "Post is not pending approval" }, 400);

  db.run("UPDATE posts SET status = 'draft', updated_at = datetime('now') WHERE id = ?", postId);

  const updated = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post;
  pubsub.publish(user.workspace_id, { type: "post.rejected", post: updated });
  logAudit(user.workspace_id, "human", user.id, "post.reject", "post", postId, { reason: body.reason });

  return c.json({ post: updated });
});

postRoutes.post("/:postId/versions", async (c) => {
  const { user } = getAuth(c);
  const postId = c.req.param("postId");
  const body = newVersionSchema.parse(await c.req.json());
  const db = getDb();

  const post = db.query("SELECT * FROM posts WHERE id = ?").get(postId) as Post | null;
  if (!post) return c.json({ error: "Post not found" }, 404);
  if (post.workspace_id !== user.workspace_id) return c.json({ error: "Forbidden" }, 403);

  const maxRow = db
    .query("SELECT MAX(version) as max_v FROM post_versions WHERE post_id = ?")
    .get(postId) as { max_v: number };
  const nextVersion = (maxRow.max_v ?? 0) + 1;
  const versionId = newId();

  db.run(
    `INSERT INTO post_versions (id, post_id, version, content, change_summary, created_by, created_by_type)
     VALUES (?, ?, ?, ?, ?, ?, 'human')`,
    versionId,
    postId,
    nextVersion,
    body.content,
    body.changeSummary ?? `Version ${nextVersion}`,
    user.id,
  );
  db.run("UPDATE posts SET updated_at = datetime('now') WHERE id = ?", postId);
  indexDocument("post", postId, user.workspace_id, post.title, body.content);

  const version = db.query("SELECT * FROM post_versions WHERE id = ?").get(versionId) as PostVersion;
  pubsub.publish(user.workspace_id, { type: "post.version", postId, version });
  logAudit(user.workspace_id, "human", user.id, "post.version", "post", postId, { version: nextVersion });

  return c.json({ version }, 201);
});
