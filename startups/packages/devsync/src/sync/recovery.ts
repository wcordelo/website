import type { SyncState } from "./state.ts";
import type { QuicTransport } from "../transport/quic.ts";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chunkFileContent } from "./chunking.ts";
import type { SyncRoot } from "../config.ts";

export interface PartialTransfer {
  id: number;
  rootId: string;
  relativePath: string;
  direction: string;
  completedChunks: number[];
  totalChunks: number;
  status: "in_progress" | "pending" | "completed" | "failed";
}

export interface RecoveryResult {
  resumed: number;
  completed: number;
  failed: number;
  skipped: number;
}

/**
 * SYNC-017: Crash recovery — resume partial transfers after restart.
 */
export class TransferRecovery {
  constructor(
    private state: SyncState,
    private transport: QuicTransport,
  ) {}

  /** Mark transfer as in-progress and record chunk progress. */
  beginTransfer(
    rootId: string,
    relativePath: string,
    direction: "push" | "pull",
    totalChunks: number,
  ): number {
    return this.state.beginPartialTransfer(rootId, relativePath, direction, totalChunks);
  }

  recordChunk(transferId: number, chunkIndex: number): void {
    this.state.recordChunkProgress(transferId, chunkIndex);
  }

  completeTransfer(transferId: number): void {
    this.state.completePartialTransfer(transferId);
  }

  /** Resume all in-progress or interrupted transfers for a root. */
  recoverRoot(root: SyncRoot): RecoveryResult {
    const result: RecoveryResult = { resumed: 0, completed: 0, failed: 0, skipped: 0 };
    const partials = this.state.listPartialTransfers(root.id);

    for (const partial of partials) {
      if (partial.status === "completed") {
        result.skipped++;
        continue;
      }

      const fullPath = join(root.path, partial.relativePath);
      if (!existsSync(fullPath)) {
        this.state.failPartialTransfer(partial.id);
        result.failed++;
        continue;
      }

      result.resumed++;
      const content = readFileSync(fullPath);
      const chunked = chunkFileContent(content);
      const completed = new Set(partial.completedChunks);

      for (const chunk of chunked.chunks) {
        if (completed.has(chunk.index)) continue;
        const slice = content.subarray(chunk.offset, chunk.offset + chunk.length);
        if ("pushChunk" in this.transport && typeof this.transport.pushChunk === "function") {
          (this.transport as { pushChunk: Function }).pushChunk(
            root.id,
            partial.relativePath,
            chunk,
            slice,
          );
        }
        this.recordChunk(partial.id, chunk.index);
        completed.add(chunk.index);
      }

      if (completed.size >= chunked.chunks.length) {
        this.transport.pushFile(root.id, partial.relativePath, content, chunked);
        this.completeTransfer(partial.id);
        this.state.markTransferComplete(root.id, partial.relativePath);
        result.completed++;
      }
    }

    return result;
  }

  listInterrupted(rootId?: string): PartialTransfer[] {
    return this.state.listPartialTransfers(rootId) as PartialTransfer[];
  }
}
