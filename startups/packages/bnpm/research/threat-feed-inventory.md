# NPM-002: Threat Feed Inventory

**Product:** bnpm  
**Date:** June 2026

## Feed catalog

| Feed | URL / API | Auth | Rate limit | License / ToS | Latency | bnpm use |
|------|-----------|------|------------|---------------|---------|----------|
| OSV | `https://api.osv.dev/v1/query` | None | Fair use | Apache-2.0 API | Minutes | CVE + malware IDs |
| GitHub Advisory DB | GraphQL + REST | PAT / App | 5000/hr | GitHub ToS | Minutes | GHSA normalization |
| npm audit API | `npm audit --json` | None | npm registry | npm ToS | Hours | Baseline CVE sync |
| Socket.dev API | Partner API | API key | Contract | Commercial | **<6 min** | Premium tier feed |
| Snyk OSDB | Snyk API | API key | Tiered | Commercial | Hours | Enterprise optional |
| npm registry metadata | `registry.npmjs.org` | None | High | npm ToS | Real-time | New publish heuristics |
| Typosquat heuristics | Internal | — | — | — | Real-time | Levenshtein + scope patterns |
| Curated IOC bundles | bnpm CDN (NPM-007) | Signed URL | — | bnpm ToS | 15 min poll | Install gate |

## Ingestion architecture (NPM-007)

```
┌─────────────┐   ┌──────────────┐   ┌─────────────────┐   ┌──────────────┐
│ OSV / GHSA  │──►│ Normalizer   │──►│ Blocklist bundle│──►│ CDN (signed) │
│ Socket feed │   │ (worker)     │   │ blocklist-v1    │   │ S3 + CF      │
│ Heuristics  │   └──────────────┘   └─────────────────┘   └──────┬───────┘
└─────────────┘                                                    │
                                                                   ▼
                                                          bnpm CLI poll / embed
```

### Normalization rules

1. Map all entries to `BlocklistEntry` schema (NPM-006).
2. Deduplicate by `package + version_range + source`.
3. Promote `critical` + `block` to emergency push channel (v0.5).
4. Set `expires_at` for time-bound false positive appeals.

### Embedded v0.1 IOCs (2025–2026)

| Package | Versions | Incident | IOCs |
|---------|----------|----------|------|
| axios | 1.14.1, 0.30.4 | Maintainer takeover Mar 2026 | plain-crypto-js, sfrclak.com |
| plain-crypto-js | 4.2.1 | Staged dependency | setup.js, OrDeR_7077 |
| @tanstack/* | May 2026 range | GHA cache/OIDC chain | router_init.js, @tanstack/setup |

## Rate limit strategy

- **OSS CLI:** Embedded bundle + 24h delayed CDN poll.
- **Team tier:** 15-minute CDN poll + WebSocket emergency (v0.5).
- **Backoff:** Exponential on 429; stale-while-revalidate up to 7 days.

## ToS compliance checklist

- [ ] OSV attribution in block error messages
- [ ] GitHub Advisory credit links in advisories (NPM-013)
- [ ] Socket partner agreement before production API use
- [ ] No redistribution of npm audit bulk data

## Open items

- Partner feed SLA with Socket.dev
- Legal review on blocklist liability (appeal process)
- Air-gapped bundle for enterprise proxy (NPM-025)
