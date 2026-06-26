# Dropbox for Developers (`DevSync`) — Execution Plan

**Working name:** DevSync  
**Priority signal:** Solid niche product  
**Task prefix:** `SYNC-001` through `SYNC-032`

---

## 1. Executive Summary

Developers work across multiple machines—laptop, desktop, CI runner, cloud VM—but cloud sync tools weren't built for code. Dropbox and Google Drive corrupt git repos, sync `node_modules` wastefully, and create conflict nightmares. Syncthing is powerful but requires network expertise. Git only syncs committed history, not WIP branches, local configs, or uncommitted agent session state. The gap is **fast, safe, multi-machine sync for developer working directories**.

**DevSync** is a developer-native sync engine that treats git repos as first-class citizens: hard-excludes `.git/` by default (with explicit opt-in), understands `.gitignore`, uses content-defined chunking for efficient binary and `node_modules` handling, and offers `two-way-safe` conflict resolution that never silently merges code. Local peers sync over QUIC via mDNS discovery; optional encrypted relay for NAT traversal.

The product wedge is **indie developers and small teams** who want "it just works" sync without managing Syncthing or paying for GitHub Codespaces. A menubar app shows sync status; a TUI handles conflicts. Revenue comes from encrypted relay hosting, team features, and multi-root workspaces.

**Why now:** Remote/hybrid work is permanent; AI agents increase local WIP value; Rust ecosystem has mature QUIC (quinn) and FS watch (notify) crates; developers already pay for 1Password, GitHub, and Raycast—sync is an unsolved daily pain.

**90-day goal:** v0.1 CLI syncing two Macs on LAN; v0.5 menubar app + relay; 50 beta users; <1% data loss in stress tests.

---

## 2. Problem Statement & Evidence

### The core problem

Developers need their project files on every machine they use, but existing sync tools either break git or require expert configuration.

### Evidence

| Signal | Data point |
|--------|------------|
| Multi-machine norm | **70%+** of developers use 2+ machines daily |
| Dropbox + git warnings | Dropbox officially discourages syncing git repos |
| Syncthing complexity | **#1 complaint** in r/syncthing: setup and conflicts |
| Codespaces cost | $0.18/hr+; overkill for "continue on desktop" |
| node_modules pain | **500MB–2GB** per project; blind sync wastes hours |
| Agent WIP | Uncommitted agent changes lost when switching machines |

### Failure modes of incumbents

| Tool | Failure |
|------|---------|
| Dropbox/Drive | Corrupts `.git/index.lock`; syncs everything |
| iCloud | Slow, unreliable for large trees |
| Syncthing | No git awareness; conflict UI is cryptic |
| Git alone | No WIP sync; push/pull friction for quick switches |
| GitHub Codespaces | Cloud-only; latency; cost |

### Jobs to be done

1. **Pick up where I left off** on another machine in <60 seconds.
2. **Never corrupt my git repo** — hard guarantee.
3. **Don't sync garbage** — respect `.gitignore`, skip `node_modules` or use regen profile.
4. **Resolve conflicts safely** — never auto-merge source code.
5. **Work offline** — sync when peers reconnect.

---

## 3. Target Customer Profiles (ICP)

### Primary ICP: Indie / solo developers

| Attribute | Detail |
|-----------|--------|
| Machines | MacBook + Mac Studio, or Mac + Linux desktop |
| Projects | 3–10 active repos, mixed stack |
| Trigger | Lost WIP switching machines; Dropbox corrupted `.git` |
| Willingness to pay | $8–$15/month for relay + peace of mind |

### Secondary ICP: Small remote teams (2–8 devs)

| Attribute | Detail |
|-----------|--------|
| Pain | Shared config repos, dotfiles, monorepo WIP sharing (pairing) |
| Offer | Team relay, shared sync profiles |
| Buyer | Tech lead or eng manager |

### Tertiary ICP: Agency developers

| Attribute | Detail |
|-----------|--------|
| Pain | Client repos on multiple machines; air-gapped sometimes |
| Offer | Multi-root, selective sync profiles |

### Anti-ICP

- Large enterprises needing SSO/audit (defer to v1+).
- Teams satisfied with GitHub Codespaces.
- Developers with one machine only.

---

## 4. Competitive Landscape & Differentiation Matrix

