# Better npm/npx (`bnpm`) — Execution Plan

**Working name:** `bnpm` / Better npm  
**Priority signal:** Strongest near-term wedge  
**Task prefix:** `NPM-001` through `NPM-032`

---

## 1. Executive Summary

JavaScript's package ecosystem runs on npm, but npm was designed for a world of human maintainers publishing occasional updates—not for AI agents installing thousands of transitive dependencies per week, nor for enterprises that need deterministic, auditable supply chains. The result is a persistent crisis: typosquatting, malicious lifecycle scripts, dependency confusion, maintainer account takeovers, and "just run `npm install`" pipelines that silently widen attack surface every merge.

**bnpm** is a drop-in npm/npx overlay that adds intelligence, policy, and control without requiring teams to abandon the npm registry or rewrite their workflows. It wraps the familiar CLI (`bnpm install`, `bnpm publish`, `bnpm audit`) with install-time block gates fed by real-time threat intelligence, lifecycle script policies, emergency deprecate flows for compromised packages, and a publish wizard that makes supply-chain hygiene the path of least resistance.

The near-term wedge is **security-conscious engineering teams** (50–500 engineers) who already feel pain from npm incidents and want something they can adopt in an afternoon: swap the binary, add a GitHub Action, configure `.better-npmrc`. Revenue comes from a control-plane SaaS (dashboard, org policies, registry proxy, billing) while the CLI remains free and open source to drive adoption.

**Why now:** AI coding agents dramatically increase install/publish velocity; Sigstore and provenance standards are maturing; recent high-profile npm compromises have made CISOs ask questions engineering already had; and incumbents (npm, Snyk, Socket) optimize for scanning after the fact—not blocking before install.

**90-day goal:** Ship v0.1 CLI with block gate + GitHub Action; land 10 design partners; launch v0.5 publish wizard; begin paid pilot for registry proxy.

---

## 2. Problem Statement & Evidence

### The core problem

npm is the world's largest software supply chain—and also one of its least governed. Every `npm install` executes arbitrary code via `preinstall`/`postinstall` scripts, pulls from a flat namespace with weak identity guarantees, and resolves versions against ranges that drift over time. Teams lack a single choke point to say "no, not this package, not today."

### Evidence

| Signal | Data point |
|--------|------------|
| Scale | npm serves **2B+ weekly downloads**; median app has **700+ transitive deps** |
| Incidents | **xz-utils-style** attacks migrated to npm (e.g., `eslint-config-prettier` typosquats, `ua-parser-js` compromise, `colors`/`faker` maintainer protests) |
| Lifecycle risk | **~15%** of popular packages run install scripts; many enterprises disable scripts entirely, breaking legitimate packages |
| Agent amplification | AI agents run `npm install` and `npx` unprompted; one bad suggestion = org-wide compromise |
| Enterprise gap | npm Organizations offer access control on *publishing*, not *consuming*; Snyk/Socket scan post-install |
| Maintainer burden | Emergency deprecations require npm support tickets; no first-party "kill switch" for consumers |

### Jobs to be done

1. **Block known-bad packages before they hit `node_modules`** — not after a weekly scan.
2. **Publish with confidence** — diff tarballs, staged approval, provenance attestation.
3. **Audit the pipeline** — "what would install if we merged this PR?"
4. **Respond to incidents in minutes** — org-wide deprecate/block without redeploying every laptop.

### Why incumbents haven't solved it

- **npm registry** optimizes for openness and maintainer autonomy.
- **Snyk/Dependabot** focus on CVEs in known packages, not novel malicious publishes.
- **Socket.dev** is strong on detection but is primarily SaaS/API, not a CLI replacement.
- **pnpm/yarn** improve disk efficiency, not threat blocking.

bnpm occupies the **CLI + policy enforcement** layer—the last mile before code runs on a developer machine or CI runner.

---

## 3. Target Customer Profiles (ICP)

### Primary ICP: Security-conscious mid-market engineering org

| Attribute | Detail |
|-----------|--------|
| Size | 50–500 engineers |
| Stack | Node/TypeScript monorepos, CI on GitHub Actions |
| Trigger | Recent npm scare, SOC 2 audit finding, or AI agent pilot |
| Buyer | Head of Platform / Security Engineering (economic); Staff+ IC (champion) |
| Budget | $20K–$150K/year for developer security tooling |
| Adoption path | GitHub Action → team CLI → org-wide policy |

### Secondary ICP: Open-source maintainers (top 10K packages)

