/** COMM-022: Full-text search — SQLite FTS5 stub (Meilisearch-compatible interface) */

import { getDb } from "../db/schema.ts";

export interface SearchResult {
  entityType: "thread" | "message" | "post";
  entityId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface SearchOptions {
  workspaceId: string;
  query: string;
  limit?: number;
  types?: Array<"thread" | "message" | "post">;
}

/** Index a searchable document into the FTS table */
export function indexDocument(
  entityType: string,
  entityId: string,
  workspaceId: string,
  title: string,
  body: string,
): void {
  const db = getDb();
  db.run("DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?", entityType, entityId);
  db.run(
    "INSERT INTO search_index (entity_type, entity_id, workspace_id, title, body) VALUES (?, ?, ?, ?, ?)",
    entityType,
    entityId,
    workspaceId,
    title,
    body,
  );
}

/** Remove a document from the search index */
export function removeFromIndex(entityType: string, entityId: string): void {
  const db = getDb();
  db.run("DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?", entityType, entityId);
}

/**
 * Search workspace content. Uses SQLite FTS5; swap backend to Meilisearch by
 * setting MEILISEARCH_URL and implementing the same interface.
 */
export function search(options: SearchOptions): SearchResult[] {
  const { workspaceId, query, limit = 20, types } = options;
  if (!query.trim()) return [];

  const db = getDb();
  const escaped = query.replace(/"/g, '""');
  const ftsQuery = `"${escaped}"* OR ${escaped.split(/\s+/).map((t) => `"${t}"*`).join(" OR ")}`;

  let sql = `
    SELECT entity_type, entity_id, title, snippet(search_index, 4, '<mark>', '</mark>', '…', 32) as snippet,
           bm25(search_index) as score
    FROM search_index
    WHERE workspace_id = ? AND search_index MATCH ?
  `;
  const params: (string | number)[] = [workspaceId, ftsQuery];

  if (types && types.length > 0) {
    sql += ` AND entity_type IN (${types.map(() => "?").join(", ")})`;
    params.push(...types);
  }

  sql += " ORDER BY score LIMIT ?";
  params.push(limit);

  try {
    const rows = db.query(sql).all(...params) as {
      entity_type: string;
      entity_id: string;
      title: string;
      snippet: string;
      score: number;
    }[];

    return rows.map((r) => ({
      entityType: r.entity_type as SearchResult["entityType"],
      entityId: r.entity_id,
      title: r.title,
      snippet: r.snippet,
      score: r.score,
    }));
  } catch {
    return [];
  }
}

/** Rebuild search index from existing data (for migrations / imports) */
export function rebuildSearchIndex(workspaceId: string): number {
  const db = getDb();
  db.run("DELETE FROM search_index WHERE workspace_id = ?", workspaceId);

  const threads = db
    .query(
      `SELECT t.id, t.title, t.summary, c.workspace_id
       FROM threads t JOIN channels c ON c.id = t.channel_id
       WHERE c.workspace_id = ?`,
    )
    .all(workspaceId) as { id: string; title: string; summary: string | null; workspace_id: string }[];

  for (const t of threads) {
    indexDocument("thread", t.id, workspaceId, t.title, t.summary ?? "");
  }

  const messages = db
    .query(
      `SELECT m.id, m.body, t.title, c.workspace_id
       FROM messages m
       JOIN threads t ON t.id = m.thread_id
       JOIN channels c ON c.id = t.channel_id
       WHERE c.workspace_id = ?`,
    )
    .all(workspaceId) as { id: string; body: string; title: string; workspace_id: string }[];

  for (const m of messages) {
    indexDocument("message", m.id, workspaceId, m.title, m.body);
  }

  const posts = db
    .query("SELECT p.id, p.title, pv.content FROM posts p LEFT JOIN post_versions pv ON pv.post_id = p.id AND pv.version = 1 WHERE p.workspace_id = ?")
    .all(workspaceId) as { id: string; title: string; content: string | null }[];

  for (const p of posts) {
    indexDocument("post", p.id, workspaceId, p.title, p.content ?? "");
  }

  return threads.length + messages.length + posts.length;
}
