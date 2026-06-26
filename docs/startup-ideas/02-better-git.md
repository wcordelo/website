# Better git (`bgit`) — Execution Plan

**Working name:** `bgit` / Better git  
**Strategy:** Git overlay (not a git replacement)  
**Priority signal:** High upside, brutal adoption curve  
**Task prefix:** `GIT-001` through `GIT-032`

---

## 1. Executive Summary

Git records *what* changed, but not *why*—especially when AI agents produce dozens of micro-commits, squash messy session output, or leak secrets into history. Engineering teams adopting Claude Code, Cursor, and other agentic tools face a new class of version-control problems: unreviewable commit noise, lost provenance between prompt and patch, no standard way to attach agent session logs to commits, and secrets that slip through because `.env` was committed during an agent marathon.

**bgit** is a **git overlay** that stores intent, session metadata, and agent provenance in a `.bgit/` directory while keeping normal git refs, remotes, and workflows intact. Developers still `git push` to GitHub; they run `bgit session start` before an agent task and `bgit session end` when done. The overlay captures checkpoints, redacted agent logs, and semantic links between prompts and file changes—enabling `bgit why <file>` and `bgit trace <commit>` without rewriting git's object model.

The adoption strategy is deliberately incremental: **no migration cliff**. Teams install `bgit` alongside git, opt in per-repo, and export to pure git at any time. The MCP server exposes session/checkpoint tools to agents, making bgit the **memory layer** for agentic development.

**Why now:** Agent-generated commits are flooding repos; enterprises need audit trails for AI-assisted code; jj and Sapling proved appetite for git alternatives but failed on ecosystem compatibility; the overlay model threads the needle.

**90-day goal:** Ship v0.1 with session/checkpoint/why; MCP server with 10 tools; 5 design partners using daily; publish benchmark showing 40% reduction in "unexplained" commits.

---

## 2. Problem Statement & Evidence

### The core problem

Git was designed for human developers making deliberate commits. AI agents produce high-velocity, low-context changes that break git's implicit contract: each commit should be a coherent, reviewable unit with human intent.

### Evidence

| Signal | Data point |
|--------|------------|
| Agent adoption | **60%+** of developers use AI coding tools weekly (JetBrains 2025 survey) |
| Commit noise | Agent sessions generate **10–50 micro-commits** before human squash |
| Provenance gap | No standard links prompt → tool calls → file edits → commit |
| Secret leaks | **12%** of public repos contain secrets; agents accelerate accidental commits |
| Review burden | PRs with agent-generated code take **2× longer** to review without context |
| Failed alternatives | Sapling/jj adoption stalled on GitHub/GitLab integration friction |

### Specific pain scenarios

1. **"Who asked for this change?"** — Reviewer sees a refactor with no linked issue or prompt.
2. **"What did the agent try first?"** — Failed attempts lost after squash.
3. **"Is this safe to merge?"** — No visibility into agent tool calls (file deletes, network requests).
4. **"Rotate that key"** — Secret committed during agent session; git history scrub is painful.

### Jobs to be done

1. **Capture agent session context** without polluting git history.
2. **Checkpoint frequently**, squash intelligently at session end.
3. **Trace causality** from file → prompt and commit → agent actions.
4. **Protect secrets** with overlay-aware smudge/clean filters.
5. **Expose agent-native APIs** (MCP) for session management.

### Why overlay, not replacement

- **GitHub/GitLab are the system of record** — fighting this loses.
- **jj/Sapling proved** better UX isn't enough without zero-friction interop.
- **Overlay = optional adoption** — one repo, one team, one developer at a time.

---

## 3. Target Customer Profiles (ICP)

### Primary ICP: AI-forward engineering teams (20–200 devs)

| Attribute | Detail |
|-----------|--------|
| Stack | TypeScript/Python monorepos, GitHub, Claude Code or Cursor |
| Trigger | Security review of agent workflows; PR review slowdown |
| Buyer | Eng manager / platform lead (economic); senior IC (champion) |
| Budget | $15K–$80K/year for developer productivity + compliance |
| Adoption | Power users → team policy → org standard |

