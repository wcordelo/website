import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import type { Chunk, ChunkedFile } from "../sync/chunking.ts";
import type { RemoteManifest } from "./local.ts";

export type TransferDirection = "push" | "pull";

export interface TransportManifest extends RemoteManifest {
  relativePath: string;
  rootId: string;
}

export interface QuicTransport {
  readonly deviceId: string;
  pushManifest(rootId: string, relativePath: string, manifest: RemoteManifest): void;
  getRemoteManifest(rootId: string, relativePath: string): RemoteManifest | null;
  pushFile(
    rootId: string,
    relativePath: string,
    content: Buffer,
    chunked: ChunkedFile,
  ): void;
  pullFile(rootId: string, relativePath: string): Buffer | null;
  listRemoteFiles(rootId: string): string[];
}

/**
 * SYNC-010: QUIC transport interface + file-based implementation.
 * Production uses quinn over UDP; MVP mirrors LocalTransport layout
 * under `quic/` for protocol testing without network deps.
 */
export class FileBasedQuicTransport implements QuicTransport {
  constructor(
    readonly deviceId: string,
    private baseDir: string,
  ) {
    if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
  }

  private rootDir(rootId: string): string {
    const dir = join(this.baseDir, "quic", rootId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  private manifestPath(rootId: string, relativePath: string): string {
    const safe = relativePath.replace(/\//g, "__");
    return join(this.rootDir(rootId), "manifests", `${safe}.json`);
  }

  private dataPath(rootId: string, relativePath: string): string {
    const safe = relativePath.replace(/\//g, "__");
    const dir = join(this.rootDir(rootId), "data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return join(dir, safe);
  }

  pushManifest(rootId: string, relativePath: string, manifest: RemoteManifest): void {
    const dir = join(this.rootDir(rootId), "manifests");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const envelope: TransportManifest = { ...manifest, rootId, relativePath };
    writeFileSync(this.manifestPath(rootId, relativePath), JSON.stringify(envelope), "utf8");
  }

  getRemoteManifest(rootId: string, relativePath: string): RemoteManifest | null {
    const path = this.manifestPath(rootId, relativePath);
    if (!existsSync(path)) return null;
    const raw = JSON.parse(readFileSync(path, "utf8")) as TransportManifest;
    if (raw.deviceId === this.deviceId) return null;
    return {
      fileHash: raw.fileHash,
      totalSize: raw.totalSize,
      chunks: raw.chunks,
      mtimeMs: raw.mtimeMs,
      deviceId: raw.deviceId,
    };
  }

  pushFile(
    rootId: string,
    relativePath: string,
    content: Buffer,
    chunked: ChunkedFile,
  ): void {
    writeFileSync(this.dataPath(rootId, relativePath), content);
    this.pushManifest(rootId, relativePath, {
      fileHash: chunked.fileHash,
      totalSize: chunked.totalSize,
      chunks: chunked.chunks,
      mtimeMs: Date.now(),
      deviceId: this.deviceId,
    });
  }

  pullFile(rootId: string, relativePath: string): Buffer | null {
    const path = this.dataPath(rootId, relativePath);
    if (!existsSync(path)) return null;
    return readFileSync(path);
  }

  listRemoteFiles(rootId: string): string[] {
    const manifestDir = join(this.rootDir(rootId), "manifests");
    if (!existsSync(manifestDir)) return [];
    return readdirSync(manifestDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/__/g, "/").replace(/\.json$/, ""));
  }

  /** Simulate QUIC stream chunk transfer for partial resume testing. */
  pushChunk(
    rootId: string,
    relativePath: string,
    chunk: Chunk,
    data: Uint8Array,
  ): void {
    const dir = join(this.rootDir(rootId), "chunks", relativePath.replace(/\//g, "__"));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${chunk.index}.bin`), data);
    writeFileSync(join(dir, `${chunk.index}.meta.json`), JSON.stringify(chunk), "utf8");
  }

  hasChunk(rootId: string, relativePath: string, index: number): boolean {
    const dir = join(this.rootDir(rootId), "chunks", relativePath.replace(/\//g, "__"));
    return existsSync(join(dir, `${index}.bin`));
  }
}
