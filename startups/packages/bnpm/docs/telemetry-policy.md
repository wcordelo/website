# Telemetry Policy (NPM-018)

**Effective:** June 2026  
**Default:** **Off** — no data collected unless explicitly opted in.

## Principles

1. **Opt-in only** — `telemetry = opt-in` in `.better-npmrc` required.
2. **No PII** — no emails, usernames, repo names, or file paths.
3. **No package names** in v0.1 (only aggregate counters).
4. **Open source** — telemetry client code auditable in `src/telemetry/` (v0.5).

## What we collect (opt-in)

| Event | Fields | Purpose |
|-------|--------|---------|
| `install.pass` | timestamp, bnpm version, policy mode | Reliability |
| `install.block` | timestamp, severity, rule source | Threat efficacy |
| `cli.command` | command name only | Product usage |

## What we never collect

- Environment variables or secrets
- `package.json` contents
- Lockfile hashes tied to identity
- IP addresses stored > 24h

## Data retention

- Aggregated metrics: 90 days
- Raw events: 7 days (opt-in tier only)

## Disable telemetry

```ini
# .better-npmrc
telemetry = off
```

Or environment variable:

```bash
export BNPM_TELEMETRY=0
```

## v0.1 status

Telemetry module is **not yet wired** in v0.1. This policy governs v0.5 implementation. CLI performs zero network calls for telemetry today.

## Contact

security@betternpm.dev
