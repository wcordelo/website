# Consolidated Agent Task Registry

Master index of executable tasks across all six startup ideas. Each task is designed for autonomous agent execution with explicit dependencies and acceptance criteria.

**Task ID prefixes:** `NPM-` · `GIT-` · `SYNC-` · `MOB-` · `COMM-` · `BENCH-`

**Effort:** S = small (<1 day) · M = medium (1–3 days) · L = large (3+ days)

---

## Idea 1: Better npm/npx (`NPM-*`)

| ID | Title | Deps | Effort | Category |
|----|-------|------|--------|----------|
| NPM-001 | Competitive intel dossier | — | M | Research |
| NPM-002 | Threat feed inventory | — | M | Research |
| NPM-003 | npm CLI fork study | NPM-001 | M | Engineering |
| NPM-004 | Monorepo bootstrap | — | S | Engineering |
| NPM-005 | CLI scaffold | NPM-004 | M | Engineering |
| NPM-006 | Blocklist schema | NPM-002 | S | Engineering |
| NPM-007 | Intel ingestion worker | NPM-002, NPM-006 | L | Engineering |
| NPM-008 | Install-time block gate | NPM-005, NPM-007 | L | Engineering |
| NPM-009 | Lifecycle script policy | NPM-008 | M | Engineering |
| NPM-010 | `.better-npmrc` parser | NPM-008 | M | Engineering |
| NPM-011 | `bnpm init` command | NPM-010 | S | Engineering |
| NPM-012 | Emergency deprecate TUI | NPM-005 | L | Engineering |
| NPM-013 | Advisory generator | NPM-012 | M | Engineering |
| NPM-014 | Pipeline audit command | NPM-001 | L | Engineering |
| NPM-015 | GitHub Action v1 | NPM-008, NPM-010 | L | Engineering |
| NPM-016 | Docs site | NPM-005 | M | Design |
| NPM-017 | Brand + domain | — | S | GTM |
| NPM-018 | Telemetry (opt-in) | NPM-008 | M | Legal |
| NPM-019 | Publish wizard v1 | NPM-014 | L | Engineering |
| NPM-020 | Tarball diff engine | NPM-019 | L | Engineering |
| NPM-021 | Staged approve helper | NPM-019 | M | Engineering |
| NPM-022 | pnpm/yarn shim | NPM-008 | L | Engineering |
| NPM-023 | Control plane API | NPM-010 | L | Engineering |
| NPM-024 | Dashboard MVP | NPM-023 | L | Design |
| NPM-025 | Registry proxy PoC | NPM-023 | L | Engineering |
| NPM-026 | Stripe billing | NPM-024 | M | GTM |
| NPM-027 | Slack webhook integration | NPM-024 | M | Engineering |
| NPM-028 | Maintainer outreach campaign | NPM-016, NPM-019 | M | GTM |
| NPM-029 | Launch content pack | NPM-016, NPM-014 | M | GTM |
| NPM-030 | Third-party pen test | NPM-025 | L | Legal |
| NPM-031 | SOC 2 readiness | NPM-023 | L | Legal |
| NPM-032 | Sigstore verify module | NPM-003 | M | Engineering |

**Critical path:** NPM-001 → NPM-004 → NPM-005 → NPM-008 → NPM-019 → NPM-025

---

## Idea 2: Better git (`GIT-*`)