| Capability | Dropbox | Syncthing | Git | Codespaces | **DevSync** |
|------------|---------|-----------|-----|------------|-------------|
| Git-safe | ✗ | manual | n/a | ✓ | **✓ (hard exclude)** |
| `.gitignore` aware | ✗ | ✗ | ✓ | ✓ | **✓** |
| Content-defined chunking | ✗ | ✗ | ✗ | n/a | **✓** |
| `node_modules` regen profile | ✗ | ✗ | ✗ | n/a | **✓** |
| Two-way-safe conflicts | ✗ | partial | n/a | n/a | **✓** |
| Zero-config LAN | ✗ | partial | n/a | n/a | **✓ (mDNS)** |
| Developer UX (menubar/TUI) | generic | poor | n/a | web | **✓** |
| Offline-first | partial | ✓ | partial | ✗ | **✓** |

### Differentiation thesis

1. **Git safety is non-negotiable** — marketing lead, engineering guarantee.
2. **Developer semantics** — ignore profiles, lock awareness, regen not sync.
3. **Safe conflicts** — TUI review, never silent merge on code files.
4. **Rust performance** — single binary, low CPU, fast chunking.

---

## 5. Product Vision & MVP Scope

### Vision (3-year)

DevSync is the default way developers keep working directories consistent across machines—like Dropbox, but you trust it with your repos.

### v0.1 — "LAN sync works" (Weeks 1–8)

| Feature | Description |
|---------|-------------|
| Rust daemon + CLI | `devsync watch`, `devsync status` |
| mDNS peer discovery | Find peers on LAN |
| QUIC transport | Fast, encrypted P2P |
| Content-defined chunking | Efficient updates |
| `.gitignore` + hard git exclude | Safety foundation |
| `two-way-safe` conflicts | Flag, don't merge |
| Pairing flow | QR code or short code |
| Crash recovery | Resume partial transfers |

### v0.5 — "Daily driver" (Weeks 9–12)

| Feature | Description |
|---------|-------------|
| Encrypted relay server | NAT traversal |
| macOS menubar app | Status, pause, conflict badge |
| Conflict review TUI | Side-by-side resolution |
| `sync.yaml` config | Multi-root, profiles |
| `node_modules` regen profile | Sync package-lock, run install on peer |
| Private beta onboarding | 50 users |

### v1.0 — "Team ready" (Months 4–6)

| Feature | Description |
|---------|-------------|
| Linux FUSE read-only mount | Browse remote without full sync |
| Windows alpha | Broaden TAM |
| VS Code extension stub | Sync status in IDE |
| Team billing | Relay + admin |

---

## 6. Technical Architecture

### Component diagram

```
┌──────────────┐     QUIC/mDNS      ┌──────────────┐
│  Machine A   │◄──────────────────►│  Machine B   │
│  devsyncd    │                    │  devsyncd    │
│  ├─ watcher  │                    │  ├─ watcher  │
│  ├─ chunker  │                    │  ├─ chunker  │
│  └─ sqlite   │                    │  └─ sqlite   │
└──────┬───────┘                    └──────┬───────┘
       │         Encrypted relay          │
       └──────────────┬───────────────────┘
                      ▼
              ┌───────────────┐
              │ Relay (SaaS)  │
              │ E2E encrypted │
              └───────────────┘
```

### Rust workspace crates

- `devsync-core` — chunking, manifest, protocol.
- `devsync-daemon` — FS watcher, peer manager.
- `devsync-cli` — user commands.
- `devsync-relay` — server (optional self-host).

### Sync protocol v0

1. **Manifest exchange** — Blake3 hashes per chunk; CDC splits (avg 64KB chunks).
2. **Delta transfer** — Request missing chunks only.
3. **Version vectors** — Per-file logical clocks for conflict detection.
4. **Conflict policy** — `two-way-safe`: both versions kept as `.devsync-conflict-<peer>-<ts>`; user resolves via TUI.

### Git safety

- **Hard exclude:** `.git/**` never synced unless `sync.yaml` explicit `dangerously_sync_git: true`.
- **Lock awareness:** If `.git/index.lock` exists, pause sync for that repo.
- **Documented guarantee:** Public doc (SYNC-026) with test suite.

### State storage

