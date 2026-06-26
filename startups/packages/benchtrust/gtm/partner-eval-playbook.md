# First Partner Eval Playbook

**Task ID:** BENCH-019  
**Prerequisites:** BENCH-010–013, BENCH-018 LOI signed  
**Deliverable:** Procurement-ready scorecard delivered to design partner

---

## Overview

End-to-end eval workflow from partner onboarding through scorecard delivery. First partner target: **Acme Corp** (anonymized in public materials).

---

## Phase 1: Onboarding (Week 1)

| Step | Owner | Artifact |
|------|-------|----------|
| Execute NDA + data license | Legal | Signed agreement |
| Collect repo access credentials | Partner success | Secure vault handoff |
| Register partner in vault ACL | Platform | `licenseId: partner-acme-001` |
| Kickoff call (60 min) | GTM + ML lead | Scope doc: model version, k=10, 50 tasks |

**Checklist:**
- [ ] Model identifier and version pinned
- [ ] Training cutoff date documented (`modelCutoff` temporal tag)
- [ ] Agent adapter confirmed (BENCH-016 SDK or reference scaffold)
- [ ] Canary strings assigned (BENCH-008)

---

## Phase 2: Task Curation (Week 2)

| Step | Owner | Artifact |
|------|-------|----------|
| Extract candidates from licensed repos | Pipeline (BENCH-003) | 80 candidates |
| Auto-validate (BENCH-004) | Pipeline | ≥95% precision filter |
| Human QA — 3-reviewer workflow (BENCH-006) | Operations | 50 approved tasks |
| Classify narrow/wide (BENCH-005) | Pipeline | Scope tags |
| Store in holdout vault (BENCH-007) | Platform | Encrypted `.vault` blobs |

**Target mix:** 38 narrow / 12 wide tasks; Python + TypeScript.

---

## Phase 3: Eval Execution (Week 3)

| Step | Owner | Artifact |
|------|-------|----------|
| Configure sealed runtime (BENCH-009) | Platform | Docker spec per task |
| Run 16 attempts per task (BENCH-010) | Orchestrator | `run-partner-acme-2026q2` |
| Compute pass@k + CIs (BENCH-011) | Stats engine | pass@1, pass@5, pass@10 |
| Classify trajectories (BENCH-017) | Contamination | Reward-hack flags |
| Run contamination audit (BENCH-013) | Audit agent | CRS report |

**API:** `POST /v1/runs` with `model: acme-coding-agent-v2.4`, `runsPerTask: 16`.

---

## Phase 4: Scorecard Delivery (Week 4)

| Step | Owner | Artifact |
|------|-------|----------|
| Generate scorecard (BENCH-012) | Product | JSON, HTML, Markdown |
| Internal QA review | ML lead | Sign-off checklist |
| Partner readout (60 min) | GTM + ML | Walkthrough deck |
| Deliver final package | Partner success | Secure portal upload |

**Sample delivered scorecard:** `data/sample-reports/partner-acme-scorecard.json`

---

## Scorecard Contents

1. Model identifier and eval date
2. pass@k (k=1, 5, 10) with Wilson and bootstrap CIs
3. Narrow vs. wide breakdown
4. Failure mode taxonomy counts (BENCH-031)
5. Contamination audit summary (CRS, canary leaks)
6. Reward-hack rate
7. Methodology version hash
8. Vault version

---

## Partner Readout Agenda

1. Methodology overview (10 min)
2. Aggregate results — no raw tasks (20 min)
3. Failure mode deep-dive (15 min)
4. Contamination findings (10 min)
5. Certification path (BENCH-030) (5 min)

---

## Escalation Paths

| Issue | Escalation |
|-------|------------|
| Vault access failure | Platform on-call |
| Reward-hack dispute | ML lead + trajectory review |
| CRS above threshold | Re-run with expanded audit |
| Partner requests raw tasks | Legal — prohibited by license |

---

## Post-Delivery

- Request testimonial (anonymized OK)
- Offer annual subscription ($75K/year)
- Feed results into whitepaper (BENCH-026) with partner approval
- Export to partner W&B project (BENCH-027) if requested

---

*BenchTrust GTM — BENCH-019*
