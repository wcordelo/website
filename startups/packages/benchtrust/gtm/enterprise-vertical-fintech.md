# Enterprise Vertical Scoping — Fintech

**Task ID:** BENCH-025  
**Segment:** Financial services / payments / trading  
**Deliverable:** Discovery SOW template + task pack requirements

---

## Executive Summary

Fintech enterprises require coding agent evals that reflect **regulatory constraints**, **precision-critical numeric handling**, and **high-stakes API correctness**. This document scopes a BenchTrust vertical task pack for design partners in financial services.

---

## Discovery SOW Template

### Statement of Work — Fintech Vertical Task Pack

**Between:** BenchTrust, Inc. ("Provider")  
**And:** ______________________ ("Client")  
**Effective Date:** ______________________

#### 1. Scope

Provider will design and deliver a **fintech holdout task pack** comprising 100–200 privately licensed software engineering tasks sourced from Client-approved repositories or Provider fintech partner network.

#### 2. Task Categories

| Category | % of Pack | Examples |
|----------|-----------|----------|
| Payment processing | 25% | Idempotency keys, settlement reconciliation |
| API schema / validation | 20% | Zod/OpenAPI, ISO date handling, bigint serialization |
| Auth / compliance | 20% | JWT middleware, audit logging, PII redaction |
| Trading / routing | 15% | Order router refactors, venue strategy patterns |
| Infrastructure | 20% | WebSocket reliability, rate limiting, cache coherency |

#### 3. Languages

- Primary: **TypeScript** (Node.js services)
- Secondary: **Python** (data pipelines, risk models)
- Optional: Java (legacy core banking) — Phase 2

#### 4. Deliverables

| # | Deliverable | Timeline |
|---|-------------|----------|
| 1 | Task extraction from licensed repos | Week 2–4 |
| 2 | Human QA (3-reviewer) on all tasks | Week 4–6 |
| 3 | Vault storage with fintech `licenseId` slice | Week 6 |
| 4 | Baseline eval (reference agent) | Week 7 |
| 5 | Client agent eval + scorecard | Week 8–10 |

#### 5. Compliance Requirements

- Tasks never published in raw form
- SOC 2 Type I controls per `docs/soc2-readiness.md` (BENCH-024)
- Data Processing Agreement (DPA) — see `docs/procurement-pack.md`
- Canary monitoring per partner eval (BENCH-008)
- Temporal tags with `modelCutoff` for fair comparison

#### 6. Pricing

| Tier | Price | Includes |
|------|-------|----------|
| Vertical pack setup | $50K one-time | 100 tasks, dedicated vault slice |
| Annual eval subscription | $200K/year | Quarterly evals, weekly drops, SLA |
| Add-on: trading desk pack | $30K | 50 additional wide-scope tasks |

#### 7. Acceptance Criteria

- ≥95% auto-validator precision (BENCH-004)
- 100% tasks pass 3-reviewer QA (BENCH-006)
- Scorecard delivered with pass@10 + contamination audit
- Client sign-off on task representativeness survey

#### 8. Term

12 months from Effective Date, with annual renewal for vault access and weekly drops.

---

## Task Pack Requirements

### Must-Have Properties

1. **Solvable in sealed runtime** — no external market data feeds
2. **Deterministic tests** — no flaky integration dependencies
3. **No live credentials** — synthetic fixtures only
4. **Temporal tags** — `createdAt` post model training cutoff
5. **Narrow/wide classification** — wide tasks ≤20% of pack

### Sample Tasks (TypeScript)

Reference tasks in `data/sample-tasks/ts-*.json`:

- `ts-001` — async race in request deduplicator
- `ts-002` — Zod ISO date validation
- `ts-004-wide` — order router strategy refactor
- `ts-005` — bigint JSON serialization

### Excluded Content

- Proprietary trading algorithms (Client may redact)
- Customer PII or account numbers
- Unlicensed third-party API schemas

---

## Discovery Questions

1. Which agent/model candidates are you evaluating?
2. What repos can you license for holdout extraction?
3. Regulatory frameworks applicable? (SOC 2, PCI-DSS, GDPR)
4. Required languages and frameworks?
5. Procurement timeline and budget authority?
6. Internal baseline metrics today? (pass@1 on public benchmarks?)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Tasks in fintech pack | 100+ |
| Partner eval completed | 1 within 90 days |
| Enterprise annual sub | 1 signed |
| Procurement decisions influenced | 2 |

---

*BenchTrust GTM — BENCH-025*