SQLite per machine: file paths, chunk refs, sync state, peer versions.

### Ignore engine

- Parse `.gitignore`, `.ignore`, `sync.yaml` profiles.
- Built-in profiles: `default`, `node_regen`, `minimal` (source only).

---

## 7. Core Features Deep Dive

### 7.1 Content-defined chunking (CDC)

Uses FastCDC algorithm: content-defined boundaries mean inserted bytes don't reshuffle entire file hash chain. Critical for frequently edited source files and large binaries.

### 7.2 Peer discovery and pairing

mDNS broadcasts `_devsync._udp` on LAN. For remote: relay-assisted hole punching. Pairing via 6-digit code or QR (public key exchange).

### 7.3 `two-way-safe` conflict resolution

Unlike Dropbox (last-write-wins) or Syncthing (optional LWW):

- Code files **never** auto-merged.
- Both versions preserved with clear naming.
- TUI shows diff; user picks A, B, or manual merge.
- Resolution propagates to all peers.

### 7.4 `node_modules` regen profile

Instead of syncing 1GB of deps:

1. Sync `package-lock.json` / `pnpm-lock.yaml`.
2. On peer arrival, run `npm ci` (configurable).
3. Optional: sync npm cache chunks for speed.

### 7.5 Multi-root support

`sync.yaml`:

```yaml
roots:
  - path: ~/code/myapp
    profile: default
  - path: ~/code/dotfiles
    profile: minimal
peers:
  - name: macbook
  - name: desktop
relay: encrypted
```

### 7.6 Menubar app (v0.5)

- Sync status icon (green/yellow/red).
- Pause sync during presentations.
- Conflict count badge → opens TUI.
- Bandwidth throttle.

### 7.7 Encrypted relay

- Server sees only encrypted blobs; zero knowledge.
- Used for NAT traversal, not storage (ephemeral).
- Self-host option for paranoid users.

---

## 8. Go-to-Market Strategy

### Phase 1: Build in public (Months 1–3)

- Rust dev community: "We're building Syncthing that respects git."
- Git safety doc as viral content.
- Beta waitlist (SYNC-024).

### Phase 2: Private beta (Months 2–4)

- 50 design partners; Discord for feedback.
- Focus Mac LAN users first (simplest path).
- Case studies: "Switched laptops mid-feature."

### Phase 3: Paid relay (Months 4+)

- Free LAN sync forever.
- Paid: relay, team admin, priority support.

### Channels

- Hacker News, Rust subreddit, dev Twitter.
- YouTube: "Don't sync git with Dropbox" explainer.
- Integrations: Raycast extension, Alfred workflow.

---

## 9. Business Model & Pricing Tiers

### Free

- Unlimited LAN P2P sync.
- 2 peers, 3 roots.
- Community support.

### Pro — $12/month

- Encrypted relay (unlimited bandwidth fair use).
- 5 peers, unlimited roots.
- `node_modules` regen profiles.
- Email support.

### Team — $10/seat/month (min 3)

- Team peer management.
- Shared sync profiles.
- Admin dashboard.

### Self-hosted relay — $199/year license

- Run your own relay server.
- No per-seat fee.

**Year 1 target:** 500 Pro users → ~$72K ARR + 20 Team → ~$24K = **$96K ARR**.

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Git corruption incident | Low | Existential | Hard exclude + lock awareness + public test suite |
| Syncthing "good enough" | High | Medium | UX moat; git safety brand |
| NAT traversal failures | Medium | High | Relay fallback; clear diagnostics |
| Conflict UX too complex | Medium | Medium | TUI investment; sensible defaults |
| Windows/Linux fragmentation | High | Medium | Mac-first; explicit platform roadmap |
| Data loss on crash | Low | Critical | SYNC-017 crash recovery; stress tests |
| Relay operational cost | Medium | Medium | Fair use limits; efficient protocol |

---

## 11. Success Metrics

### North star

**Successful sync sessions per week** × **retention**.

### 90-day targets

| Metric | Target |
|--------|--------|
| Beta waitlist signups | 500 |
| Active beta users | 50 |
| Daily sync success rate | >99.5% |
| Git safety incidents | 0 |
| NPS (beta) | >40 |
| LAN sync latency (median) | <5s for typical edit |

### 12-month targets

