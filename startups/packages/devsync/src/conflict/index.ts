/**
 * SYNC-013: Two-way-safe conflict file naming.
 * Format: <original>.devsync-conflict-<peer>-<timestamp>
 */

const CONFLICT_MARKER = ".devsync-conflict-";

export interface ConflictPath {
  originalPath: string;
  conflictPath: string;
  peer: string;
  timestamp: number;
}

export function conflictFileName(
  originalBasename: string,
  peer: string,
  timestamp: number = Date.now(),
): string {
  const safePeer = peer.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `${originalBasename}${CONFLICT_MARKER}${safePeer}-${timestamp}`;
}

export function buildConflictPath(
  originalPath: string,
  peer: string,
  timestamp?: number,
): ConflictPath {
  const ts = timestamp ?? Date.now();
  const parts = originalPath.split("/");
  const basename = parts.pop() ?? originalPath;
  const conflictBasename = conflictFileName(basename, peer, ts);
  const conflictPath = [...parts, conflictBasename].join("/");

  return {
    originalPath,
    conflictPath,
    peer,
    timestamp: ts,
  };
}

export function isConflictFile(path: string): boolean {
  const basename = path.split("/").pop() ?? path;
  return basename.includes(CONFLICT_MARKER);
}

export function parseConflictPath(path: string): {
  originalPath: string;
  peer: string;
  timestamp: number;
} | null {
  const marker = ".devsync-conflict-";
  const idx = path.indexOf(marker);
  if (idx === -1) return null;

  const originalPath = path.slice(0, idx);
  const suffix = path.slice(idx + marker.length);
  const lastDash = suffix.lastIndexOf("-");
  if (lastDash === -1) return null;

  const peer = suffix.slice(0, lastDash);
  const timestamp = Number(suffix.slice(lastDash + 1));
  if (!Number.isFinite(timestamp)) return null;

  return { originalPath, peer, timestamp };
}

export function createConflictFile(
  originalPath: string,
  localContent: Uint8Array | Buffer | string,
  peer: string,
  _remoteHash?: string,
): ConflictPath {
  const { conflictPath } = buildConflictPath(originalPath, peer);
  const bytes =
    typeof localContent === "string"
      ? new TextEncoder().encode(localContent)
      : new Uint8Array(localContent);

  Bun.write(conflictPath, bytes);
  return buildConflictPath(originalPath, peer);
}
