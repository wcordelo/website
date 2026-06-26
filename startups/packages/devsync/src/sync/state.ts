import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { configDir } from "../config.ts";

const SCHEMA_VERSION = 1;

export interface FileRecord {
  id: number;
  rootId: string;
  relativePath: string;
  fileHash: string;
  size: number;
  mtimeMs: number;
  syncState: "pending" | "synced" | "conflict" | "deleted";
  version: number;
}

export interface ChunkRecord {
  id: number;
  hash: string;
  size: number;
  dataPath: string | null;
}

export class SyncState {
  private db: Database;

  constructor(dbPath?: string) {
    const path = dbPath ?? `${configDir()}/state.db`;
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.db = new Database(path);
    this.migrate();
  }

  private migrate(): void {
    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run("PRAGMA foreign_keys = ON");

    this.db.run(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      )
    `);

    const row = this.db
      .query("SELECT version FROM schema_version LIMIT 1")
      .get() as { version: number } | null;

    if (!row) {
      this.db.run("INSERT INTO schema_version (version) VALUES (?)", [SCHEMA_VERSION]);
      this.createTables();
    }
  }

  private createTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        root_id TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        size INTEGER NOT NULL,
        mtime_ms INTEGER NOT NULL,
        sync_state TEXT NOT NULL DEFAULT 'pending',
        version INTEGER NOT NULL DEFAULT 1,
        UNIQUE(root_id, relative_path)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL,
        data_path TEXT
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS file_chunks (
        file_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_hash TEXT NOT NULL,
        PRIMARY KEY (file_id, chunk_index),
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS peers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        last_seen_ms INTEGER
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS transfer_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        root_id TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        direction TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_ms INTEGER NOT NULL
      )
    `);

    this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_files_root ON files(root_id, sync_state)",
    );
    this.db.run("CREATE INDEX IF NOT EXISTS idx_chunks_hash ON chunks(hash)");
  }

  upsertFile(record: Omit<FileRecord, "id">): number {
    this.db.run(
      `INSERT INTO files (root_id, relative_path, file_hash, size, mtime_ms, sync_state, version)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(root_id, relative_path) DO UPDATE SET
         file_hash = excluded.file_hash,
         size = excluded.size,
         mtime_ms = excluded.mtime_ms,
         sync_state = excluded.sync_state,
         version = excluded.version`,
      [
        record.rootId,
        record.relativePath,
        record.fileHash,
        record.size,
        record.mtimeMs,
        record.syncState,
        record.version,
      ],
    );

    const row = this.db
      .query("SELECT id FROM files WHERE root_id = ? AND relative_path = ?")
      .get(record.rootId, record.relativePath) as { id: number };
    return row.id;
  }

  getFile(rootId: string, relativePath: string): FileRecord | null {
    return this.db
      .query(
        `SELECT id, root_id as rootId, relative_path as relativePath,
                file_hash as fileHash, size, mtime_ms as mtimeMs,
                sync_state as syncState, version
         FROM files WHERE root_id = ? AND relative_path = ?`,
      )
      .get(rootId, relativePath) as FileRecord | null;
  }

  listFiles(rootId: string): FileRecord[] {
    return this.db
      .query(
        `SELECT id, root_id as rootId, relative_path as relativePath,
                file_hash as fileHash, size, mtime_ms as mtimeMs,
                sync_state as syncState, version
         FROM files WHERE root_id = ? ORDER BY relative_path`,
      )
      .all(rootId) as FileRecord[];
  }

  countByState(rootId?: string): Record<string, number> {
    const sql = rootId
      ? "SELECT sync_state, COUNT(*) as count FROM files WHERE root_id = ? GROUP BY sync_state"
      : "SELECT sync_state, COUNT(*) as count FROM files GROUP BY sync_state";
    const rows = (rootId
      ? this.db.query(sql).all(rootId)
      : this.db.query(sql).all()) as { sync_state: string; count: number }[];

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.sync_state] = row.count;
    }
    return result;
  }

  upsertChunk(hash: string, size: number, dataPath: string | null = null): void {
    this.db.run(
      `INSERT INTO chunks (hash, size, data_path) VALUES (?, ?, ?)
       ON CONFLICT(hash) DO UPDATE SET size = excluded.size`,
      [hash, size, dataPath],
    );
  }

  enqueueTransfer(
    rootId: string,
    relativePath: string,
    direction: "push" | "pull",
  ): void {
    this.db.run(
      `INSERT INTO transfer_queue (root_id, relative_path, direction, created_ms)
       VALUES (?, ?, ?, ?)`,
      [rootId, relativePath, direction, Date.now()],
    );
  }

  pendingTransfers(): { rootId: string; relativePath: string; direction: string }[] {
    return this.db
      .query(
        `SELECT root_id as rootId, relative_path as relativePath, direction
         FROM transfer_queue WHERE status = 'pending' ORDER BY created_ms`,
      )
      .all() as { rootId: string; relativePath: string; direction: string }[];
  }

  close(): void {
    this.db.close();
  }
}
