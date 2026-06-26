# Competitive Intelligence Dossier

**Task ID:** BENCH-001  
**Version:** 0.1 draft  
**Date:** 2025-06

---

## Executive Summary

BenchTrust enters a crowded AI evaluation market dominated by academic benchmarks and MLOps vendors. Our differentiation is **procurement-grade trust infrastructure** — private holdouts, sealed runtimes, and contamination audits — not public leaderboards.

---

## Competitor Analysis

### SWE-bench

| Dimension | Assessment |
|-----------|------------|
| Strength | Real GitHub issues; industry standard for coding agents |
| Weakness | Training contamination (10–30% drops on held-out variants); public tasks |
| BenchTrust gap | Private vault, temporal decontamination, canary leak detection |

### LiveBench

| Dimension | Assessment |
|-----------|------------|
| Strength | Continuously updated tasks; contamination awareness |
| Weakness | Still public; limited agent trajectory analysis |
| BenchTrust gap | Sealed runtime, reward-hack classifier, procurement scorecards |

### Braintrust

| Dimension | Assessment |
|-----------|------------|
| Strength | Developer-friendly eval UX; dataset versioning |
| Weakness | Vendor-operated; no third-party trust brand; partial holdout support |
| BenchTrust gap | Independent trust brand, certification program, B2B procurement pack |

### Weights & Biases (W&B)

| Dimension | Assessment |
|-----------|------------|
| Strength | Experiment tracking; team workflows; CI integration |
| Weakness | Not benchmark-native; no contamination audit or sealed runtime |
| BenchTrust gap | Purpose-built benchmark vault; integrate via BENCH-027 (future) |

### HELM

| Dimension | Assessment |
|-----------|------------|
| Strength | Rigorous methodology; academic credibility |
| Weakness | General LLM focus; not agent/coding procurement oriented |
| BenchTrust gap | Enterprise sales motion; sealed agent runtime; private holdout |

---

## Differentiation Matrix

| Capability | SWE-bench | LiveBench | Braintrust | W&B | BenchTrust |
|------------|-----------|-----------|------------|-----|------------|
| Private holdout vault | ✗ | ✗ | partial | partial | **✓** |
| Contamination audit | partial | partial | ✗ | ✗ | **✓** |
| Sealed runtime | partial | partial | ✗ | ✗ | **✓** |
| pass@k + CIs | partial | partial | ✓ | ✓ | **✓** |
| Procurement scorecard | ✗ | ✗ | partial | partial | **✓** |
| Third-party trust brand | academic | academic | vendor | vendor | **✓ (target)** |

---

## Strategic Implications

1. **Do not compete on public leaderboards** — enterprises need private, auditable evals.
2. **Methodology manifesto (BENCH-002)** is the trust moat; publish before sales motion.
3. **Integrate with Braintrust/W&B** rather than replace — export scorecards (BENCH-027).
4. **SWE-bench contamination narrative** is GTM fuel; back with CRS scoring (BENCH-013).

---

## Sources

- SWE-bench paper & contamination follow-ups (2024–2025)
- LiveBench technical report
- Braintrust product docs
- W&B Weave / Evals documentation
- HELM benchmark suite methodology

*BenchTrust Research — BENCH-001 complete*
