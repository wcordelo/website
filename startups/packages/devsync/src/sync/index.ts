export { blake3Hash, chunkBuffer, chunkFileContent, TARGET_CHUNK_SIZE } from "./chunking.ts";
export type { Chunk, ChunkedFile } from "./chunking.ts";
export { SyncState } from "./state.ts";
export type { FileRecord, ChunkRecord } from "./state.ts";
export { SyncEngine, ensureTransportDir } from "./engine.ts";
export type { ScanResult } from "./engine.ts";
export {
  isGitIndexLocked,
  checkGitLock,
  shouldPauseForGitLock,
  gitIndexLockPath,
} from "./git-lock.ts";
export type { GitLockStatus } from "./git-lock.ts";
export { TransferRecovery } from "./recovery.ts";
export type { PartialTransfer, RecoveryResult } from "./recovery.ts";