| Metric | Target |
|--------|--------|
| Pro subscribers | 500 |
| ARR | $96K |
| Churn (monthly) | <5% |
| Platforms | macOS + Linux CLI |

---

## 12. Team & Skills Required

| Role | Skills |
|------|--------|
| **Rust systems engineer** | QUIC, async (tokio), FS events |
| **Desktop engineer** | macOS menubar (Swift or Tauri) |
| **DevRel / founder** | Community, support, docs |

Minimum: 2 Rust engineers + 1 product/GTM. macOS menubar can be Tauri wrapping Rust core.

---

## 13. 90-Day Execution Roadmap

### Weeks 1–2: Foundation

- SYNC-001 architecture RFC; SYNC-002 Rust workspace.
- SYNC-003 SQLite schema; SYNC-006 `.gitignore` parser.
- SYNC-007 git hard-exclude; SYNC-008 built-in profiles.
- SYNC-024 landing page + waitlist.
- **Milestone:** Daemon compiles; ignore engine tested.

### Weeks 3–4: Chunking + discovery

- SYNC-004 filesystem watcher; SYNC-005 CDC chunking.
- SYNC-009 mDNS discovery; SYNC-010 QUIC transport.
- SYNC-011 pairing flow.
- **Milestone:** Two peers discover on LAN.

### Weeks 5–6: Protocol v0

- SYNC-012 sync protocol; SYNC-013 two-way-safe conflicts.
- SYNC-016 git lock awareness; SYNC-017 crash recovery.
- **Milestone:** First file synced LAN E2E.

### Weeks 7–8: CLI v0 + stress

- SYNC-014 agent daemon; SYNC-015 CLI v0.
- SYNC-018 10k-file stress test.
- SYNC-026 git safety public doc.
- **Milestone:** v0.1 beta to 10 users.

### Weeks 9–10: Relay + menubar

- SYNC-019 encrypted relay server.
- SYNC-020 `sync.yaml`; SYNC-021 multi-root.
- SYNC-022 macOS menubar app.
- **Milestone:** Remote sync via relay works.

### Weeks 11–12: Polish + beta scale

- SYNC-023 conflict review TUI.
- SYNC-025 design partners; SYNC-027 private beta (50 users).
- SYNC-029 node_modules regen profile.
- SYNC-028 telemetry (opt-in).
- **Milestone:** v0.5 private beta launch.

---

## 14. AGENT TASK LIST