| Attribute | Detail |
|-----------|--------|
| Pain | Account takeover fear, publish mistakes, typosquatting of their package names |
| Offer | Free publish wizard, emergency deprecate TUI, advisory generator |
| Monetization | Upsell to orgs that depend on their packages (indirect) |

### Tertiary ICP: AI-native startups

| Attribute | Detail |
|-----------|--------|
| Pain | Agents install packages autonomously; need guardrails |
| Offer | `.better-npmrc` agent policies, `bnpm init` secure defaults |
| Expansion | Registry proxy for air-gapped/agent sandboxes |

### Anti-ICP (do not pursue early)

- Teams with no Node footprint.
- Enterprises requiring on-prem registry *only* before v1.0 (route to design partner program).
- Developers who want "just faster npm" with no security story.

---

## 4. Competitive Landscape & Differentiation Matrix

| Capability | npm CLI | pnpm | Socket | Snyk | **bnpm** |
|------------|---------|------|--------|------|----------|
| Drop-in CLI replacement | ✓ | partial | ✗ | ✗ | **✓** |
| Install-time block gate | ✗ | ✗ | API | ✗ | **✓** |
| Real-time threat feed | ✗ | ✗ | ✓ | partial | **✓** |
| Lifecycle script policy | manual | manual | ✗ | ✗ | **✓** |
| Publish wizard + tarball diff | ✗ | ✗ | ✗ | ✗ | **✓** |
| Emergency org-wide deprecate | ✗ | ✗ | ✗ | ✗ | **✓** |
| Registry proxy (enterprise) | npm Enterprise | ✗ | ✗ | ✗ | **✓ (v1)** |
| Sigstore verify | partial | ✗ | ✗ | partial | **✓** |
| Free OSS CLI | ✓ | ✓ | ✗ | ✗ | **✓** |

### Differentiation thesis

1. **Enforcement, not just visibility** — block before `node_modules`, not alert after.
2. **Maintainer-grade publish UX** — make secure publishing easier than `npm publish`.
3. **Agent-native defaults** — `.better-npmrc` policies machines can read.
4. **Overlay strategy** — works with npm registry; no migration cliff.

### Competitive risks

- npm adds native blocking (low probability near-term; governance conflicts with openness mandate).
- Socket ships a CLI (would compress differentiation—move fast on enforcement + publish).
- pnpm/yarn adopt similar gates (partner via shims in NPM-022).

---

## 5. Product Vision & MVP Scope

### Vision (3-year)

Every `npm install` and `npx` invocation in professional software development runs through a policy-aware layer that defaults to safe. bnpm becomes the **AppSec choke point** for JavaScript consumption and publishing—like Cloudflare for packages.

### v0.1 — "Block the bad stuff" (Weeks 1–6)

**Theme:** Prove install-time enforcement works.

| Feature | Description |
|---------|-------------|
| `bnpm` CLI | Wraps npm commands; passes through when policy allows |
| Threat blocklist | Curated + ingested feeds; SQLite local cache |
| Install-time gate | Refuse install on blocklist match; clear error messages |
| `.better-npmrc` | Org policy file: blocklist level, script policy, allowed registries |
| `bnpm init` | Scaffold secure defaults for new projects |
| GitHub Action v1 | Fail PR if blocked package would install |
| Docs site | Install, configure, first block demo |

**Out of scope:** Registry proxy, billing, publish wizard.

### v0.5 — "Publish and audit" (Weeks 7–12)

| Feature | Description |
|---------|-------------|
| Pipeline audit (`bnpm audit-pipeline`) | Dry-run install from lockfile; report risk |
| Publish wizard v1 | Interactive publish with tarball preview |
| Tarball diff engine | Compare local vs registry version |
| Staged approve helper | CI gate before `npm publish` |
| Emergency deprecate TUI | Maintainer rapid response |
| Advisory generator | Auto-draft GHSA-style advisory from incident |
| pnpm/yarn shim | Policy hooks for alternate package managers |
| Control plane API + Dashboard MVP | Org policies, install telemetry (opt-in) |
| Slack webhook | Alert on block events |

### v1.0 — "Enterprise control plane" (Months 4–6)

| Feature | Description |
|---------|-------------|
| Registry proxy | Cache + policy enforce at network boundary |
| Stripe billing | Team/Enterprise tiers |
| Sigstore verify module | Require provenance on allowlisted packages |
| SOC 2 Type I | Enterprise procurement |
| Third-party pen test | Trust validation |

