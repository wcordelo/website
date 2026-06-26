# GIT-026: Commit Noise Benchmark

**Hypothesis:** bgit session squash reduces unexplained micro-commits in agent workflows.

## Methodology

1. Clone a sample repo with agent-generated history (50+ commits).
2. Count commits without `bgit-trace` trailer or linked session.
3. Replay sessions with `bgit session end --squash`.
4. Re-count unexplained commits.

## Results (synthetic v0.1 fixture)

| Metric | Before bgit | After bgit |
|--------|-------------|------------|
| Total commits (1 session) | 12 micro-commits | 1 squashed commit |
| Unexplained commits | 12 (100%) | 0 (0%) |
| Provenance coverage | 0% | 100% |

**Reduction in unexplained commits: ~100%** for single-session squash (target: 40% in real repos).

## Limitations

- Synthetic fixture only; design partner data pending (GIT-025).
- Squash merges metadata, not textual commit history.
- Multi-session repos need per-session analysis.

## Reproduce

```bash
cd tests/fixtures && bun test ../commit-noise.test.ts
```
