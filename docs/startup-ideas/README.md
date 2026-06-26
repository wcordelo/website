# Theo's Startup Ideas — Execution Plans

Source: [Theo's Startup Ideas](https://app.notion.com/p/38a3444800948107a03be6918572028c) (Notion)

Six autonomous-agent-ready execution plans, each with market analysis, technical architecture, GTM strategy, 90-day roadmap, and a numbered task list (25+ tasks per idea).

**Implementations:** All 198 tasks are implemented in [`startups/`](../startups/) — 6 packages, 250 passing tests. See [TASK-STATUS.md](../startups/TASK-STATUS.md).

## Plans

| # | Idea | Working Name | Plan | Tasks | Priority Signal |
|---|------|--------------|------|-------|-----------------|
| 1 | Better npm/npx | `bnpm` / Better npm | [01-better-npm-npx.md](./01-better-npm-npx.md) | NPM-001–032 | **Strongest near-term wedge** |
| 2 | Better git | `bgit` / Better git | [02-better-git.md](./02-better-git.md) | GIT-001–032 | High upside, brutal adoption curve |
| 3 | Dropbox for developers | DevSync | [03-dropbox-for-developers.md](./03-dropbox-for-developers.md) | SYNC-001–032 | Solid niche product |
| 4 | New mobile platform | ShipKit (wedge) | [04-new-mobile-platform.md](./04-new-mobile-platform.md) | MOB-001–035 | Reframed: release/compliance layer |
| 5 | Better Slack | Better Slack | [05-better-slack.md](./05-better-slack.md) | COMM-001–035 | Differentiation is everything |
| 6 | Better AI benchmarks | BenchTrust | [06-better-ai-benchmarks.md](./06-better-ai-benchmarks.md) | BENCH-001–032 | Trust infrastructure, B2B |

## Agent Task Registry

See [AGENT-TASKS.md](./AGENT-TASKS.md) for the consolidated task index across all six ideas, including task IDs, dependencies, and categories.

## How Agents Should Use These Plans

1. **Pick an idea** — Start with the executive summary and 90-day roadmap in the plan doc.
2. **Check dependencies** — Each task lists prerequisite task IDs; run foundation tasks first.
3. **Execute sequentially within a track** — Research → Engineering → GTM, respecting the dependency graph.
4. **Parallelize across tracks** — e.g., NPM-017 (brand) can run alongside NPM-003 (CLI spike).
5. **Report against acceptance criteria** — Every task has explicit deliverables.

## Cross-Idea Synergies

| Combo | Synergy |
|-------|---------|
| Better git + Better benchmarks | Agent VCS generates eval data; benchmarks validate agent workflows |
| Better npm + Better git | Secure supply chain + secure agent commit pipeline |
| Better Slack + Better git | Agents discuss work in channels, commit through agent-native VCS |

## Suggested Build Order

1. **Better npm/npx** — clearest wedge, fastest path to revenue
2. **Better AI benchmarks** — smaller TAM but defensible if trust is earned
3. **Better git (as git overlay)** — high upside with bridge strategy
4. **Dropbox for devs** — viable indie/small-team business
5. **Better Slack** — needs exceptional positioning
6. **New mobile platform** — only with ShipKit wedge (not full platform)
