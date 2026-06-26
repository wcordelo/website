import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { DevSyncConfig, SyncRoot } from "../config.ts";
import { shouldIgnore, gitLockPath } from "../ignore/index.ts";
import { chunkFileContent } from "./chunking.ts";
import { SyncState } from "./state.ts";
import { LocalTransport } from "../transport/local.ts";
import { createConflictFile } from "../conflict/index.ts";

export interface ScanResult {
  scanned: number;
  ignored: number;
  queued: number;
  conflicts: number;
}

export class SyncEngine {
  private state: SyncState;
  private transport: LocalTransport;

  constructor(private config: DevSyncConfig) {
    this.state = new SyncState();
    this.transport = new LocalTransport(config.transportDir, config.deviceId);
  }

  scanRoot(root: SyncRoot): ScanResult {
    const result: ScanResult = { scanned: 0, ignored: 0, queued: 0, conflicts: 0 };

    if (root.paused) return result;

    const ctx = {
      rootDir: root.path,
      profile: root.profile,
      dangerouslySyncGit: this.config.dangerouslySyncGit,
    };

    const walk = (dir: string): void => {
      if (!existsSync(dir)) return;

      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        const rel = relative(root.path, fullPath);
        const isDir = entry.isDirectory();

        if (shouldIgnore(ctx, fullPath, isDir)) {
          result.ignored++;
          continue;
        }

        if (gitLockPath(rel)) {
          result.ignored++;
          continue;
        }

        if (isDir) {
          walk(fullPath);
          continue;
        }

        result.scanned++;
        this.indexFile(root, fullPath, rel, result);
      }
    };

    walk(root.path);
    return result;
  }

  private indexFile(
    root: SyncRoot,
    fullPath: string,
    rel: string,
    result: ScanResult,
  ): void {
    const stat = statSync(fullPath);
    const content = readFileSync(fullPath);
    const chunked = chunkFileContent(content);

    const existing = this.state.getFile(root.id, rel);
    const remote = this.transport.getRemoteManifest(root.id, rel);

    if (remote && remote.fileHash !== chunked.fileHash) {
      if (existing && existing.fileHash !== chunked.fileHash) {
        createConflictFile(fullPath, content, "remote-peer", remote.fileHash);
        this.state.upsertFile({
          rootId: root.id,
          relativePath: rel,
          fileHash: chunked.fileHash,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          syncState: "conflict",
          version: (existing.version ?? 1) + 1,
        });
        result.conflicts++;
        return;
      }
    }

    this.state.upsertFile({
      rootId: root.id,
      relativePath: rel,
      fileHash: chunked.fileHash,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      syncState: "pending",
      version: (existing?.version ?? 0) + 1,
    });

    for (const chunk of chunked.chunks) {
      this.state.upsertChunk(chunk.hash, chunk.length);
    }

    this.transport.pushManifest(root.id, rel, {
      fileHash: chunked.fileHash,
      totalSize: chunked.totalSize,
      chunks: chunked.chunks,
      mtimeMs: stat.mtimeMs,
      deviceId: this.config.deviceId,
    });

    this.state.enqueueTransfer(root.id, rel, "push");
    result.queued++;
  }

  pushPending(root: SyncRoot): number {
    if (root.paused) return 0;
    let pushed = 0;
    const pending = this.state.pendingTransfers().filter((t) => t.rootId === root.id);

    for (const item of pending) {
      const fullPath = join(root.path, item.relativePath);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath);
      const chunked = chunkFileContent(content);
      this.transport.pushFile(root.id, item.relativePath, content, chunked);
      pushed++;
    }

    return pushed;
  }

  getState(): SyncState {
    return this.state;
  }

  getTransport(): LocalTransport {
    return this.transport;
  }

  close(): void {
    this.state.close();
  }
}

export function ensureTransportDir(config: DevSyncConfig): void {
  if (!existsSync(config.transportDir)) {
    mkdirSync(config.transportDir, { recursive: true });
  }
}
