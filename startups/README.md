# Theo Startups Monorepo

Working implementations of all six startup ideas from [Theo's Startup Ideas](../docs/startup-ideas/README.md).

## Packages

| Package | CLI | Description | Port |
|---------|-----|-------------|------|
| [@theo-startups/bnpm](./packages/bnpm) | `bnpm` | Secure npm install/publish proxy, blocklist, emergency revoke | 3850 |
| [@theo-startups/bgit](./packages/bgit) | `bgit` | Agent-native git overlay: sessions, intents, secrets, MCP | — |
| [@theo-startups/devsync](./packages/devsync) | `devsync` | Git-safe file sync across machines | — |
| [@theo-startups/shipkit](./packages/shipkit) | `shipkit` | Expo/RN upgrade, 16KB compliance, store preflight | 3851 |
| [@theo-startups/better-slack](./packages/better-slack) | — | Thread-first team chat + AI agents + Posts | 3847 |
| [@theo-startups/benchtrust](./packages/benchtrust) | `benchtrust` | Private holdout AI benchmarks, contamination audits | 3848 |

## Setup

```bash
cd startups
bun install
```

## Run all tests (250 tests)

```bash
for pkg in bnpm bgit devsync shipkit better-slack benchtrust; do
  (cd packages/$pkg && bun test)
done
```

## Architecture

```
startups/
├── packages/
│   ├── bnpm/           # install gate, policy, pipeline audit, dashboard
│   ├── bgit/           # .bgit store, MCP, encrypted secrets
│   ├── devsync/        # sync engine, ignore profiles, pairing
│   ├── shipkit/        # scanner, compliance, preflight, dashboard
│   ├── better-slack/   # Hono API, WebSocket, React web, agent SDK
│   └── benchtrust/     # vault, stats, contamination, dashboard
├── TASK-STATUS.md      # 198/198 tasks complete
└── package.json        # bun workspaces
```

## Task tracking

Full agent task registry: [docs/startup-ideas/AGENT-TASKS.md](../docs/startup-ideas/AGENT-TASKS.md)

Completion status: [TASK-STATUS.md](./TASK-STATUS.md)
