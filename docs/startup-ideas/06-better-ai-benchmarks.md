# Better AI Benchmarks (`BenchTrust`) — Execution Plan

**Working name:** BenchTrust  
**Priority signal:** Trust infrastructure, B2B  
**Task prefix:** `BENCH-001` through `BENCH-032`

---

## 1. Executive Summary

AI benchmarks are broken. Models are evaluated on leaked training data, narrow synthetic tasks that don't predict real-world performance, reward-hacking through tool misuse, and leaderboard optimization that inverts the moment benchmarks go public. Enterprises buying AI coding agents and platforms have **no trusted third party** to answer: "Will this model actually work on *our* codebase, under *our* constraints, without gaming the metric?"

**BenchTrust** is **trust infrastructure for AI evaluation**—a B2B platform that produces defensible, contamination-resistant benchmark scores for coding agents and LLMs. Core innovations: a **private holdout vault** of never-published real-world tasks, **temporal decontamination** tagging, **sealed Docker runtimes** that prevent reward hacking, **pass@k statistics** with rigorous multi-run orchestration, and a **contamination audit agent** that detects train-test leakage.

Unlike academic leaderboards (HumanEval, SWE-bench) optimized for publication, BenchTrust is optimized for **procurement decisions**: "Model A vs Model B on private holdout set X, audited methodology, signed scorecard."

**Why now:** Enterprise AI spend is exploding; SWE-bench contamination scandals eroded trust; agents need eval beyond single-shot code gen; regulated buyers need audit trails; BenchTrust synergizes with bgit (session data) and Better Slack (agent workflows).

**90-day goal:** Methodology whitepaper; holdout vault v0; first design partner eval; published scorecard for 2 reference agents.

---

## 2. Problem Statement & Evidence

### The core problem

AI benchmark scores do not predict real-world performance—and buyers know it. Without trusted evaluation, enterprises either over-pay for hyped models or under-adopt capable ones.

### Evidence

| Signal | Data point |
|--------|------------|
| Contamination | SWE-bench, HumanEval, MBPP show **10–30%** performance drops on held-out variants |
| Leaderboard gaming | Models fine-tuned on benchmark artifacts; **pass@1** reported without variance |
| Agent complexity | Single-shot codegen ≠ multi-step agent with tools |
| Enterprise gap | **Gartner:** 60% of AI projects fail; poor eval cited as top cause |
| Reward hacking | Agents delete tests, modify graders, infinite loops to "pass" |
| Procurement need | Fortune 500 legal/compliance requires documented eval methodology |

### Failure modes of current benchmarks

| Benchmark | Failure |
|-----------|---------|
| HumanEval | Memorized solutions; narrow Python functions |
| SWE-bench | GitHub issues in training data; cherry-picked subsets |
| LiveBench | Better, but public; still gamed |
| Internal evals | Not comparable; no third-party audit |
| Vendor benchmarks | Conflict of interest |

### Jobs to be done

1. **Evaluate agents on realistic tasks** not in any training corpus.
2. **Prove no contamination** with audit trail.
3. **Measure pass@k with confidence intervals** — not single lucky runs.
4. **Detect reward hacking** in agent trajectories.
5. **Produce procurement-ready scorecards** for legal/finance sign-off.

---

## 3. Target Customer Profiles (ICP)

### Primary ICP: Enterprise AI platform buyers

| Attribute | Detail |
|-----------|--------|
| Size | 500+ employees; platform/engineering teams |
| Trigger | AI agent vendor selection; failed pilot |
| Buyer | VP Engineering + procurement + security |
| Budget | $50K–$500K/year for eval infrastructure |
| Need | Third-party scorecard for board/compliance |

### Secondary ICP: AI model vendors (Anthropic, OpenAI, startups)

| Attribute | Detail |
|-----------|--------|
| Pain | Need credible third-party validation |
| Offer | Certified eval runs on holdout vault |
| Monetization | Per-eval fee + certification badge |

### Tertiary ICP: AI agent startups

| Attribute | Detail |
|-----------|--------|
| Pain | Need differentiation vs competitors |
| Offer | BenchTrust-certified scores for marketing |
| Expansion | Continuous eval in CI |

### Anti-ICP

- Hobbyists wanting free leaderboards.
- Teams without agent/LLM budget.
- Researchers needing public datasets only (different product).

---

## 4. Competitive Landscape & Differentiation Matrix