| ID | Title | Deps | Effort | Category |
|----|-------|------|--------|----------|
| GIT-001 | Intent schema RFC | — | M | Architecture |
| GIT-002 | `.bgit/` directory layout | GIT-001 | S | Architecture |
| GIT-003 | Monorepo bootstrap | — | S | Engineering |
| GIT-004 | `bgit init` command | GIT-002, GIT-003 | M | Engineering |
| GIT-005 | Git refs integration | GIT-001, GIT-004 | M | Engineering |
| GIT-006 | `bgit session start` | GIT-004, GIT-005 | M | Engineering |
| GIT-007 | `bgit session end` | GIT-006 | M | Engineering |
| GIT-008 | Claude Code log parser | GIT-006 | L | Engineering |
| GIT-009 | Redaction engine | GIT-008 | M | Security |
| GIT-010 | `bgit checkpoint` | GIT-006, GIT-005 | S | Engineering |
| GIT-011 | `bgit why` reverse lookup | GIT-007, GIT-010 | M | Engineering |
| GIT-012 | `bgit trace` forward lookup | GIT-008 | M | Engineering |
| GIT-013 | JSON output mode | GIT-003 | M | Engineering |
| GIT-014 | MCP server scaffold | GIT-013 | M | Engineering |
| GIT-015 | MCP core tools (10) | GIT-014, GIT-006 | L | Engineering |
| GIT-016 | Secrets crypto module | GIT-002 | L | Security |
| GIT-017 | `bgit secret set/get` | GIT-016, GIT-004 | M | Security |
| GIT-018 | OS keychain integration | GIT-016 | M | Security |
| GIT-019 | Git smudge/clean filter | GIT-017 | M | Security |
| GIT-020 | Auto-checkpoint hook | GIT-010 | S | Engineering |
| GIT-021 | Session squash | GIT-007, GIT-010 | M | Engineering |
| GIT-022 | Cursor log adapter | GIT-008 | M | Engineering |
| GIT-023 | Docs site | GIT-004, GIT-015, GIT-017 | M | GTM |
| GIT-024 | Homebrew formula | GIT-004 | S | GTM |
| GIT-025 | Design partner program | GIT-015, GIT-017 | M | GTM |
| GIT-026 | Benchmark: commit noise | GIT-021 | S | Product |
| GIT-027 | `bgit export` git-compat verify | GIT-005 | S | Engineering |
| GIT-028 | Policy engine spec | GIT-001 | M | Architecture |
| GIT-029 | jj workspace spike | GIT-004 | L | Engineering |
| GIT-030 | Semantic diff spike | GIT-003 | L | Engineering |
| GIT-031 | Threat model document | GIT-016, GIT-009 | M | Security |
| GIT-032 | Launch blog post | GIT-023, GIT-026 | S | GTM |

**Critical path:** GIT-001 → GIT-004 → GIT-006 → GIT-015 → GIT-017

---

## Idea 3: Dropbox for Developers (`SYNC-*`)

| ID | Title | Deps | Effort | Category |
|----|-------|------|--------|----------|
| SYNC-001 | Architecture RFC | — | M | Engineering |
| SYNC-002 | Rust workspace scaffold | SYNC-001 | S | Engineering |
| SYNC-003 | SQLite state schema | SYNC-002 | M | Engineering |
| SYNC-004 | Filesystem watcher | SYNC-002 | M | Engineering |
| SYNC-005 | Content-defined chunking | SYNC-003 | L | Engineering |
| SYNC-006 | `.gitignore` parser | SYNC-002 | M | Engineering |
| SYNC-007 | Git safety hard-exclude | SYNC-006 | S | Engineering |
| SYNC-008 | Built-in ignore profiles | SYNC-006 | S | Engineering |
| SYNC-009 | mDNS peer discovery | SYNC-002 | M | Engineering |
| SYNC-010 | QUIC transport layer | SYNC-009 | L | Engineering |
| SYNC-011 | Pairing flow | SYNC-010 | M | Engineering |
| SYNC-012 | Sync protocol v0 | SYNC-005, SYNC-010 | L | Engineering |
| SYNC-013 | `two-way-safe` conflicts | SYNC-012 | M | Engineering |
| SYNC-014 | Agent daemon | SYNC-012 | M | Engineering |
| SYNC-015 | CLI v0 | SYNC-014 | M | Engineering |
| SYNC-016 | Git lock awareness | SYNC-007, SYNC-012 | S | Engineering |
| SYNC-017 | Crash recovery | SYNC-012 | M | Engineering |
| SYNC-018 | 10k-file stress test | SYNC-012 | M | Engineering |
| SYNC-019 | Encrypted relay server | SYNC-010 | L | Infrastructure |
| SYNC-020 | `sync.yaml` config | SYNC-008 | S | Engineering |
| SYNC-021 | Multi-root support | SYNC-014, SYNC-020 | M | Engineering |
| SYNC-022 | macOS menubar app | SYNC-014 | M | Product |
| SYNC-023 | Conflict review TUI | SYNC-013 | M | Product |
| SYNC-024 | Landing page + waitlist | — | S | GTM |
| SYNC-025 | Design partner program | SYNC-024 | S | GTM |
| SYNC-026 | Git safety public doc | SYNC-007 | S | GTM |
| SYNC-027 | Private beta onboarding | SYNC-022, SYNC-025 | M | GTM |
| SYNC-028 | Telemetry (opt-in) | SYNC-014 | S | Engineering |
| SYNC-029 | `node_modules` regen profile | SYNC-008, SYNC-012 | M | Engineering |
| SYNC-030 | Linux FUSE read-only mount | SYNC-012 | L | Engineering |
| SYNC-031 | Windows alpha port | SYNC-014 | L | Engineering |
| SYNC-032 | VS Code extension stub | SYNC-015 | M | Product |

