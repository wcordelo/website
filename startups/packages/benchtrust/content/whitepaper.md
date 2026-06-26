# Trustworthy AI Coding Agent Evaluation

## A Methodology for Enterprise Procurement

**BenchTrust Whitepaper v0.1**  
**Task ID:** BENCH-026  
**Authors:** BenchTrust Research  
**Date:** June 2026

---

## Abstract

Enterprise teams are adopting AI coding agents without defensible evaluation methodology. Public benchmarks like SWE-bench suffer from training-data contamination, single-shot reporting, and porous runtimes that enable reward hacking. This whitepaper presents the BenchTrust evaluation framework: private holdout vaults, sealed runtimes, pass@k statistics with confidence intervals, contamination auditing, and trajectory-based reward-hack detection. We report anonymized results from a design partner eval demonstrating the framework in production.

---

## 1. Introduction

The gap between vendor claims and procurement reality is widening. A model scoring 50% on a public leaderboard may perform at 30% on private holdouts — or higher, if the public set was memorized. **Procurement teams need evaluation they can defend in audit committees.**

BenchTrust provides:
1. **Private holdouts** never published in raw form
2. **Sealed runtimes** with network isolation
3. **Statistical rigor** — pass@k with Wilson and bootstrap CIs
4. **Contamination auditing** — CRS scores and canary monitoring
5. **Procurement-ready scorecards** — signed, versioned, auditable

---

## 2. Related Work

| System | Strength | Limitation |
|--------|----------|------------|
| SWE-bench | Large public corpus | Contamination risk; static |
| LiveBench | Fresh tasks | Not holdout; limited enterprise fit |
| Braintrust | Eval observability | No sealed runtime or vault |
| Weights & Biases | Experiment tracking | No benchmark trust layer |

BenchTrust integrates with W&B (BENCH-027) rather than replacing MLOps tooling.

---

## 3. Methodology

### 3.1 Holdout Vault

Tasks are sourced exclusively from licensed partner repositories. Each task is encrypted (AES-256-GCM), tagged with temporal metadata (`createdAt`, `modelCutoff`), and stored in an append-only audit log. See methodology manifesto (BENCH-002).

### 3.2 Sealed Runtime

Agents execute in Docker containers with:
- `networkMode: none` — no egress
- Read-only root filesystem except `/workspace`
- Grader sidecar — tests inaccessible to agent

### 3.3 pass@k Statistics

For n independent samples per task with c successes:

$$\text{pass@k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}$$

We report k ∈ {1, 5, 10} with:
- **Wilson score intervals** at task level
- **Bootstrap intervals** on aggregated pass@k estimates
- Minimum 16 runs per task (v0.1 default)

### 3.4 Contamination Audit

**Contamination Regurgitation Score (CRS):** embedding similarity against public corpora. Canary strings embedded per eval detect vault leaks. Threshold: CRS < 0.10 for certification.

### 3.5 Reward-Hack Detection

Trajectory classifier (BENCH-017) flags:
- Test file modification
- Grader manipulation attempts
- Suspicious tool-use patterns

---

## 4. Design Partner Results (Anonymized)

**Partner:** Large fintech enterprise (Acme Corp, anonymized)  
**Model:** acme-coding-agent-v2.4  
**Tasks:** 50 holdout (38 narrow, 12 wide)  
**Runs:** 16 per task (800 total)

| Metric | Estimate | Wilson 95% CI |
|--------|----------|---------------|
| pass@1 | 42.0% | 31.0–54.0% |
| pass@5 | 68.0% | 56.0–78.0% |
| pass@10 | 76.0% | 64.0–85.0% |

**Contamination:** CRS 4.0%, zero canary leaks.  
**Reward-hack rate:** 2.0%.

**Key finding:** Wide-scope tasks showed 31% pass rate vs. 58% narrow — agent struggles with multi-file refactors typical of production codebases.

Full scorecard: `data/sample-reports/partner-acme-scorecard.json`

---

## 5. Failure Mode Analysis

| Mode | Count | % of Failures |
|------|-------|---------------|
| Partial fix | 18 | 40% |
| Wrong approach | 12 | 27% |
| Tool misuse | 5 | 11% |
| Timeout | 3 | 7% |
| Hallucinated API | 2 | 4% |

Failure mode taxonomy (BENCH-031) enables comparison beyond binary pass/fail.

---

## 6. Enterprise Implications

1. **Do not rely on public leaderboard pass@1** for procurement decisions.
2. **Require confidence intervals** — point estimates without n and k are meaningless.
3. **Demand contamination audit** — especially for models trained after benchmark publication.
4. **Evaluate on narrow and wide tasks separately** — aggregate scores hide capability gaps.
5. **Use sealed runtimes** — reward hacking invalidates honor-system evals.

---

## 7. Certification Program

BenchTrust Certified (BENCH-030) requires:
- Eval on current vault + latest weekly drop
- CRS below threshold
- Zero unresolved reward-hack flags
- Annual re-certification

---

## 8. Future Work

- Multi-language expansion (TypeScript, Java — BENCH-028)
- Vertical task packs (fintech, healthcare — BENCH-025)
- Weekly holdout drops to prevent overfitting (BENCH-022)
- Benchmark Trust Summit for community standards (BENCH-029)

---

## 9. Conclusion

Trustworthy AI evaluation requires infrastructure, not just datasets. BenchTrust provides the holdout vault, sealed runtime, statistical engine, and procurement-ready scorecards that enterprise teams need to defend agent selection decisions.

---

## References

1. BenchTrust Methodology Manifesto (BENCH-002)
2. Jimenez et al., SWE-bench (2024)
3. White et al., LiveBench (2024)
4. Chen et al., Evaluating Large Language Models Trained on Code (2021)

---

## Appendix: Reproducibility

| Artifact | Location |
|----------|----------|
| Methodology version | `manifesto-v0.1-draft` |
| API | `src/api/server.ts` (port 3848) |
| Stats engine | `src/stats/` |
| Sample scorecard | `data/sample-reports/partner-acme-scorecard.json` |

---

*BenchTrust — BENCH-026*
