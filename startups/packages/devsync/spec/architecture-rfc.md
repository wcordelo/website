# SYNC-001: DevSync Architecture RFC

**Status:** Accepted (v0.1 MVP — TypeScript/Bun)  
**Production target:** Rust workspace (SYNC-002)  
**Authors:** DevSync Engineering  
**Date:** 2026-06-26

## 1. Summary

DevSync is a developer-native sync engine for working directories across machines. v0.1 delivers a TypeScript/Bun MVP proving core safety and sync semantics; production moves to Rust for performance and single-binary distribution.

## 2. Goals

1. **Git safety** — `.git/` never synced by default (SYNC-007).
2. **Ignore awareness** — Respect `.gitignore` and built-in profiles (SYNC-006, SYNC-008).
3. **Safe conflicts** — Two-way-safe: never auto-merge code (SYNC-013).
4. **Efficient transfer** — Content-defined chunking with Blake3 hashes (SYNC-005).
5. **Local-first P2P** — LAN peers via mDNS/QUIC (production); file-based stub in MVP.

## 3. Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      devsync CLI                         │
│  init | add | status | pair | pause | resume | watch    │
└────────────────────────┬────────────────────────────────┘
                         │ IPC (Unix socket)
┌────────────────────────▼────────────────────────────────┐
│                     devsyncd daemon                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ watcher  │ │  engine  │ │ pairing  │ │  transport │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │  ignore  │   │  sqlite  │   │ local P2P    │
   │  engine  │   │  state   │   │ (QUIC prod)  │
   └──────────┘   └──────────┘   └──────────────┘
```

### 3.1 Module Map (v0.1 TypeScript)

| Module | Responsibility | Production crate |
|--------|----------------|------------------|
| `ignore/` | `.gitignore` parser, profiles, git hard-exclude | `devsync-ignore` |
| `sync/` | Chunking, state DB, sync engine | `devsync-core` |
| `watcher/` | FS events with debounce | `devsync-daemon` |
| `pairing/` | 6-word code key exchange | `devsync-core` |
| `conflict/` | Two-way-safe conflict naming | `devsync-core` |
| `transport/` | P2P data plane | `devsync-transport` |
| `daemon/` | Long-running agent + IPC | `devsync-daemon` |

## 4. Sync Protocol v0

### 4.1 Manifest Exchange

Each file is represented by:

```json
{
  "fileHash": "<blake3-hex>",
  "totalSize": 12345,
  "chunks": [
    { "index": 0, "offset": 0, "length": 65536, "hash": "<blake3-hex>" }
  ],
  "mtimeMs": 1719400000000,
  "deviceId": "<uuid>"
}
```

### 4.2 Content-Defined Chunking

- Algorithm: FastCDC-inspired (MVP uses rolling-hash boundaries).
- Target average chunk size: **64 KB** (configurable).
- Hash: **Blake3** per chunk and whole file.

### 4.3 Delta Transfer

1. Compare manifest `fileHash` — skip if identical.
2. Compare per-chunk hashes — request missing chunks only.
3. Reassemble file from chunks on receiver.

### 4.4 Version Vectors

Per-file logical clock (`version` column in SQLite). Increment on local edit. Conflict when both peers increment between sync rounds.

## 5. Conflict Policy: Two-Way-Safe

**Never auto-merge source files.**

On conflict:
1. Keep local version at original path.
2. Write remote version as `<name>.devsync-conflict-<peer>-<timestamp>`.
3. Mark file `sync_state = conflict` in SQLite.
4. User resolves via TUI (SYNC-023, future).

## 6. Git Safety Model

| Rule | Implementation |
|------|----------------|
| Hard exclude `.git/**` | `ignore/git-exclude.ts` — always checked first |
| Opt-in override | `dangerously_sync_git: true` in `sync.yaml` |
| Lock awareness | Pause when `.git/index.lock` present (SYNC-016, future) |

See [git-safety.md](../docs/git-safety.md) (SYNC-026).

## 7. Ignore Engine

Evaluation order:
1. Git hard-exclude (unless danger flag)
2. Built-in profile patterns (`default`, `minimal`, `node_regen`)
3. `.gitignore` chain (root → ancestors → last match wins)

## 8. Pairing Flow

1. Machine A: `devsync pair --show-code` → 6-word code (15 min TTL).
2. Machine B: `devsync pair alpha-bravo-charlie-delta-echo-foxtrot`
3. Public keys exchanged; peer stored in config + transport dir.

Production: QR code + X25519 via QUIC handshake (SYNC-011).

## 9. State Storage

SQLite (`~/.devsync/state.db`):

| Table | Purpose |
|-------|---------|
| `files` | Per-root file metadata and sync state |
| `chunks` | Content-addressed chunk store refs |
| `file_chunks` | File → chunk mapping |
| `peers` | Known peers |
| `transfer_queue` | Pending push/pull operations |

## 10. Transport

| Layer | MVP (v0.1) | Production |
|-------|------------|------------|
| Discovery | File-based pairing dir | mDNS `_devsync._udp` (SYNC-009) |
| Transport | Local filesystem mirror | QUIC via quinn (SYNC-010) |
| Relay | N/A | Encrypted relay (SYNC-019) |

## 11. Config Format (`sync.yaml`)

```yaml
version: 1
device_id: <uuid>
device_name: macbook-pro
dangerously_sync_git: false
transport_dir: ~/.devsync/transport
daemon_socket: ~/.devsync/devsyncd.sock

roots:
  - id: <uuid>
    path: /home/dev/myproject
    profile: default
    paused: false
    added_at: 2026-06-26T00:00:00.000Z

peers:
  - id: <uuid>
    name: desktop
    paired_at: 2026-06-26T00:00:00.000Z
    public_key: pk_...
```

## 12. MVP Scope vs Production

| Feature | v0.1 MVP (TS/Bun) | Production (Rust) |
|---------|-------------------|-------------------|
| Chunking | Simplified CDC + Blake3 | Full FastCDC |
| Transport | File-based stub | QUIC + mDNS |
| Daemon | Unix socket stub | Full background sync |
| Pairing | 6-word code | QR + X25519 |
| Crash recovery | Basic queue | Full resume (SYNC-017) |

## 13. Security Considerations

- All P2P traffic encrypted (QUIC TLS 1.3 in production).
- Relay is zero-knowledge (encrypted blobs only).
- Pairing codes are short-lived (15 min).
- No `dangerously_sync_git` in UI — config file only.

## 14. Open Decisions

| # | Decision | Status |
|---|----------|--------|
| 1 | Conflict naming `.devsync-conflict-*` | **Accepted** |
| 2 | 64 KB default chunk size | **Accepted** |
| 3 | TypeScript MVP before Rust | **Accepted** |
| 4 | AGPL vs BSL license | Open |

---

*RFC version 1.0 — DevSync v0.1*