### Secondary ICP: Regulated industries (fintech, healthtech)

| Attribute | Detail |
|-----------|--------|
| Pain | Audit trail for AI-generated code; SOX/HIPAA change documentation |
| Offer | `bgit export` with signed session logs; redaction guarantees |
| Expansion | Policy engine (GIT-028) for required session metadata |

### Tertiary ICP: Agent framework builders

| Attribute | Detail |
|-----------|--------|
| Pain | No standard VCS integration for agent memory |
| Offer | MCP server (OSS); embed bgit in their toolchain |
| Monetization | Enterprise support, hosted session vault |

### Anti-ICP

- Teams not using AI agents (value prop is weak).
- Orgs mandating Sapling/jj already (convert later).
- Non-git VCS shops.

---

## 4. Competitive Landscape & Differentiation Matrix

| Capability | Git | jj | Sapling | GitButler | **bgit** |
|------------|-----|-----|---------|-----------|----------|
| GitHub interop (native) | ✓ | partial | partial | ✓ | **✓** |
| Agent session capture | ✗ | ✗ | ✗ | ✗ | **✓** |
| Prompt → change trace | ✗ | ✗ | ✗ | ✗ | **✓** |
| MCP agent API | ✗ | ✗ | ✗ | ✗ | **✓** |
| Secret smudge/clean | manual | manual | manual | ✗ | **✓** |
| Overlay (no migration) | n/a | ✗ | ✗ | partial | **✓** |
| Checkpoint / squash | manual | ✓ | ✓ | ✓ | **✓ (agent-aware)** |
| Replace git | n/a | ✓ | ✓ | ✗ | **✗ (by design)** |

### Differentiation thesis

1. **Agent-native, not human-native** — designed for session semantics.
2. **Overlay, not fork** — git stays canonical.
3. **MCP-first** — agents manage their own memory.
4. **Provenance as a feature** — `bgit why` is the killer demo.

### Competitive risks

