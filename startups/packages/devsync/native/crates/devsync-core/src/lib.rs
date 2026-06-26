//! DevSync core: chunking, state, sync protocol.
//! Port from `src/sync/` when production Rust path begins.

pub const TARGET_CHUNK_SIZE: usize = 64 * 1024;
