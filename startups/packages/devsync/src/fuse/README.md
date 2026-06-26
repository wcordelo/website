# Linux FUSE Read-Only Mount

**SYNC-030** — Specification for read-only FUSE mount of synced content.

## Purpose

Expose a remote or cached sync root as a POSIX filesystem for tools that expect file paths (compilers, LSPs) without writing back through the mount — writes go through the normal sync engine.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  FUSE client    │────►│  devsyncd cache  │────►│  SQLite +   │
│  (read-only)    │     │  (chunk store)   │     │  transport  │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

## Mount Point

```bash
devsync mount <root-id> /mnt/devsync/<root-id> --read-only
```

## FUSE Operations (read-only subset)

| Op | Behavior |
|----|----------|
| `lookup` | Resolve path via sync state index |
| `getattr` | Size/mtime from manifest |
| `readdir` | List children from indexed tree |
| `read` | Serve from local chunk cache; fetch missing chunks via QUIC |
| `open` / `release` | Track FD refs for prefetch |
| **write/create/unlink** | `EROFS` (read-only) |

## Cache Layout

```
~/.devsync/cache/<root-id>/
  chunks/<blake3-hex>     # Deduplicated chunk blobs
  manifests/<path-hash>   # Per-file chunk lists
```

## Implementation Plan (Rust)

1. Crate: `devsync-fuse` in `native/crates/`
2. Library: `fuser` crate on Linux
3. IPC: Query `devsyncd` for manifest + chunk fetch
4. MVP: Mount stale snapshot; background refresh via watcher events

## Safety

- Mount is **read-only** — no conflict generation from FUSE writes
- `.git/` never appears in mount namespace (same hard-exclude as sync)
- Unmount before `devsync pause` to avoid stale FD handles

## Platform Notes

- **Linux:** `libfuse3` + `fuser`
- **macOS:** macFUSE (future, lower priority than menubar SYNC-022)
- **Windows:** Not applicable — see [windows.md](../../docs/windows.md)

## Status

Specification only. Requires Rust transport (SYNC-010 production) and daemon IPC (SYNC-014).
