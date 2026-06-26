# DevSync Native (Rust) — Production Path

**SYNC-002** — Rust workspace scaffold for the production sync engine.

## TypeScript MVP vs Rust Production

| Layer | TypeScript/Bun MVP (`../src/`) | Rust production (`native/`) |
|-------|-------------------------------|----------------------------|
| **Purpose** | Prove sync semantics, safety, and protocol | Single-binary, high-performance daemon |
| **Distribution** | `bun` + Node runtime | Static binary + optional FUSE mount |
| **Transport** | File-based stub (`transport/local.ts`, `quic.ts`) | QUIC via `quinn` + mDNS via `mdns-sd` |
| **State** | Bun SQLite (`sync/state.ts`) | `rusqlite` in `devsync-core` |
| **Chunking** | `@noble/hashes` Blake3 | Native `blake3` crate |
| **Watcher** | `fs.watch` debounce | `notify` + inotify/FSEvents |
| **Daemon IPC** | Unix socket stub | `tokio` + Unix/named pipes |

The TypeScript MVP validates **what** to sync (git safety, ignore profiles, conflict naming, pairing flow). The Rust workspace implements **how** at scale: 10k+ files, sub-second LAN discovery, encrypted relay fallback.

## Workspace Layout

```
native/
├── Cargo.toml              # Workspace root (this file)
└── crates/
    ├── devsync-core/       # Chunking, state DB, sync protocol, pairing
    ├── devsync-ignore/     # .gitignore parser, profiles, git hard-exclude
    ├── devsync-transport/  # QUIC, mDNS, relay client
    └── devsync-daemon/     # Long-running agent, watcher, CLI entrypoint
```

Each crate is a stub `lib.rs` until the corresponding SYNC tasks are ported from TypeScript.

## Build (when crates are implemented)

```bash
cd native
cargo build --release
cargo test
```

## Migration Strategy

1. **Protocol parity** — Rust manifests match `spec/architecture-rfc.md` JSON schema.
2. **Config compatibility** — Read `~/.devsync/sync.yaml` unchanged.
3. **State migration** — One-time import from MVP SQLite schema v1.
4. **Gradual rollout** — `devsync` CLI binary replaces `bun src/cli.ts`; TS MVP kept for CI regression tests.

## Status

Scaffold only. Crate sources are placeholders; implementation tracks TypeScript MVP feature completion (SYNC-003 through SYNC-032).