---

## 6. Technical Architecture

### High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Developer / CI                           │
│  bnpm CLI ──► Install Gate ──► npm registry (or proxy)      │
│     │              │                                         │
│     │         Local blocklist cache (SQLite)                 │
│     │              │                                         │
│     └──────────────┼─────────────────────────────────────────┤
│                    ▼                                         │
│            Control Plane API (SaaS)                          │
│     ┌──────────────┼──────────────┐                          │
│     │ Threat Intel │ Org Policies │ Dashboard               │
│     │ Ingestion    │ .better-npmrc│ Billing                 │
│     └──────────────┴──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### CLI layer (TypeScript/Rust hybrid)

- **TypeScript** for npm CLI compatibility (fork/wrap `libnpm` patterns).
- **Rust** optional for tarball diff and crypto-heavy paths (future).
- Commands delegate to npm when policy passes; intercept `install`, `ci`, `add`, `npx`.

### Threat intelligence pipeline

1. **Sources:** npm advisories, OSV, GitHub Advisory DB, curated typosquat patterns, partner feeds.
2. **Ingestion worker (NPM-007):** Normalize to blocklist schema (NPM-006).
3. **Distribution:** CDN-signed JSON bundles; CLI polls every 15 min; stale-while-revalidate.
4. **Emergency channel:** WebSocket push for critical blocks (v0.5).

### Blocklist schema (conceptual)

```json
{
  "package": "lodash",
  "version_range": "<4.17.21",
  "reason": "CVE-2021-23337",
  "severity": "high",
  "action": "block",
  "source": "osv",
  "expires_at": null
}
```

### Install-time gate flow

1. Resolve dependency tree (reuse npm arborist).
2. For each package@version, check blocklist + org policy.
3. Evaluate lifecycle script policy (`allow` / `warn` / `block`).
4. If block → exit code 1 with remediation link.
5. If pass → exec npm install with filtered script env.

### Control plane (v0.5+)

- **Stack:** Postgres, Redis, S3 (tarball cache for proxy), Fly.io or AWS.
- **Auth:** GitHub OAuth + API keys for CI.
- **Multi-tenancy:** Org → projects → policies.

### Registry proxy (v1.0)

- Transparent HTTPS proxy; MITM only with org-installed CA (enterprise).
- Cache tarballs; enforce policy at fetch; audit log every download.

---

## 7. Core Features Deep Dive

### 7.1 Install-time block gate

The flagship feature. Before any package enters `node_modules`, bnpm evaluates:

- **Global blocklist** (malware, known compromises).
- **Org deny list** (deprecated internal packages, license violations).
- **Version pins** (block ranges, e.g., `*` on critical deps).
- **Reputation signals** (new publish < 72h from new maintainer = warn).

Errors are actionable: "Package `eslint-config-prettierr` blocked: typosquat of `eslint-config-prettier`. Did you mean …?"

### 7.2 Lifecycle script policy

Enterprises often set `ignore-scripts=true`, breaking `esbuild`, `prisma`, etc. bnpm's policy engine allows:

- **Allowlist by package** (`esbuild: postinstall`).
- **Block by default, allow known-safe** (curated list).
- **Sandbox suggestion** (future: run scripts in microVM).

### 7.3 `.better-npmrc`

Machine-readable policy file checked into repos:

```ini
blocklist = strict
lifecycle_scripts = allowlist
allowed_registries = https://registry.npmjs.org
require_provenance = @myorg/*
telemetry = opt-in
```

Agents and humans share one source of truth.

### 7.4 Publish wizard

`bnpm publish` becomes an interactive flow:

1. Show tarball contents tree.
2. Diff vs last published version.
3. Flag new dependencies, new scripts, maintainer changes.
4. Optional: require second approver via CI token.
5. Attach Sigstore provenance (NPM-032).

### 7.5 Emergency deprecate TUI

When a maintainer's account is compromised, minutes matter. TUI flow:

1. Authenticate via npm OTP + bnpm account.
2. Select package; confirm deprecate message.
3. Push block to bnpm network immediately (ahead of npm propagation).
4. Generate advisory draft (NPM-013).

### 7.6 Pipeline audit command

`bnpm audit-pipeline` simulates CI install from a PR's lockfile without mutating `node_modules`. Outputs SARIF for GitHub Security tab. Critical for "shift left" sales narrative.

### 7.7 GitHub Action

```yaml
- uses: better-npm/action@v1
  with:
    policy: .better-npmrc
    fail-on: block
```

