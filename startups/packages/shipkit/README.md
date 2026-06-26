# ShipKit v0.1

Expo/React Native release intelligence CLI.

## Commands

```bash
shipkit scan [path]       # Full scan with JSON/HTML report
shipkit upgrade-plan      # Recommend target SDK
shipkit preflight         # Store lint checks (Apple + Google)
shipkit report --html     # Generate report file
```

## Development

```bash
bun install
bun run scripts/generate-breaking-changes.ts
bun test
bun run src/cli.ts scan tests/fixtures/sample-expo-app
```

## Structure

- `src/scanner/` — dependency graph, Expo SDK detector
- `src/compliance/` — 16KB registry, ELF alignment checker
- `src/upgrade/` — target resolver, breaking change KB
- `src/codemods/` — package.json bump, app.config migrations
- `src/preflight/` — store rules engine (90 rules)
- `src/report/` — HTML + JSON report generator
- `src/ai/` — fix orchestrator, eval harness
- `src/api/` — Hono API server, scan orchestrator, agency portfolio
- `src/integrations/` — EAS OAuth, GitHub fix branches, Slack alerts
- `src/compliance/` — 16KB registry, ELF alignment, AAB analyzer
- `src/preflight/` — store rules engine, privacy manifest validator
- `src/feedback.ts` — false positive dispute endpoint
- `dashboard/` — Vite+React health score + upgrade wizard (MOB-024, MOB-025)
- `data/` — registry, breaking changes, preflight rules
- `action/` — GitHub Action with PR comment posting (MOB-020, MOB-027)
- `docs/` — landing page, billing, EAS OAuth, SOC 2
- `gtm/` — case study, Expo partner app, launch campaign
