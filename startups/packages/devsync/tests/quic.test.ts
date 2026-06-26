import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileBasedQuicTransport } from "../src/transport/quic.ts";
import { chunkFileContent } from "../src/sync/chunking.ts";

describe("QUIC transport stub (SYNC-010)", () => {
  let transportDir: string;
  let transportA: FileBasedQuicTransport;
  let transportB: FileBasedQuicTransport;

  beforeEach(() => {
    transportDir = join(tmpdir(), `devsync-quic-${Date.now()}`);
    transportA = new FileBasedQuicTransport("device-a", transportDir);
    transportB = new FileBasedQuicTransport("device-b", transportDir);
  });

  afterEach(() => {
    rmSync(transportDir, { recursive: true, force: true });
  });

  test("push and pull file between devices", () => {
    const content = Buffer.from("hello quic stub\n");
    const chunked = chunkFileContent(content);
    transportA.pushFile("root-1", "hello.txt", content, chunked);

    const manifest = transportB.getRemoteManifest("root-1", "hello.txt");
    expect(manifest).not.toBeNull();
    expect(manifest!.fileHash).toBe(chunked.fileHash);

    const pulled = transportB.pullFile("root-1", "hello.txt");
    expect(pulled?.toString()).toBe("hello quic stub\n");
  });

  test("ignores own device manifests", () => {
    const content = Buffer.from("self\n");
    const chunked = chunkFileContent(content);
    transportA.pushFile("root-1", "self.txt", content, chunked);
    const own = transportA.getRemoteManifest("root-1", "self.txt");
    expect(own).toBeNull();
  });

  test("pushChunk stores partial data", () => {
    const content = Buffer.from("abcdefghij");
    const chunked = chunkFileContent(content);
    const chunk = chunked.chunks[0]!;
    const slice = content.subarray(chunk.offset, chunk.offset + chunk.length);

    transportA.pushChunk("root-1", "partial.bin", chunk, slice);
    expect(transportA.hasChunk("root-1", "partial.bin", chunk.index)).toBe(true);
  });

  test("lists remote files", () => {
    const content = Buffer.from("a");
    const chunked = chunkFileContent(content);
    transportA.pushFile("root-1", "a/b.txt", content, chunked);
    transportA.pushFile("root-1", "c.txt", content, chunked);

    const files = transportB.listRemoteFiles("root-1");
    expect(files.sort()).toEqual(["a/b.txt", "c.txt"]);
  });
});
