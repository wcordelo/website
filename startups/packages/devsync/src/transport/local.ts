import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import type { Chunk, ChunkedFile } from "../sync/chunking.ts";

export interface RemoteManifest {
  fileHash: string;
  totalSize: number;
  chunks: Chunk[];
  mtimeMs: number;
  deviceId: string;
}

/**
 * SYNC-010 MVP stub: file-based transport for local P2P simulation.
 * Production uses QUIC (SYNC-010).
 */
export class LocalTransport {
  constructor(
    private baseDir: string,
    private deviceId: string,
  ) {
    if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
  }

  private rootDir(rootId: string): string {
    const dir = join(this.baseDir, rootId);
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
    writeFileSync(this.manifestPath(rootId, relativePath), JSON.stringify(manifest), "utf8");
  }

  getRemoteManifest(rootId: string, relativePath: string): RemoteManifest | null {
    const path = this.manifestPath(rootId, relativePath);
    if (!existsSync(path)) return null;
    const raw = JSON.parse(readFileSync(path, "utf8")) as RemoteManifest;
    if (raw.deviceId === this.deviceId) return null;
    return raw;
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

  listRemoteFiles(rootId: string): string[] {
    const manifestDir = join(this.rootDir(rootId), "manifests");
    if (!existsSync(manifestDir)) return [];
    return readdirSync(manifestDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/__/g, "/").replace(/\.json$/, ""));
  }

  deviceDir(): string {
    return join(this.baseDir, "devices", this.deviceId);
  }
}