**Critical path:** SYNC-001 → SYNC-002 → SYNC-012 → SYNC-014 → SYNC-027

---

## Idea 4: New Mobile Platform / ShipKit (`MOB-*`)

| ID | Title | Deps | Effort | Category |
|----|-------|------|--------|----------|
| MOB-001 | Customer discovery interviews | — | M | Research |
| MOB-002 | Competitive teardown | — | S | Research |
| MOB-003 | 16 KB analyzer spike | MOB-001 | M | Engineering |
| MOB-004 | Monorepo scaffold | — | S | Engineering |
| MOB-005 | Dependency graph scanner | MOB-004 | M | Engineering |
| MOB-006 | Expo SDK detector | MOB-005 | S | Engineering |
| MOB-007 | 16 KB compatibility registry | MOB-003 | L | Data |
| MOB-008 | CLI `scan` command | MOB-005, MOB-006, MOB-007 | M | Engineering |
| MOB-009 | HTML scan report generator | MOB-008 | S | Product |
| MOB-010 | Breaking change knowledge base | MOB-001 | L | Data |
| MOB-011 | Upgrade target resolver | MOB-007, MOB-010 | M | Engineering |
| MOB-012 | Codemod: package.json bump | MOB-011 | M | Engineering |
| MOB-013 | Codemod: app.config migrations | MOB-012 | M | Engineering |
| MOB-014 | AI fix orchestrator | MOB-010 | L | Engineering |
| MOB-015 | AI eval harness | MOB-014 | M | Engineering |
| MOB-016 | API service scaffold | MOB-004 | M | Engineering |
| MOB-017 | Cloud scan orchestrator | MOB-016, MOB-008 | M | Engineering |
| MOB-018 | EAS OAuth integration | MOB-016 | M | Integration |
| MOB-019 | Post-build AAB analyzer | MOB-003, MOB-018 | M | Engineering |
| MOB-020 | GitHub App setup | MOB-016, MOB-008 | M | Integration |
| MOB-021 | Auto-fix branch creator | MOB-014, MOB-020 | M | Engineering |
| MOB-022 | Store preflight rule engine | MOB-001 | L | Product |
| MOB-023 | Privacy manifest validator | MOB-022 | M | Engineering |
| MOB-024 | Dashboard MVP | MOB-017 | L | Product |
| MOB-025 | Upgrade wizard UI | MOB-011, MOB-024 | M | Product |
| MOB-026 | Billing integration | MOB-024 | M | GTM |
| MOB-027 | GitHub Action publish | MOB-008 | S | GTM |
| MOB-028 | Landing page + docs | MOB-008, MOB-009 | M | GTM |
| MOB-029 | Design partner case study #1 | MOB-025, MOB-018 | S | GTM |
| MOB-030 | Expo partner application | MOB-018, MOB-029 | S | GTM |
| MOB-031 | SOC 2 readiness checklist | MOB-017 | M | Ops |
| MOB-032 | Launch campaign | MOB-028, MOB-026 | M | GTM |
| MOB-033 | Agency multi-app view | MOB-024 | M | Product |
| MOB-034 | Slack alert integration | MOB-017 | S | Integration |
| MOB-035 | False positive feedback loop | MOB-008 | S | Product |

