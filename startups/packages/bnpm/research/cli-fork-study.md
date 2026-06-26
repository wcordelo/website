# NPM-003: npm CLI Fork Study (ADR)

**Status:** Accepted  
**Date:** June 2026  
**Decision:** **Wrap npm via child_process passthrough** for v0.1–v0.5

## Context

bnpm must ship quickly while npm internals churn (arborist, libnpm*, CLI flags). We need install-time interception without maintaining a full npm fork.

## Options considered

### Option A: Fork npm CLI

- **Pros:** Full control over arborist hooks; deepest install-time interception.
- **Cons:** High maintenance; npm release cadence; security patch burden.

### Option B: Wrap npm (child_process)

- **Pros:** Low maintenance; automatic flag compatibility; fast v0.1.
- **Cons:** Pre-resolve block check only (not per-extract); limited lifecycle hooks.

### Option C: libnpm/arborist programmatic API

- **Pros:** Finer-grained tree resolution without full fork.
- **Cons:** Undocumented internals; breaks across npm majors.

## Decision

**v0.1:** Option B — `child_process.spawn` passthrough with pre-install block gate against lockfile + package.json deps.

**v0.5:** Spike Option C for lockfile-accurate resolution.

**v1.0:** Re-evaluate Option A only if npm blocks programmatic hooks.

## Implementation (v0.1)

```typescript
// Pre-check blocklist → passthroughNpm(['install', ...args])
const matches = checkDependencies(collectInstallTargets(cwd), policy);
if (hasBlockingMatch(matches)) exit(1);
passthroughNpm(['install', ...args]);
```

## Upgrade path

| Phase | Capability |
|-------|------------|
| v0.1 | package.json + package-lock pre-check |
| v0.5 | arborist dry-run resolve |
| v1.0 | extract-time hook via libnpm or native addon |

## Consequences

- **Positive:** Ships in weeks; `bnpm install` behaves like npm for passing packages.
- **Negative:** Transitive deps only caught if present in lockfile; document limitation.
- **Mitigation:** `bnpm ci` requires lockfile; GitHub Action enforces lockfile presence.

## Sigstore implications (NPM-032)

Publish provenance verify can run preflight without npm fork. Install-time verify requires arborist integration (v0.5+).

## References

- npm arborist docs
- NPM-001 competitive positioning
- axios 2026 incident — lockfile audit importance