| Capability | SWE-bench | LiveBench | Braintrust | W&B | **BenchTrust** |
|------------|-----------|-----------|------------|-----|----------------|
| Private holdout vault | ✗ | ✗ | partial | partial | **✓** |
| Contamination audit | partial | partial | ✗ | ✗ | **✓** |
| Sealed runtime (anti-hack) | partial | partial | ✗ | ✗ | **✓** |
| pass@k + confidence intervals | partial | partial | ✓ | ✓ | **✓** |
| Agent trajectory analysis | partial | ✗ | partial | partial | **✓** |
| Procurement scorecard | ✗ | ✗ | partial | partial | **✓** |
| Temporal decontamination | ✗ | partial | ✗ | ✗ | **✓** |
| Third-party trust brand | academic | academic | vendor | vendor | **✓ (target)** |

### Differentiation thesis

1. **Trust brand** — methodology manifesto as moat.
2. **Holdout vault** — tasks never published; canary strings detect leaks.
3. **Anti-gaming runtime** — sealed Docker; no network; grader isolation.
4. **B2B procurement** — not leaderboard clicks; signed PDF scorecards.

---

## 5. Product Vision & MVP Scope

### Vision (3-year)

BenchTrust is the **Moody's of AI evaluation**—when an enterprise asks "is this model good?", the answer is a BenchTrust scorecard.

### v0.1 — "Methodology + vault" (Weeks 1–6)

| Feature | Description |
|---------|-------------|
| Methodology manifesto | Public trust framework |
| Task extraction pipeline v0 | Mine real tasks from licensed sources |
| Auto task validator | Ensure tasks are solvable, scoped |
| Narrow/wide test classifier | Tag task types |
| Human QA workflow | Expert review of extracted tasks |
| Private holdout vault | Encrypted storage; access controls |
| Canary string system | Detect leakage if tasks appear online |

### v0.5 — "Run and score" (Weeks 7–12)

| Feature | Description |
|---------|-------------|
| Sealed Docker runtime | Isolated agent execution |
| Multi-run orchestrator | N runs per task |
| pass@k statistics engine | Confidence intervals |
| Scorecard report generator | PDF/HTML procurement docs |
| Contamination audit agent | Scan training corpora for overlap |
| Reference agent scaffold | Baseline for comparison |
| First design partner eval | End-to-end pilot |

### v1.0 — "Platform" (Months 4–6)

| Feature | Description |
|---------|-------------|
| API v0 + Dashboard | Self-serve eval submission |
| Weekly task drop pipeline | Fresh holdout tasks |
| Certification program | "BenchTrust Certified" badge |
| W&B / Braintrust integration | Export to existing tools |
| Enterprise vertical scoping | Finance, healthcare task packs |
| Whitepaper + Summit | Category creation |

---

## 6. Technical Architecture

### System diagram

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Task Extract │────►│ Holdout Vault   │────►│ Sealed       │
│ Pipeline     │     │ (encrypted)     │     │ Runtime      │
└──────────────┘     └─────────────────┘     └──────┬───────┘
                                                    │
┌──────────────┐     ┌─────────────────┐           ▼
│ Contamination│     │ Multi-run       │     ┌──────────────┐
│ Audit Agent  │     │ Orchestrator    │────►│ pass@k Stats │
└──────────────┘     └─────────────────┘     └──────┬───────┘
                                                    ▼
                                            ┌──────────────┐
                                            │ Scorecard    │
                                            │ Generator    │
                                            └──────────────┘