**Critical path:** MOB-001 → MOB-003 → MOB-008 → MOB-018 → MOB-025

---

## Idea 5: Better Slack (`COMM-*`)

| ID | Title | Deps | Effort | Category |
|----|-------|------|--------|----------|
| COMM-001 | Thread data model schema | — | M | Engineering |
| COMM-002 | Forum-first channel UI | COMM-001 | L | Engineering |
| COMM-003 | Thread composer | COMM-001 | M | Engineering |
| COMM-004 | Sub-thread creation | COMM-001, COMM-002 | M | Engineering |
| COMM-005 | Thread status workflow | COMM-001 | S | Engineering |
| COMM-006 | Thread subscriptions | COMM-001, COMM-012 | M | Engineering |
| COMM-007 | Cross-thread references | COMM-001 | M | Engineering |
| COMM-008 | Post primitive schema | COMM-001 | M | Engineering |
| COMM-009 | Post editor UI | COMM-008 | L | Engineering |
| COMM-010 | Post version diff | COMM-008, COMM-009 | M | Engineering |
| COMM-011 | Post templates | COMM-009 | S | Product |
| COMM-012 | Real-time WebSocket layer | COMM-001 | L | Engineering |
| COMM-013 | Workspace auth | — | M | Engineering |
| COMM-014 | Channel permissions (human) | COMM-013 | M | Engineering |
| COMM-015 | Agent registry service | COMM-013, COMM-014 | M | Engineering |
| COMM-016 | Capability permission engine | COMM-015 | L | Engineering |
| COMM-017 | Agent audit log | COMM-015, COMM-016 | M | Engineering |
| COMM-018 | Agent proposal flow for Posts | COMM-008, COMM-016 | M | Engineering |
| COMM-019 | CI Reporter agent | COMM-015, COMM-016, COMM-020 | M | Engineering |
| COMM-020 | GitHub integration | COMM-001 | L | Engineering |
| COMM-021 | Linear integration | COMM-020 | M | Engineering |
| COMM-022 | Full-text search | COMM-001, COMM-008 | L | Engineering |
| COMM-023 | Agent SDK (TypeScript) | COMM-015, COMM-016 | L | Engineering |
| COMM-024 | MCP server (OSS) | COMM-016, COMM-023 | L | Engineering |
| COMM-025 | Design partner program | COMM-002 | S | GTM |
| COMM-026 | Landing page + waitlist | — | S | GTM |
| COMM-027 | Slack bridge bot (read-only) | COMM-012, COMM-020 | L | Engineering |
| COMM-028 | Stripe billing integration | COMM-013 | M | Engineering |
| COMM-029 | SAML SSO | COMM-013, COMM-028 | M | Engineering |
| COMM-030 | Thread resolution ritual | COMM-005, COMM-008 | S | Product |
| COMM-031 | Notification digest | COMM-006 | M | Engineering |
| COMM-032 | Security review: agent permissions | COMM-016, COMM-017 | M | Security |
| COMM-033 | SOC 2 Type I prep | COMM-017 | L | Security |
| COMM-034 | Demo video production | COMM-002, COMM-009, COMM-019 | S | GTM |
| COMM-035 | Slack history import (basic) | COMM-001, COMM-002 | L | Engineering |