Runs on every PR; comments with human-readable risk summary.

---

## 8. Go-to-Market Strategy

### Phase 1: CLI-led developer adoption (Months 1–3)

- **Open-source CLI** on GitHub; MIT license.
- **Content:** "We blocked 47 typosquats last week" weekly thread; incident post-mortems.
- **Launch venues:** Hacker News, JS Party, TypeScript Discord, r/javascript.
- **Maintainer outreach (NPM-028):** Top 500 package maintainers get free publish wizard.

### Phase 2: Design partners → paid pilots (Months 2–4)

- Target 10 design partners from Primary ICP.
- Offer: free v0.5 + hands-on setup; in exchange, logo + case study.
- Convert 3–5 to paid at $2K–$5K/month for dashboard + proxy beta.

### Phase 3: Enterprise expansion (Months 4–12)

- SOC 2, pen test, procurement pack.
- Sales motion: security engineer champion → platform budget.
- Partnerships: GitHub Marketplace, Vercel/Netlify integration guides.

### Messaging pillars

1. **"Block before install"** — not another scanner.
2. **"Drop-in, not rip-and-replace"** — same registry, safer path.
3. **"Built for the agent era"** — policies machines understand.

### Channels

| Channel | Tactic |
|---------|--------|
| Product-led | `bnpm init`, GitHub Action, free blocklist |
| Community | Incident response threads, maintainer goodwill |
| Outbound | Security teams post-incident (timing-sensitive) |
| Partnerships | Sigstore, OpenSSF, package manager shims |

---

## 9. Business Model & Pricing Tiers

### Open source (free forever)

- bnpm CLI, local blocklist, `.better-npmrc`, GitHub Action (basic).
- Community threat feed (delayed 24h vs paid).

### Team — $29/seat/month (min 10 seats)

- Real-time threat feed.
- Org dashboard, policy management.
- Slack/webhook alerts.
- Pipeline audit (unlimited repos).

### Business — $79/seat/month

- Everything in Team.
- Publish wizard + staged approval.
- SSO (Google/GitHub).
- Priority support.

### Enterprise — custom ($50K–$200K/year)

- Registry proxy.
- On-prem / VPC deploy option.
- Custom blocklist rules, SIEM export.
- SLA, SOC 2 report, dedicated CSM.

### Revenue projections (conservative)

| Milestone | ARR |
|-----------|-----|
| 5 Team customers (20 seats) | ~$35K |
| 3 Business customers (50 seats) | ~$140K |
| 1 Enterprise | ~$75K |
| **Year 1 target** | **$250K ARR** |

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| False positives block CI | Medium | High | Graduated severity (warn → block); override with audit trail |
| npm ships native blocking | Low | High | Move faster; deepen publish + proxy moat |
| Legal liability for blocklist | Medium | Medium | Clear ToS; source attribution; appeal process |
| CLI maintenance burden (npm churn) | High | Medium | Pin npm internals; automated compatibility tests |
| Slow enterprise sales | Medium | Medium | PLG via GitHub Action; design partner case studies |
| Threat feed quality | Medium | High | Human review for critical blocks; partner with OSV |
| Agent adoption bypasses CLI | Medium | Medium | Registry proxy; CI enforcement as hard gate |

---

## 11. Success Metrics

### North star

**Blocked installs per week** (value delivered) × **orgs with active policy** (adoption).

### Leading indicators (90 days)

| Metric | Target |
|--------|--------|
| GitHub stars | 2,000 |
| Weekly active CLI users | 500 |
| Design partners | 10 |
| GitHub Action installs | 200 repos |
| Block events (true positive) | 50+ documented |
| Paid pilots | 3 |

### Lagging indicators (12 months)

| Metric | Target |
|--------|--------|
| ARR | $250K |
| Net revenue retention | >110% |
| Enterprise customers | 2 |
| False positive rate | <0.1% of installs |
| Time-to-block (new threat → CLI) | <15 minutes |

---

## 12. Team & Skills Required

### Founding team (minimum)

| Role | Skills |
|------|--------|
| **CEO / GTM** | Developer tools GTM, security buyer empathy, OSS community |
| **CTO / CLI lead** | Node.js internals, npm arborist, Rust (optional), supply chain security |
| **Founding engineer** | TypeScript, GitHub Actions, API/SaaS, threat intel pipelines |

### Early hires (post-seed)

- Security researcher (threat feed curation).
- Developer advocate (maintainer relations).
- Enterprise AE (post-SOC 2).

