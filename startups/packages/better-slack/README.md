# Better Slack v0.1

Forum-first team communication for engineering teams and AI agents.

## Run

```bash
cd startups/packages/better-slack
bun install
bun run build:web
bun run src/server.ts
```

Server: http://localhost:3847  
WebSocket: `ws://localhost:3847/ws?workspace=<id>`

Demo login: `demo@better-slack.dev`

## Test

```bash
bun test tests/
```

## MCP Server

```bash
BETTER_SLACK_URL=http://localhost:3847 BETTER_SLACK_AGENT_KEY=<key> bun run mcp
```

## Completed COMM Tasks (v0.1)

All 35 tasks complete — see [TASK-STATUS.md](./TASK-STATUS.md).

| ID | Feature |
|----|---------|
| COMM-001 | Thread data model schema |
| COMM-002 | Forum-first channel UI |
| COMM-003 | Thread composer |
| COMM-004 | Sub-thread creation |
| COMM-005 | Thread status workflow |
| COMM-006 | Thread subscriptions |
| COMM-007 | Cross-thread references |
| COMM-008 | Post primitive schema |
| COMM-009 | Post editor UI |
| COMM-010 | Post version diff |
| COMM-011 | Post templates (RFC, ADR, Incident, Runbook) |
| COMM-012 | Real-time WebSocket layer |
| COMM-013 | Workspace auth (email stub) |
| COMM-015 | Agent registry service |
| COMM-016 | Capability permission engine |
| COMM-017 | Agent audit log |
| COMM-018 | Agent proposal flow |
| COMM-019 | CI Reporter agent |
| COMM-020 | GitHub webhook stub |
| COMM-021 | Linear integration stub |
| COMM-022 | Full-text search (SQLite FTS5) |
| COMM-023 | Agent SDK (TypeScript) |
| COMM-024 | MCP server |
| COMM-025 | Design partner program |
| COMM-026 | Landing page copy |
| COMM-027 | Slack bridge bot stub |
| COMM-028 | Stripe billing stubs |
| COMM-029 | SAML SSO stub (WorkOS) |
| COMM-030 | Thread resolution ritual |
| COMM-031 | Notification digest stub |
| COMM-032 | Agent permissions security review |
| COMM-033 | SOC2 readiness checklist |
| COMM-034 | Demo script |
| COMM-035 | Slack history import |
