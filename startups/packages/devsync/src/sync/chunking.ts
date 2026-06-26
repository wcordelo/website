import { blake3 } from "@noble/hashes/blake3";
import { bytesToHex } from "@noble/hashes/utils";

/** Average target chunk size (64KB per SYNC-001). */
export const TARGET_CHUNK_SIZE = 64 * 1024;
export const MIN_CHUNK_SIZE = 16 * 1024;
export const MAX_CHUNK_SIZE = 128 * 1024;

export interface Chunk {
  index: number;
  offset: number;
  length: number;
  hash: string;
}

export interface ChunkedFile {
  fileHash: string;
  totalSize: number;
  chunks: Chunk[];
}

/**
 * Blake3 hash via crypto-compatible API (SYNC-005).
 * Uses @noble/hashes; production Rust impl uses native blake3.
 */
export function blake3Hash(data: Uint8Array | Buffer | string): string {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  return bytesToHex(blake3(bytes));
}

/**
 * Content-defined chunking (FastCDC-inspired, MVP simplification).
 * Boundaries chosen by rolling hash modulo average size.
 */
export function chunkBuffer(data: Uint8Array): ChunkedFile {
  const chunks: Chunk[] = [];
  let offset = 0;
  let index = 0;

  while (offset < data.length) {
    const boundary = findChunkBoundary(data, offset);
    const length = Math.min(boundary - offset, data.length - offset);
    const slice = data.subarray(offset, offset + length);
    chunks.push({
      index,
      offset,
      length,
      hash: blake3Hash(slice),
    });
    offset += length;
    index++;
  }

  return {
    fileHash: blake3Hash(data),
    totalSize: data.length,
    chunks,
  };
}

function findChunkBoundary(data: Uint8Array, start: number): number {
  const remaining = data.length - start;
  if (remaining <= MIN_CHUNK_SIZE) return data.length;

  const maxEnd = Math.min(start + MAX_CHUNK_SIZE, data.length);
  const minEnd = Math.min(start + MIN_CHUNK_SIZE, data.length);

  let hash = 0;
  for (let i = start + MIN_CHUNK_SIZE; i < maxEnd; i++) {
    hash = ((hash << 1) + data[i]!) & 0xffffffff;
    if (i >= minEnd && (hash % TARGET_CHUNK_SIZE) < 256) {
      return i + 1;
    }
  }

  return maxEnd;
}

export function chunkFileContent(content: string | Uint8Array): ChunkedFile {
  const bytes =
    typeof content === "string" ? new TextEncoder().encode(content) : content;
  return chunkBuffer(bytes);
}