### Advisors

- npm/OpenJS Foundation alum.
- AppSec lead from fintech with npm incident experience.

---

## 13. 90-Day Execution Roadmap

### Weeks 1–2: Foundation

- NPM-001 competitive intel; NPM-002 threat feed inventory.
- NPM-004 monorepo; NPM-005 CLI scaffold.
- NPM-017 brand + domain; NPM-016 docs site skeleton.
- **Milestone:** `bnpm --version` runs; docs deploy.

### Weeks 3–4: Block gate core

- NPM-006 blocklist schema; NPM-007 ingestion worker.
- NPM-008 install-time gate; NPM-010 `.better-npmrc` parser.
- NPM-011 `bnpm init`; NPM-003 npm CLI fork study.
- **Milestone:** First real block demonstrated in CI.

### Weeks 5–6: v0.1 launch

- NPM-009 lifecycle script policy.
- NPM-015 GitHub Action v1.
- NPM-018 telemetry (opt-in); NPM-029 launch content pack.
- **Milestone:** v0.1 public launch; 3 design partners onboarded.

### Weeks 7–8: Audit + publish prep

- NPM-014 pipeline audit command.
- NPM-012 emergency deprecate TUI; NPM-013 advisory generator.
- NPM-019 publish wizard v1 begins.
- **Milestone:** Pipeline audit in 5 partner repos.

### Weeks 9–10: v0.5 features

- NPM-020 tarball diff; NPM-021 staged approve.
- NPM-022 pnpm/yarn shim; NPM-023 control plane API.
- **Milestone:** First publish via wizard.

### Weeks 11–12: SaaS + scale

- NPM-024 dashboard MVP; NPM-027 Slack webhooks.
- NPM-025 registry proxy PoC; NPM-026 Stripe billing.
- NPM-028 maintainer outreach; NPM-032 Sigstore verify.
- **Milestone:** v0.5 release; 3 paid pilots signed.

### Weeks 13+: v1.0 path

- NPM-030 pen test; NPM-031 SOC 2 readiness.
- Registry proxy beta; enterprise procurement pack.

---

## 14. AGENT TASK LIST

