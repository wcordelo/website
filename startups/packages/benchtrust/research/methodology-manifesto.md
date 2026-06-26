# BenchTrust Methodology Manifesto

**Task ID:** BENCH-002  
**Version:** 0.1 draft  
**Status:** Public trust framework

---

## Preamble

Leaderboards lie — not always maliciously, but structurally. Public benchmarks leak into training corpora. Single-shot pass@1 hides variance. Agents game graders when runtimes are porous. **BenchTrust exists to make AI evaluation defensible for procurement.**

---

## What We Measure

1. **Task completion** on private, never-published software engineering holdouts.
2. **pass@k** with bootstrap and Wilson confidence intervals (default k=10 for agents).
3. **Contamination risk** via CRS (Contamination Regurgitation Score) and canary monitoring.
4. **Reward-hacking signals** in agent trajectories (test modification, grader attacks).
5. **Failure mode taxonomy** beyond binary pass/fail.

## What We Do Not Measure

- General world knowledge or chat quality.
- Performance on public benchmark replicas (we actively avoid them in holdout sets).
- Vendor-claimed internal metrics without sealed-runtime verification.

---

## Holdout Policy

- Tasks sourced **only** from licensed partner repositories.
- **Never published** in raw form; aggregate scores only.
- **Canary strings** embedded per partner eval; leaks trigger investigation.
- **Temporal tags** (`createdAt`, `modelCutoff`) for fair eval against model training cutoffs.

---

## Statistical Standards

| Metric | Standard |
|--------|----------|
| Primary | pass@k (k=1, 5, 10) |
| CI methods | Wilson score (task-level), bootstrap (pass@k estimates) |
| Runs per task | Minimum 16 for agents (v0.1 default) |
| Reporting | Always include n, k, CI bounds, vault version |

---

## Runtime Integrity

- **Network isolation** — no egress from agent container.
- **Read-only root filesystem** except `/workspace`.
- **Grader sidecar** — tests and graders inaccessible to agent.
- **Trajectory logging** — all tool calls retained for audit.

---

## Conflict of Interest Policy

- BenchTrust does not accept vendor-owned tasks in shared public holdout sets.
- Per-vendor vault slices available under enterprise tier.
- Scorecards signed with methodology version hash for reproducibility.

---

## Certification (see BENCH-030)

Agents/models achieving BenchTrust Certified status must:

- Pass contamination audit (CRS below threshold).
- Complete eval on current vault + latest weekly drop.
- Have zero unresolved reward-hack flags.
- Re-certify annually.

---

## Version

`manifesto-v0.1-draft` — hash referenced on all scorecards.

*BenchTrust — trust infrastructure for AI evaluation*