```

### Holdout vault

- **Storage:** S3 with client-side encryption; KMS for keys.
- **Access:** Eval workers get time-limited tokens; tasks decrypted in sealed runtime only.
- **Canary strings:** Unique watermarks per partner eval; monitored via search APIs.
- **Temporal tags:** `created_after: 2025-01-01` for decontamination filters.

### Task extraction pipeline (BENCH-003)

1. Ingest licensed repos (partner agreements), issue trackers, PR descriptions.
2. Extract closed tasks with tests.
3. Validator checks: tests pass, scope bounded, no secrets.
4. Classifier: narrow (single file) vs wide (multi-file refactor).
5. Human QA samples 10%.

### Sealed Docker runtime (BENCH-009)

- No network egress.
- Read-only filesystem except `/workspace`.
- Grader runs in separate container; agent cannot modify tests.
- Resource limits: CPU, memory, time.
- Trajectory logging for reward-hack detection.

### pass@k orchestrator (BENCH-010, BENCH-011)

- Run k attempts per task (default k=10 for agents).
- Compute pass@1, pass@5, pass@10 with bootstrap confidence intervals.
- Stratify by narrow/wide, language, domain.

### Contamination audit agent (BENCH-013)

- Embed task text; search public corpora (The Pile snapshots, GitHub, Common Crawl samples).
- Flag >85% similarity matches.
- Temporal decontamination: exclude tasks predating model cutoff from "fair" sets.

### Reward-hacking classifier (BENCH-017)

Trajectory signals:
- Test file modifications.
- Grader process signals.
- Infinite loops / timeout patterns.
- Deleting assertions.

---

## 7. Core Features Deep Dive

### 7.1 Methodology manifesto (BENCH-002)

Public document defining:
- What BenchTrust measures (and doesn't).
- Holdout policy.
- Statistical standards (pass@k, CI levels).
- Conflict of interest policy (no vendor-owned tasks in public sets).

This is the **trust brand**—like academic peer review standards.

### 7.2 Private holdout vault

Tasks are never published. Partners receive:
- Aggregate scores only.
- Optional per-category breakdown.
- No raw task export.

Leak detection via canaries triggers contract review.

### 7.3 Scorecard report

Procurement-ready PDF:
- Model/agent identifier.
- Eval date, vault version.
- pass@k by category with CIs.
- Contamination audit summary.
- Reward-hack flags.
- Methodology version hash.
- Digital signature.

### 7.4 Reference agent scaffold (BENCH-015)

Standard agent harness:
- Tool set: read, write, bash (sandboxed).
- Adapter SDK for custom agents (BENCH-016).
- Ensures apples-to-apples comparison.

### 7.5 Weekly task drop (BENCH-022)

Fresh holdout tasks added weekly:
- Prevents overfitting to static vault.
- Partners on subscription get eval on latest drop.

### 7.6 Certification program (BENCH-030)

"BenchTrust Certified" requirements:
- Eval on current vault + drop.
- Contamination audit pass.
- No unresolved reward-hack flags.
- Annual re-certification.

### 7.7 Failure mode taxonomy (BENCH-031)

Standardized categories:
- Wrong approach.
- Partial fix.
- Test hack.
- Timeout.
- Tool misuse.
- Hallucinated API.

Enables cross-model comparison beyond pass/fail.

---

## 8. Go-to-Market Strategy

### Phase 1: Thought leadership (Months 1–3)

- Publish methodology manifesto.
- "SWE-bench is contaminated" analysis (rigorous, not clickbait).
- Design partner outreach (BENCH-018): 3 enterprises + 2 vendors.

### Phase 2: First partner eval (Months 3–5)

- Run full eval for design partner (BENCH-019).
- Whitepaper with anonymized results (BENCH-026).
- Case study: "How we chose our coding agent."

### Phase 3: Platform + certification (Months 6–12)

- API + dashboard for self-serve.
- Certification program launch.
- Benchmark Trust Summit (BENCH-029).
- Enterprise vertical packs (finance, healthcare).

### Messaging

> "Leaderboards lie. BenchTrust proves it—with math, holdouts, and sealed runtimes."

### Synergies

- **bgit:** Session logs as task extraction source (with consent).
- **Better Slack:** Agents evaluated in realistic team workflows.
- **bnpm:** Supply chain tasks in benchmark vault.

---

## 9. Business Model & Pricing Tiers

### Eval-as-a-service

| Tier | Price | Includes |
|------|-------|----------|
| Single eval | $15K | One agent/model, current vault, scorecard |
| Annual subscription | $75K/year | Quarterly evals, weekly drops, contamination audit |
| Enterprise | $200K+/year | Custom vertical tasks, dedicated holdout slice, SLA |
| Vendor certification | $50K/cert | Public badge, marketing rights |

### Data licensing (future)

- Anonymized task distributions to researchers (not holdout vault).
- Vertical task packs for internal eval.

**Year 1 target:** 4 single evals + 2 annual subs = **$210K ARR**.

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vault leak | Low | Existential | Encryption, canaries, legal agreements |
| Methodology dispute | Medium | High | Transparent manifesto; advisory board |
| SWE-bench fixes contamination | Medium | Medium | Holdout + temporal tags remain differentiated |
| Slow enterprise sales | High | Medium | Vendor-side evals faster cycle |
| Task extraction legal issues | Medium | High | Partner licenses only; legal review |
| Reward-hack arms race | High | Medium | Continuous classifier updates |
| Braintrust/W&B add holdouts | Medium | High | Trust brand + certification moat |

---

## 11. Success Metrics

### North star

**Procurement decisions influenced by BenchTrust scorecards.**

### 90-day targets

| Metric | Target |
|--------|--------|
| Holdout vault tasks | 500 (QA'd) |
| Design partners signed | 3 |
| Completed partner evals | 1 |
| Methodology manifesto downloads | 1,000 |
| Contamination flags (validation) | Detect 90%+ known leaks in test set |

### 12-month targets

| Metric | Target |
|--------|--------|
| ARR | $210K |
| Certified agents/models | 5 |
| Enterprise annual subs | 4 |
| Vault tasks | 2,000 |
| Whitepaper citations | 10 |

---

## 12. Team & Skills Required

| Role | Skills |
|------|--------|
| **ML eval lead** | Benchmark design, statistics, contamination research |
| **Platform engineer** | Docker isolation, orchestration, API |
| **Security/compliance** | SOC 2, vault architecture, procurement |
| **GTM / founder** | Enterprise sales, thought leadership |

Minimum: 2 engineers + 1 ML researcher + founder with enterprise network.

Advisory board: academic ML + enterprise procurement veteran.

---

## 13. 90-Day Execution Roadmap

### Weeks 1–2: Research foundation

- BENCH-001 competitive intel dossier.
- BENCH-002 methodology manifesto draft.
- BENCH-007 private holdout vault scaffold.
- BENCH-023 pricing & packaging.
- **Milestone:** Manifesto published; vault encrypted.

### Weeks 3–4: Task pipeline

- BENCH-003 task extraction pipeline v0.
- BENCH-004 auto task validator.
- BENCH-005 narrow/wide classifier.
- BENCH-006 human QA workflow.
- BENCH-014 temporal decontamination tags.
- **Milestone:** 100 tasks in vault.

### Weeks 5–6: Runtime foundation

- BENCH-008 canary string system.
- BENCH-009 sealed Docker runtime.
- BENCH-015 reference agent scaffold.
- BENCH-016 scaffold adapter SDK.
- **Milestone:** First agent run completes in sealed runtime.

### Weeks 7–8: Orchestration + stats

- BENCH-010 multi-run orchestrator.
- BENCH-011 pass@k statistics engine.
- BENCH-017 reward-hacking classifier v0.
- BENCH-031 failure mode taxonomy draft.
- **Milestone:** pass@10 report for reference agent.

### Weeks 9–10: Audit + scorecard

- BENCH-013 contamination audit agent.
- BENCH-012 scorecard report generator.
- BENCH-018 design partner outreach (ongoing).
- **Milestone:** Scorecard PDF generated.

### Weeks 11–12: Partner eval + launch

- BENCH-019 first partner eval (full E2E).
- BENCH-020 API v0; BENCH-021 dashboard v0.
- BENCH-024 SOC 2 readiness assessment.
- BENCH-026 whitepaper publication.
- BENCH-025 enterprise vertical scoping.
- **Milestone:** Partner scorecard delivered; whitepaper live.

---

## 14. AGENT TASK LIST

| ID | Title | Description | Dependencies | Effort | Deliverable | Category |
|----|-------|-------------|--------------|--------|-------------|----------|
| BENCH-001 | Competitive intelligence dossier | SWE-bench, LiveBench, Braintrust, W&B, HELM analysis | — | M | Competitive doc | Research |
| BENCH-002 | Methodology manifesto draft | Public trust framework document | BENCH-001 | M | Published manifesto | GTM |
| BENCH-003 | Task extraction pipeline v0 | Extract tasks from licensed partner repos | — | L | Extraction pipeline | Engineering |
| BENCH-004 | Auto task validator | Verify solvability, scope, test presence | BENCH-003 | L | Validator with 95% precision | Engineering |
| BENCH-005 | Narrow/wide test classifier | ML classifier for task complexity | BENCH-004 | M | Classifier model | Engineering |
| BENCH-006 | Human QA workflow | Expert review queue for extracted tasks | BENCH-004 | M | QA tool + process doc | Operations |
| BENCH-007 | Private holdout vault | Encrypted storage, access control, audit log | — | L | Vault service deployed | Engineering |
| BENCH-008 | Canary string system | Unique watermarks per eval; leak monitoring | BENCH-007 | M | Canary monitor job | Engineering |
| BENCH-009 | Sealed Docker runtime | Network-isolated agent execution environment | BENCH-007 | L | Runtime image + docs | Engineering |
| BENCH-010 | Multi-run orchestrator | Schedule k runs per task across workers | BENCH-009 | L | Orchestrator service | Engineering |
| BENCH-011 | pass@k statistics engine | Bootstrap CIs for pass@1/5/10 | BENCH-010 | M | Stats library | Engineering |
| BENCH-012 | Scorecard report generator | PDF/HTML procurement reports | BENCH-011 | M | Scorecard template | Product |
| BENCH-013 | Contamination audit agent | Embedding search against public corpora | BENCH-007 | L | Audit agent + report | Engineering |
| BENCH-014 | Temporal decontamination tags | Tag tasks with creation dates for fair eval | BENCH-003 | S | Tag schema | Engineering |
| BENCH-015 | Reference agent scaffold | Baseline agent for benchmark comparison | BENCH-009 | M | Reference agent repo | Engineering |
| BENCH-016 | Scaffold adapter SDK | Adapter for custom agent integration | BENCH-015 | M | SDK npm package | Engineering |
| BENCH-017 | Reward-hacking trajectory classifier | Detect test modification, grader attacks | BENCH-009, BENCH-010 | L | Classifier + labeled set | Engineering |
| BENCH-018 | Design partner outreach | 3 enterprises + 2 vendors for pilot evals | BENCH-002 | M | 5 signed LOIs | GTM |
| BENCH-019 | First partner eval | Full E2E eval for design partner | BENCH-010–013, BENCH-018 | L | Delivered scorecard | GTM |
| BENCH-020 | API v0 | REST API for eval submission and results | BENCH-012 | M | API deployed | Engineering |
| BENCH-021 | Dashboard v0 | Web UI for eval status and scorecards | BENCH-020 | L | Dashboard live | Product |
| BENCH-022 | Weekly task drop pipeline | Automated weekly holdout additions | BENCH-006, BENCH-007 | M | Cron pipeline | Operations |
| BENCH-023 | Pricing & packaging | Tier definitions, contracts template | BENCH-001 | S | Pricing page | Business |
| BENCH-024 | SOC2 readiness assessment | Security policies for vault and runtime | BENCH-007 | M | SOC 2 gap analysis | Compliance |
| BENCH-025 | Enterprise vertical scoping | Finance/healthcare task pack requirements | BENCH-018 | M | Vertical scoping docs | GTM |
| BENCH-026 | Whitepaper publication | Partner eval results + methodology | BENCH-019, BENCH-002 | M | Published whitepaper | GTM |
| BENCH-027 | W&B / Braintrust integration | Export results to existing MLOps tools | BENCH-020 | M | Integration docs | Engineering |
| BENCH-028 | Second language expansion | Add TypeScript/Java tasks beyond Python | BENCH-003, BENCH-006 | L | 200 non-Python tasks | Engineering |
| BENCH-029 | Benchmark Trust Summit | Virtual event for category creation | BENCH-026 | M | Summit with 100+ attendees | GTM |
| BENCH-030 | Certification program design | Badge requirements, renewal process | BENCH-012, BENCH-013 | M | Certification handbook | Product |
| BENCH-031 | Failure mode taxonomy | Standardized error categories for reports | BENCH-010, BENCH-017 | M | Taxonomy doc + labels | Research |
| BENCH-032 | Procurement compliance pack | Security questionnaire, DPA, SLA templates | BENCH-024 | S | Compliance zip | Compliance |

**Critical path:** BENCH-001 → BENCH-007 → BENCH-009 → BENCH-010 → BENCH-019

---

## 15. Open Questions & Decision Points

| # | Question | Options | Deadline | Owner |
|---|----------|---------|----------|-------|
| 1 | Vault task sources? | Partner licenses only vs synthetic mix | Week 2 | CEO |
| 2 | Public leaderboard at all? | No public leaderboard (chosen) | Week 1 | CEO |
| 3 | Default k for pass@k? | k=10 for agents, k=5 for models | Week 7 | ML lead |
| 4 | Python-only v0 vs multi-language? | Python v0; BENCH-028 in v1 | Week 3 | Product |
| 5 | Vendor eval conflict policy? | Separate vault slice per vendor | Week 4 | Legal |
| 6 | Canary leak response? | Automatic partner notification + investigation | Week 5 | Security |
| 7 | Open source runtime? | Runtime OSS; vault proprietary | Week 6 | CEO |
| 8 | Academic advisory board? | 3 academics for methodology credibility | Week 8 | CEO |
| 9 | Integration vs compete with Braintrust? | Integrate (chosen) | Week 10 | GTM |
| 10 | Fundraising before first eval? | Raise after BENCH-019 scorecard | Week 12 | CEO |

---

*Document version: 1.0 — Generated for autonomous agent execution.*