- GitHub ships "agent sessions" natively (high impact; move fast on MCP + export).
- Cursor/Anthropic build internal VCS (partner, don't compete).
- Overlay complexity confuses users (mitigate with great docs + defaults).

---

## 5. Product Vision & MVP Scope

### Vision (3-year)

bgit becomes the **standard provenance layer** for agent-assisted software development—every AI-generated change is traceable, reviewable, and exportable to plain git when needed.

### v0.1 — "Sessions and checkpoints" (Weeks 1–6)

| Feature | Description |
|---------|-------------|
| `bgit init` | Create `.bgit/` in existing git repo |
| `bgit session start/end` | Bound agent work units |
| `bgit checkpoint` | Snapshot during session |
| Git refs integration | Sessions stored as git notes or parallel refs |
| `bgit why <path>` | Reverse lookup: file → session → prompt summary |
| Claude Code log parser | Ingest agent logs into session |
| Redaction engine | Strip secrets before persistence |
| Docs + Homebrew | Install in <5 minutes |

### v0.5 — "Agent platform" (Weeks 7–12)

| Feature | Description |
|---------|-------------|
| `bgit trace <commit>` | Forward lookup: commit → agent actions |
| MCP server (10 tools) | Agents call session/checkpoint APIs |
| `bgit secret set/get` | Encrypted secrets with OS keychain |
| Git smudge/clean filter | Prevent secret commits |
| Session squash | Collapse checkpoints → one clean commit |
| Cursor log adapter | Multi-agent support |
| JSON output mode | Scriptable integrations |

### v1.0 — "Enterprise provenance" (Months 4–6)

| Feature | Description |
|---------|-------------|
| Policy engine | Require sessions for agent commits |
| `bgit export` | Audit-ready bundle for compliance |
| Hosted session vault (optional) | Team-wide session search |
| jj workspace spike evaluation | Future path if overlay limits hit |
| Semantic diff spike | Intent-aware diffs |

---

## 6. Technical Architecture

### Overlay model

```
repo/
├── .git/                    # Standard git (unchanged)
├── .bgit/
│   ├── config.yaml          # Repo-level bgit config
│   ├── sessions/
│   │   └── sess_abc123/
│   │       ├── meta.json    # start time, agent, user
│   │       ├── prompts/     # Redacted prompt log
│   │       ├── checkpoints/ # Checkpoint snapshots
│   │       └── trace.jsonl  # Agent action log
│   ├── secrets/             # Encrypted secret vault
│   └── index.db             # SQLite: fast lookups
└── src/                     # Normal working tree
```

### Git integration

- **Refs:** `refs/bgit/sessions/<id>` pointing to commit at session start.
- **Notes:** Optional git notes on commits with `bgit-session-id`.
- **Hooks:** `pre-commit` auto-checkpoint; `post-commit` link commit to session.
- **Export:** `bgit export` produces vanilla git with optional notes—no `.bgit` required for consumers.

### Session lifecycle

```
bgit session start --agent claude-code
  → creates sess_id, records HEAD
  → starts log ingestion watcher

[agent works; bgit checkpoint optionally auto-fired]

bgit session end --squash
  → generates trace summary
  → squashes checkpoints into staged commit
  → attaches session metadata to commit
```

### MCP server architecture

- **Transport:** stdio + HTTP/SSE.
- **Tools:** `session_start`, `session_end`, `checkpoint`, `why`, `trace`, `secret_get`, `secret_set`, `status`, `export`, `policy_check`.
- **Auth:** Local socket; future team token for shared vault.

### Redaction pipeline

1. Ingest raw agent log.
2. Run patterns: API keys, JWTs, PEM blocks, `.env` contents.
3. Replace with `[REDACTED:<hash>]` for correlation without exposure.
4. Store redacted; never persist raw secrets.

### Crypto module

- Secrets encrypted with repo-specific key derived from OS keychain.
- AES-256-GCM; key rotation via `bgit secret rotate`.

---

## 7. Core Features Deep Dive

### 7.1 Intent schema (GIT-001)

Every session records structured intent:

```json
{
  "session_id": "sess_abc123",
  "agent": "claude-code",
  "user": "dev@company.com",
  "intent": "Fix authentication bug in login flow",
  "issue_ref": "JIRA-4521",
  "started_at": "2026-06-01T10:00:00Z",
  "checkpoints": ["cp_001", "cp_002"],
  "final_commit": "a1b2c3d"
}
```

This schema is the contract for MCP tools, export, and policy engine.

### 7.2 Session start/end

`bgit session start` opens a bounded context. Agents (via MCP) know they're "in session" and can checkpoint freely. `bgit session end`:

- Closes log ingestion.
- Prompts for squash strategy (single commit, per-checkpoint, none).
- Writes `bgit-trace` trailer to commit message.

### 7.3 Checkpoint

Lightweight snapshot: current diff stat, HEAD, timestamp. Auto-checkpoint hook fires on file save threshold or timer. Enables recovery: `bgit session resume` from last checkpoint.

### 7.4 `bgit why`

Reverse lookup chain:

```
src/auth/login.ts (line 42)
  → checkpoint cp_002 (2026-06-01 10:23)
  → prompt: "Add rate limiting to login endpoint"
  → session sess_abc123
  → commit a1b2c3d
```

Reviewers click one command instead of archaeology.

### 7.5 `bgit trace`

Forward lookup from commit:

```
commit a1b2c3d
  → session sess_abc123
  → 47 tool calls (12 file edits, 2 terminal, 1 web fetch)
  → 3 checkpoints
  → intent: "Fix authentication bug"
```

### 7.6 Secret management

`bgit secret set API_KEY` stores in encrypted vault. Git smudge/clean filter replaces `bgit-secret:API_KEY` with actual value in working tree but never in index. Pre-commit hook blocks accidental plaintext.

### 7.7 Session squash

Intelligent squash merges checkpoints:

- Combines diff hunks (not textual commit squash).
- Preserves trace metadata on resulting commit.
- Benchmark target (GIT-026): 40% fewer "unexplained" commits in agent repos.

### 7.8 MCP integration

Agents call `checkpoint` after significant changes. IDE plugins register session on agent start. Makes bgit invisible—agents just use tools.

---

## 8. Go-to-Market Strategy

### Phase 1: Developer love (Months 1–3)

- **OSS CLI + MCP server** (core differentiation open).
- **Demo:** `bgit why` on a real agent session—viral clip.
- **Channels:** Cursor/Claude discords, AI eng Twitter, dev tools podcasts.
- **Content:** "Your agent commits are unreviewable" essay.

### Phase 2: Design partners (Months 2–4)

- 5 teams using agents daily; weekly feedback.
- Co-develop Cursor adapter (GIT-022).
- Case study: review time reduction.

### Phase 3: Enterprise (Months 4–12)

- Policy engine for regulated customers.
- Hosted vault for session search across repos.
- Compliance pack: export format for auditors.

### Positioning

> "Git tells you what changed. bgit tells you why—and who (or what) made it happen."

### Partnerships

- Anthropic/Cursor: official MCP integration.
- Linear/Jira: issue_ref linking.
- BenchTrust (idea #6): agent eval data from session logs.

---

## 9. Business Model & Pricing Tiers

### Open source (free)

- bgit CLI, local `.bgit/`, MCP server, single-user secrets.

### Team — $19/seat/month

- Team session search (local network sync).
- Shared redaction policies.
- Priority support.

### Business — $49/seat/month

- Hosted session vault.
- Policy engine (require sessions).
- SSO, audit export.

### Enterprise — custom

- On-prem vault, air-gapped.
- Custom retention, legal hold.
- SLA + compliance attestation.

### Revenue model notes

- Lower price than bnpm (developer tool vs security).
- Land with agent power users; expand to compliance buyers.
- **Year 1 target:** $150K ARR from 10 Business customers.

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| "Another git tool" fatigue | High | High | Overlay messaging; 5-min install; killer `why` demo |
| GitHub builds native agent provenance | Medium | High | Ship MCP first; become export standard |
| Overlay/.bgit ignored by teams | Medium | High | Auto-hooks; IDE integration; policy engine |
| Secret vault breach | Low | Critical | OS keychain, encryption, pen test (GIT-031) |
| Log parser fragility (agent updates) | High | Medium | Adapter pattern; community adapters |
| jj/Sapling "good enough" | Medium | Medium | Don't compete on diff UX; compete on agent semantics |
| Storage bloat from logs | Medium | Medium | Retention policies; compress; checkpoint pruning |

---

## 11. Success Metrics

### North star

**Sessions with complete trace** / **total agent commits** (provenance coverage).

### 90-day targets

| Metric | Target |
|--------|--------|
| GitHub stars | 1,500 |
| Weekly active repos | 200 |
| Design partners (daily use) | 5 |
| MCP tool calls/week | 1,000 |
| `bgit why` invocations/week | 500 |
| Documented review time reduction | 25%+ in 2 case studies |

### 12-month targets

| Metric | Target |
|--------|--------|
| ARR | $150K |
| Enterprise pilots | 3 |
| Agent framework integrations | 2 (official) |
| Provenance coverage (partner repos) | 80% of agent commits |

---

## 12. Team & Skills Required

| Role | Skills |
|------|--------|
| **CLI lead** | Rust or Go, git internals, libgit2 |
| **Agent integrations** | MCP protocol, Claude Code/Cursor log formats |
| **Security engineer** | Cryptography, keychain APIs, threat modeling |
| **DevRel** | Demo content, design partner management |

Minimum founding: 2 engineers + 1 GTM. Rust preferred for CLI performance and single-binary distribution.

---

## 13. 90-Day Execution Roadmap

### Weeks 1–2: Architecture

- GIT-001 intent schema RFC; GIT-002 `.bgit/` layout.
- GIT-003 monorepo; GIT-028 policy engine spec.
- GIT-031 threat model begins.
- **Milestone:** RFC approved; repo scaffolded.

### Weeks 3–4: Core CLI

- GIT-004 `bgit init`; GIT-005 git refs integration.
- GIT-006 session start; GIT-007 session end.
- GIT-010 checkpoint; GIT-020 auto-checkpoint hook.
- **Milestone:** First full session recorded.

### Weeks 5–6: v0.1 launch

- GIT-008 Claude Code log parser; GIT-009 redaction.
- GIT-011 `bgit why`; GIT-023 docs site; GIT-024 Homebrew.
- GIT-032 launch blog post.
- **Milestone:** v0.1 public; 3 design partners.

### Weeks 7–8: Trace + squash

- GIT-012 `bgit trace`; GIT-021 session squash.
- GIT-026 benchmark commit noise.
- GIT-027 `bgit export` git-compat verify.
- **Milestone:** Squash benchmark published.

### Weeks 9–10: MCP + secrets

- GIT-013 JSON output; GIT-014 MCP scaffold; GIT-015 MCP 10 tools.
- GIT-016 secrets crypto; GIT-017 secret set/get; GIT-018 keychain.
- GIT-019 smudge/clean filter.
- **Milestone:** Claude Code uses MCP in partner repo.

### Weeks 11–12: Multi-agent + GTM

- GIT-022 Cursor adapter.
- GIT-025 design partner program expansion.
- GIT-029 jj workspace spike (evaluate only).
- GIT-030 semantic diff spike.
- **Milestone:** v0.5 release; 5 daily-use partners.

---

## 14. AGENT TASK LIST

| ID | Title | Description | Dependencies | Effort | Deliverable | Category |
|----|-------|-------------|--------------|--------|-------------|----------|
| GIT-001 | Intent schema RFC | Define session, checkpoint, trace JSON schemas; version policy | — | M | RFC doc + JSON schemas | Architecture |
| GIT-002 | `.bgit/` directory layout | Directory structure, config format, migration versioning | GIT-001 | S | Layout spec + validator | Architecture |
| GIT-003 | Monorepo bootstrap | Rust workspace: cli, core, mcp, adapters | — | S | CI-green repo | Engineering |
| GIT-004 | `bgit init` command | Initialize overlay in existing git repo; idempotent | GIT-002, GIT-003 | M | `bgit init` + tests | Engineering |
| GIT-005 | Git refs integration | Store session refs; link commits via notes/trailers | GIT-001, GIT-004 | M | Refs integration tests | Engineering |
| GIT-006 | `bgit session start` | Create session, record HEAD, start log watcher | GIT-004, GIT-005 | M | Session start E2E | Engineering |
| GIT-007 | `bgit session end` | Close session, prompt squash, write metadata | GIT-006 | M | Session end E2E | Engineering |
| GIT-008 | Claude Code log parser | Parse Claude Code JSONL logs into trace events | GIT-006 | L | `claude-code` adapter crate | Engineering |
| GIT-009 | Redaction engine | Pattern-based secret redaction in logs | GIT-008 | M | Redaction test suite (100 cases) | Security |
| GIT-010 | `bgit checkpoint` | Manual/auto checkpoint with diff stat | GIT-006, GIT-005 | S | Checkpoint command | Engineering |
| GIT-011 | `bgit why` reverse lookup | File/path → session → prompt chain | GIT-007, GIT-010 | M | `bgit why` with examples | Engineering |
| GIT-012 | `bgit trace` forward lookup | Commit → session → tool calls | GIT-008 | M | `bgit trace` command | Engineering |
| GIT-013 | JSON output mode | `--json` on all commands for scripting | GIT-003 | M | JSON output contract | Engineering |
| GIT-014 | MCP server scaffold | stdio MCP server with health check | GIT-013 | M | `bgit mcp` runs | Engineering |
| GIT-015 | MCP core tools (10) | Implement 10 agent tools per architecture | GIT-014, GIT-006 | L | MCP tool docs + tests | Engineering |
| GIT-016 | Secrets crypto module | AES-256-GCM, key derivation, rotation | GIT-002 | L | `bgit-crypto` crate | Security |
| GIT-017 | `bgit secret set/get` | CLI for encrypted secret vault | GIT-016, GIT-004 | M | Secret commands | Security |
| GIT-018 | OS keychain integration | macOS Keychain, Linux secret-service, Windows DPAPI | GIT-016 | M | Cross-platform keychain | Security |
| GIT-019 | Git smudge/clean filter | Prevent secrets in git index | GIT-017 | M | Filter driver + docs | Security |
| GIT-020 | Auto-checkpoint hook | pre-commit/post-save checkpoint trigger | GIT-010 | S | Git hook templates | Engineering |
| GIT-021 | Session squash | Merge checkpoints into single commit | GIT-007, GIT-010 | M | Squash with trace preservation | Engineering |
| GIT-022 | Cursor log adapter | Parse Cursor agent logs (format research) | GIT-008 | M | `cursor` adapter crate | Engineering |
| GIT-023 | Docs site | Install, concepts, MCP guide, API reference | GIT-004, GIT-015, GIT-017 | M | docs.bgit.dev live | GTM |
| GIT-024 | Homebrew formula | `brew install bgit` distribution | GIT-004 | S | Homebrew tap | GTM |
| GIT-025 | Design partner program | Recruit 5 teams; weekly feedback cadence | GIT-015, GIT-017 | M | 5 signed partners | GTM |
| GIT-026 | Benchmark: commit noise | Measure unexplained commits before/after bgit | GIT-021 | S | Published benchmark post | Product |
| GIT-027 | `bgit export` git-compat verify | Export repo without .bgit; verify git clone works | GIT-005 | S | Export integration test | Engineering |
| GIT-028 | Policy engine spec | Rules: require session, block no-trace commits | GIT-001 | M | Policy schema + hook design | Architecture |
| GIT-029 | jj workspace spike | Evaluate jj as backend vs overlay limits | GIT-004 | L | Spike ADR (build/not build) | Engineering |
| GIT-030 | Semantic diff spike | Intent-aware diff prototype | GIT-003 | L | Demo video + ADR | Engineering |
| GIT-031 | Threat model document | Secrets, log storage, MCP attack surface | GIT-016, GIT-009 | M | Threat model doc | Security |
| GIT-032 | Launch blog post | "Git tells you what; bgit tells you why" | GIT-023, GIT-026 | S | Published post + HN | GTM |

**Critical path:** GIT-001 → GIT-004 → GIT-006 → GIT-015 → GIT-017

---

## 15. Open Questions & Decision Points

| # | Question | Options | Deadline | Owner |
|---|----------|---------|----------|-------|
| 1 | Rust vs Go for CLI? | Rust (perf, safety) vs Go (git libraries) | Week 1 | CTO |
| 2 | Session storage: SQLite vs JSONL? | SQLite index + JSONL logs (hybrid) | Week 2 | Eng |
| 3 | Git notes vs custom refs? | Notes (invisible) vs refs/bgit/* (explicit) | Week 3 | Eng |
| 4 | Default auto-checkpoint frequency? | Per-save vs 5-min timer | Week 5 | Product |
| 5 | MCP tools: OSS all vs hosted vault paid? | Core OSS; vault paid | Week 4 | CEO |
| 6 | Squash default on session end? | Prompt vs auto-squash | Week 6 | Product |
| 7 | Cursor vs Claude Code priority? | Claude first (done); Cursor week 11 | Week 8 | Eng |
| 8 | When to revisit jj backend? | v0.5 spike only vs v1.0 build | Week 12 | CTO |
| 9 | Hosted vault: build vs defer? | Defer to v1.0 | Week 10 | CEO |
| 10 | Commit trailer format standard? | `bgit-trace:` vs Git trailers RFC | Week 3 | Eng |

---

*Document version: 1.0 — Generated for autonomous agent execution.*