| ID | Title | Description | Dependencies | Effort | Deliverable | Category |
|----|-------|-------------|--------------|--------|-------------|----------|
| SYNC-001 | Architecture RFC | Protocol, safety model, crate structure ADR | — | M | RFC document | Engineering |
| SYNC-002 | Rust workspace scaffold | Cargo workspace with CI, clippy, cross-compile | SYNC-001 | S | Green CI repo | Engineering |
| SYNC-003 | SQLite state schema | Files, chunks, peers, versions tables | SYNC-002 | M | Schema + migrations | Engineering |
| SYNC-004 | Filesystem watcher | notify-based recursive watch with debounce | SYNC-002 | M | Watcher integration tests | Engineering |
| SYNC-005 | Content-defined chunking | FastCDC implementation with Blake3 hashes | SYNC-003 | L | Chunker bench results | Engineering |
| SYNC-006 | `.gitignore` parser | gitignore-spec compliant parser | SYNC-002 | M | Parser test corpus | Engineering |
| SYNC-007 | Git safety hard-exclude | Never sync `.git/` unless explicit danger flag | SYNC-006 | S | Safety unit tests | Engineering |
| SYNC-008 | Built-in ignore profiles | default, minimal, node_regen profiles | SYNC-006 | S | Profile definitions | Engineering |
| SYNC-009 | mDNS peer discovery | `_devsync._udp` LAN advertisement | SYNC-002 | M | Discovery demo | Engineering |
| SYNC-010 | QUIC transport layer | quinn-based encrypted transport | SYNC-009 | L | P2P ping test | Engineering |
| SYNC-011 | Pairing flow | Short code / QR key exchange | SYNC-010 | M | Pairing E2E test | Engineering |
| SYNC-012 | Sync protocol v0 | Manifest exchange, delta transfer | SYNC-005, SYNC-010 | L | Protocol spec + impl | Engineering |
| SYNC-013 | `two-way-safe` conflicts | Conflict detection + dual-file preservation | SYNC-012 | M | Conflict scenario tests | Engineering |
| SYNC-014 | Agent daemon | Long-running sync daemon with IPC | SYNC-012 | M | `devsyncd` binary | Engineering |
| SYNC-015 | CLI v0 | `watch`, `status`, `pair`, `pause` commands | SYNC-014 | M | CLI help docs | Engineering |
| SYNC-016 | Git lock awareness | Pause sync when index.lock present | SYNC-007, SYNC-012 | S | Lock integration test | Engineering |
| SYNC-017 | Crash recovery | Resume interrupted transfers | SYNC-012 | M | Crash injection test | Engineering |
| SYNC-018 | 10k-file stress test | Performance and memory benchmarks | SYNC-012 | M | Benchmark report | Engineering |
| SYNC-019 | Encrypted relay server | NAT traversal relay; zero-knowledge | SYNC-010 | L | Relay deploy + docs | Infrastructure |
| SYNC-020 | `sync.yaml` config | Multi-root, peer, profile configuration | SYNC-008 | S | Config schema | Engineering |
| SYNC-021 | Multi-root support | Sync multiple paths per daemon | SYNC-014, SYNC-020 | M | Multi-root E2E | Engineering |
| SYNC-022 | macOS menubar app | Status UI, pause, conflict badge | SYNC-014 | M | Signed macOS app | Product |
| SYNC-023 | Conflict review TUI | Terminal UI for conflict resolution | SYNC-013 | M | TUI demo video | Product |
| SYNC-024 | Landing page + waitlist | Marketing site with email capture | — | S | devsync.dev live | GTM |
| SYNC-025 | Design partner program | Recruit 20 beta users from waitlist | SYNC-024 | S | Partner Slack channel | GTM |
| SYNC-026 | Git safety public doc | "Why DevSync won't corrupt git" | SYNC-007 | S | Published doc | GTM |
| SYNC-027 | Private beta onboarding | Onboarding flow, feedback surveys | SYNC-022, SYNC-025 | M | 50 active users | GTM |
| SYNC-028 | Telemetry (opt-in) | Anonymous sync success metrics | SYNC-014 | S | Telemetry module | Engineering |
| SYNC-029 | `node_modules` regen profile | Lockfile sync + install on peer | SYNC-008, SYNC-012 | M | Regen profile docs | Engineering |
| SYNC-030 | Linux FUSE read-only mount | Browse remote files without full sync | SYNC-012 | L | FUSE prototype | Engineering |
| SYNC-031 | Windows alpha port | Port daemon to Windows | SYNC-014 | L | Windows alpha binary | Engineering |
| SYNC-032 | VS Code extension stub | Sync status bar item | SYNC-015 | M | Extension v0.1 | Product |

**Critical path:** SYNC-001 → SYNC-002 → SYNC-012 → SYNC-014 → SYNC-027

---

## 15. Open Questions & Decision Points

| # | Question | Options | Deadline | Owner |
|---|----------|---------|----------|-------|
| 1 | Tauri vs native Swift menubar? | Tauri (Rust reuse) vs Swift (native feel) | Week 8 | Product |
| 2 | Relay: self-host only vs SaaS? | Both; SaaS for revenue | Week 6 | CEO |
| 3 | Sync uncommitted git state? | Never vs optional worktree sync | Week 4 | Eng |
| 4 | Free tier peer limit? | 2 vs 3 peers | Week 10 | CEO |
| 5 | Windows priority vs Linux FUSE? | Linux FUSE v1; Windows alpha | Week 12 | Product |
| 6 | Conflict file naming convention? | `.devsync-conflict-*` final? | Week 5 | Eng |
| 7 | Chunk size tuning default? | 64KB avg vs 32KB | Week 4 | Eng |
| 8 | Open source license? | AGPL vs BSL (delayed OSS) | Week 2 | CEO |
| 9 | Integration with bgit overlay? | Optional `.bgit/` sync profile | Month 4 | Partnership |
| 10 | Pricing: per-machine vs per-user? | Per-user (chosen) | Week 10 | CEO |

---

*Document version: 1.0 — Generated for autonomous agent execution.*
