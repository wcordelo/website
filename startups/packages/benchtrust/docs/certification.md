# BenchTrust Certification Program

**Task ID:** BENCH-030

---

## Overview

**BenchTrust Certified** is a third-party validation badge for AI coding agents and models that meet rigorous evaluation standards on private holdout tasks.

---

## Requirements

### Initial Certification

1. **Eval completion** on current vault version + latest weekly drop (BENCH-022).
2. **Contamination audit pass** — CRS below 5%; zero canary leaks.
3. **Sealed runtime compliance** — all runs in network-isolated environment.
4. **Reward-hack clearance** — no unresolved trajectory flags.
5. **Scorecard delivery** — signed report with pass@k CIs and methodology hash.

### Badge Usage Rights

- Display "BenchTrust Certified" mark on marketing materials.
- Cite specific pass@k scores with vault version and eval date.
- Link to methodology manifesto (BENCH-002).

### Prohibited Claims

- Certifying on subset of tasks only.
- Combining BenchTrust scores with non-audited internal metrics.
- Implying certification covers domains not evaluated.

---

## Renewal

- **Annual re-certification** required.
- Must re-run on updated vault (includes new weekly drops).
- Failure to renew within 90 days → badge revocation.

---

## Tiers

| Level | Criteria |
|-------|----------|
| **Certified** | Meets all requirements above |
| **Certified Plus** | pass@10 ≥ 40% on wide tasks + enterprise vertical pack |
| **Certified Enterprise** | Custom holdout slice + dedicated contamination audit |

---

## Appeals Process

1. Submit trajectory logs within 14 days of flag.
2. Independent review by methodology advisory board.
3. Decision within 30 days.

---

*Certification handbook v0.1 — BenchTrust Product*