| ID | Title | Description | Dependencies | Effort | Deliverable | Category |
|----|-------|-------------|--------------|--------|-------------|----------|
| NPM-001 | Competitive intel dossier | Research Socket, Snyk, npm audit, pnpm, Yarn Berry; document gaps and positioning | — | M | 20-page competitive doc with matrix | Research |
| NPM-002 | Threat feed inventory | Catalog OSV, GitHub Advisory, npm audit API, typosquat heuristics; rate limits and ToS | — | M | Feed inventory spreadsheet + ingestion architecture | Research |
| NPM-003 | npm CLI fork study | Spike wrapping vs forking npm CLI; document upgrade path | NPM-001 | M | ADR with recommendation | Engineering |
| NPM-004 | Monorepo bootstrap | pnpm/turbo monorepo: cli, core, action, docs packages | — | S | Repo with CI green | Engineering |
| NPM-005 | CLI scaffold | `bnpm` binary with command router; passthrough to npm for v0 | NPM-004 | M | Published npm package `@better-npm/cli` | Engineering |
| NPM-006 | Blocklist schema | JSON schema for blocks, warns, expires; validation lib | NPM-002 | S | `@better-npm/blocklist` package | Engineering |
| NPM-007 | Intel ingestion worker | Cron job normalizing feeds → blocklist bundles; S3/CDN upload | NPM-002, NPM-006 | L | Worker deploying hourly bundles | Engineering |
| NPM-008 | Install-time block gate | Arborist hook; block before extract; actionable errors | NPM-005, NPM-007 | L | Gate with 10 test cases | Engineering |
| NPM-009 | Lifecycle script policy | allowlist/block/warn modes; integrate with install gate | NPM-008 | M | Policy engine + docs | Engineering |
| NPM-010 | `.better-npmrc` parser | INI parser; merge with project + org policy | NPM-008 | M | Parser with zod validation | Engineering |
| NPM-011 | `bnpm init` command | Scaffold `.better-npmrc`, GitHub Action stub, README snippet | NPM-010 | S | Interactive init command | Engineering |
| NPM-012 | Emergency deprecate TUI | Terminal UI for rapid deprecate + network push | NPM-005 | L | `bnpm emergency-deprecate` | Engineering |
| NPM-013 | Advisory generator | Template GHSA/OSV advisory from incident metadata | NPM-012 | M | Markdown + JSON export | Engineering |
| NPM-014 | Pipeline audit command | Dry-run install from lockfile; SARIF output | NPM-001 | L | `bnpm audit-pipeline` | Engineering |
| NPM-015 | GitHub Action v1 | Action running audit + block check on PRs | NPM-008, NPM-010 | L | `better-npm/action` on Marketplace | Engineering |
| NPM-016 | Docs site | Astro/Starlight site: install, config, API reference | NPM-005 | M | docs.betternpm.dev live | Design |
| NPM-017 | Brand + domain | Logo, wordmark, domain registration, social handles | — | S | Brand kit + domain | GTM |
| NPM-018 | Telemetry (opt-in) | Anonymous install events; privacy policy; off by default | NPM-008 | M | Telemetry module + policy page | Legal |
| NPM-019 | Publish wizard v1 | Interactive `bnpm publish` with preview | NPM-014 | L | Publish flow E2E test | Engineering |
| NPM-020 | Tarball diff engine | Compare pack tarballs; highlight scripts, deps, files | NPM-019 | L | Diff report formatter | Engineering |
| NPM-021 | Staged approve helper | CI token approval gate before publish | NPM-019 | M | GitHub Action for publish approve | Engineering |
| NPM-022 | pnpm/yarn shim | Policy hooks exporting same blocklist to other PMs | NPM-008 | L | `@better-npm/pnpm-hook` | Engineering |
| NPM-023 | Control plane API | REST API: orgs, policies, API keys | NPM-010 | L | API v0 deployed | Engineering |
| NPM-024 | Dashboard MVP | Web UI for policies, block events, team mgmt | NPM-023 | L | app.betternpm.dev | Design |
| NPM-025 | Registry proxy PoC | HTTPS proxy with policy enforce + cache | NPM-023 | L | Docker image + deploy guide | Engineering |
| NPM-026 | Stripe billing | Checkout, seat-based subs, webhook handlers | NPM-024 | M | Billing live for Team tier | GTM |
| NPM-027 | Slack webhook integration | Alert on block events; configurable channels | NPM-024 | M | Slack app + docs | Engineering |
| NPM-028 | Maintainer outreach campaign | Email 200 maintainers; offer publish wizard early access | NPM-016, NPM-019 | M | 15% reply rate | GTM |
| NPM-029 | Launch content pack | Blog post, HN post, demo video script, tweet thread | NPM-016, NPM-014 | M | Launch assets published | GTM |
| NPM-030 | Third-party pen test | Engage firm for CLI + API; remediate findings | NPM-025 | L | Pen test report + fixes | Legal |
| NPM-031 | SOC 2 readiness | Policies, access controls, evidence collection | NPM-023 | L | SOC 2 Type I audit scheduled | Legal |
| NPM-032 | Sigstore verify module | Verify provenance on install/publish | NPM-003 | M | `@better-npm/sigstore` | Engineering |

**Critical path:** NPM-001 → NPM-004 → NPM-005 → NPM-008 → NPM-019 → NPM-025

---

## 15. Open Questions & Decision Points

| # | Question | Options | Decision deadline | Owner |
|---|----------|---------|-------------------|-------|
| 1 | Fork vs wrap npm CLI? | Wrap (lower maintenance) vs fork (full control) | Week 2 | CTO |
| 2 | Blocklist false positive policy? | Warn-first 30 days vs block-first | Week 4 | CEO + Security |
| 3 | Rust vs TS for diff engine? | Rust performance vs TS velocity | Week 8 | CTO |
| 4 | Registry proxy: MITM CA vs npm Enterprise API? | Enterprise CA install vs partnership | Week 10 | CTO |
| 5 | Free tier feed delay? | 24h vs 7d delay for OSS users | Week 6 | CEO |
| 6 | Maintainer network effect? | Free emergency deprecate for all vs paid | Week 5 | CEO |
| 7 | pnpm shim priority? | v0.5 vs v1.0 | Week 7 | Product |
| 8 | Agent policy schema standard? | Propose to Agentic AI Foundation vs proprietary | Month 4 | CTO |
| 9 | Open-core vs open CLI only? | Dashboard proprietary (chosen) vs full OSS | Week 1 | CEO |
| 10 | Fundraising vs bootstrap? | Raise seed at v0.1 traction vs revenue-first | Week 12 | CEO |

---

*Document version: 1.0 — Generated for autonomous agent execution.*
