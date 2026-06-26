import { Database } from "bun:sqlite";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

const DATA_DIR = join(import.meta.dir, "../../data");
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.BETTER_SLACK_DB ?? join(DATA_DIR, "better-slack.db");

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true });
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    migrate(db);
  }
  return db;
}

export function closeDb(): void {
  db?.close();
  db = null;
}

function migrate(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, email)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, slug)
    );

    CREATE TABLE IF NOT EXISTS channel_permissions (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      level TEXT NOT NULL CHECK(level IN ('read', 'write', 'admin')),
      UNIQUE(channel_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      parent_thread_id TEXT REFERENCES threads(id),
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
      summary TEXT,
      created_by TEXT NOT NULL,
      created_by_type TEXT NOT NULL DEFAULT 'human' CHECK(created_by_type IN ('human', 'agent')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(channel_id, slug)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL,
      author_type TEXT NOT NULL DEFAULT 'human' CHECK(author_type IN ('human', 'agent')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      thread_id TEXT REFERENCES threads(id),
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      template TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'proposed', 'published')),
      created_by TEXT NOT NULL,
      created_by_type TEXT NOT NULL DEFAULT 'human',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, slug)
    );

    CREATE TABLE IF NOT EXISTS post_versions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      change_summary TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_by_type TEXT NOT NULL DEFAULT 'human',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(post_id, version)
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES users(id),
      api_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      rate_limit INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_capabilities (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      capability TEXT NOT NULL,
      effect TEXT NOT NULL CHECK(effect IN ('allow', 'deny')),
      resource_pattern TEXT NOT NULL DEFAULT '*'
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      actor_type TEXT NOT NULL CHECK(actor_type IN ('human', 'agent', 'system')),
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_threads_channel ON threads(channel_id);
    CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_posts_workspace ON posts(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_log(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_agents_workspace ON agents(workspace_id);

    CREATE TABLE IF NOT EXISTS thread_subscriptions (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(thread_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_thread_subscriptions_user ON thread_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_threads_parent ON threads(parent_thread_id);
  `);

  database.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      entity_type,
      entity_id UNINDEXED,
      workspace_id UNINDEXED,
      title,
      body,
      tokenize='porter unicode61'
    );
  `);
}

export type ThreadStatus = "open" | "in_progress" | "resolved";
export type PostStatus = "draft" | "proposed" | "published";
export type PermissionLevel = "read" | "write" | "admin";
export type CapabilityEffect = "allow" | "deny";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface Thread {
  id: string;
  channel_id: string;
  parent_thread_id: string | null;
  title: string;
  slug: string;
  status: ThreadStatus;
  summary: string | null;
  created_by: string;
  created_by_type: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  author_id: string;
  author_type: string;
  body: string;
  created_at: string;
}

export interface Post {
  id: string;
  workspace_id: string;
  thread_id: string | null;
  title: string;
  slug: string;
  template: string | null;
  status: PostStatus;
  created_by: string;
  created_by_type: string;
  created_at: string;
  updated_at: string;
}

export interface PostVersion {
  id: string;
  post_id: string;
  version: number;
  content: string;
  change_summary: string;
  created_by: string;
  created_by_type: string;
  created_at: string;
}

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  owner_id: string;
  api_key: string;
  status: string;
  rate_limit: number;
  created_at: string;
}

export interface AgentCapability {
  id: string;
  agent_id: string;
  capability: string;
  effect: CapabilityEffect;
  resource_pattern: string;
}

export interface AuditEntry {
  id: string;
  workspace_id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string;
  created_at: string;
}