**Critical path:** COMM-001 → COMM-002 → COMM-012 → COMM-016 → COMM-023

---

## Idea 6: Better AI Benchmarks / BenchTrust (`BENCH-*`)

| ID | Title | Deps | Effort | Category |
|----|-------|------|--------|----------|
| BENCH-001 | Competitive intelligence dossier | — | M | Research |
| BENCH-002 | Methodology manifesto draft | BENCH-001 | M | GTM |
| BENCH-003 | Task extraction pipeline v0 | — | L | Engineering |
| BENCH-004 | Auto task validator | BENCH-003 | L | Engineering |
| BENCH-005 | Narrow/wide test classifier | BENCH-004 | M | Engineering |
| BENCH-006 | Human QA workflow | BENCH-004 | M | Operations |
| BENCH-007 | Private holdout vault | — | L | Engineering |
| BENCH-008 | Canary string system | BENCH-007 | M | Engineering |
| BENCH-009 | Sealed Docker runtime | BENCH-007 | L | Engineering |
| BENCH-010 | Multi-run orchestrator | BENCH-009 | L | Engineering |
| BENCH-011 | pass@k statistics engine | BENCH-010 | M | Engineering |
| BENCH-012 | Scorecard report generator | BENCH-011 | M | Product |
| BENCH-013 | Contamination audit agent | BENCH-007 | L | Engineering |
| BENCH-014 | Temporal decontamination tags | BENCH-003 | S | Engineering |
| BENCH-015 | Reference agent scaffold | BENCH-009 | M | Engineering |
| BENCH-016 | Scaffold adapter SDK | BENCH-015 | M | Engineering |
| BENCH-017 | Reward-hacking trajectory classifier | BENCH-009, BENCH-010 | L | Engineering |
| BENCH-018 | Design partner outreach | BENCH-002 | M | GTM |
| BENCH-019 | First partner eval | BENCH-010–013, BENCH-018 | L | GTM |
| BENCH-020 | API v0 | BENCH-012 | M | Engineering |
| BENCH-021 | Dashboard v0 | BENCH-020 | L | Product |
| BENCH-022 | Weekly task drop pipeline | BENCH-006, BENCH-007 | M | Operations |
| BENCH-023 | Pricing & packaging | BENCH-001 | S | Business |
| BENCH-024 | SOC2 readiness assessment | BENCH-007 | M | Compliance |
| BENCH-025 | Enterprise vertical scoping | BENCH-018 | M | GTM |
| BENCH-026 | Whitepaper publication | BENCH-019, BENCH-002 | M | GTM |
| BENCH-027 | W&B / Braintrust integration | BENCH-020 | M | Engineering |
| BENCH-028 | Second language expansion | BENCH-003, BENCH-006 | L | Engineering |
| BENCH-029 | Benchmark Trust Summit | BENCH-026 | M | GTM |
| BENCH-030 | Certification program design | BENCH-012, BENCH-013 | M | Product |
| BENCH-031 | Failure mode taxonomy | BENCH-010, BENCH-017 | M | Research |
| BENCH-032 | Procurement compliance pack | BENCH-024 | S | Compliance |

**Critical path:** BENCH-001 → BENCH-007 → BENCH-009 → BENCH-010 → BENCH-019

---

## Parallel Execution Guide

Agents working on multiple ideas should respect these **shared resource constraints**:

- **Brand/domain tasks** (NPM-017, GIT-024, SYNC-024, MOB-028, COMM-026) can run in parallel — different products.
- **Monorepo bootstraps** (NPM-004, GIT-003, MOB-004) are independent.
- **Design partner outreach** (NPM-028, GIT-025, SYNC-025, MOB-001, COMM-025, BENCH-018) should coordinate to avoid contacting the same teams twice.
- **SOC 2 prep** (NPM-031, COMM-033, BENCH-024, MOB-031) can share policy templates once any one is complete.
