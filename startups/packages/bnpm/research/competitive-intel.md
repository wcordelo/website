# NPM-001: Competitive Intelligence Dossier

**Product:** bnpm (Better npm)  
**Date:** June 2026  
**Status:** v0.1 research deliverable

## Executive summary

bnpm positions as a **drop-in npm CLI overlay** with install-time enforcement—not another post-install scanner. The competitive gap is the **last mile before `node_modules`**: blocking, policy, and maintainer response workflows that incumbents treat as secondary.

## Competitor matrix

| Capability | npm CLI | pnpm | Yarn Berry | Socket.dev | Snyk | Dependabot | **bnpm** |
|------------|---------|------|------------|------------|------|------------|----------|
| Drop-in CLI replacement | ✓ | partial | partial | ✗ | ✗ | ✗ | **✓** |
| Install-time block gate | ✗ | ✗ | ✗ | API/SaaS | ✗ | ✗ | **✓** |
| Real-time threat feed | ✗ | ✗ | ✗ | ✓ | partial | partial | **✓** |
| Lifecycle script policy | manual | manual | manual | ✗ | ✗ | ✗ | **✓** |
| Pipeline audit (CI workflows) | ✗ | ✗ | ✗ | partial | partial | ✗ | **✓** |
| Publish wizard + tarball diff | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **v0.5** |
| Emergency deprecate tooling | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Registry proxy | Enterprise | ✗ | ✗ | ✗ | ✗ | ✗ | **v1** |
| Sigstore provenance | partial | ✗ | ✗ | partial | partial | ✗ | **stub v0.1** |
| Free OSS CLI | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | **✓** |
| GitHub Action | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | **✓** |

## Deep dives

### npm CLI

- **Strengths:** Universal adoption, registry integration, `npm audit` for known CVEs.
- **Gaps:** No install-time malware block; `ignore-scripts` is all-or-nothing; emergency response requires npm support tickets.
- **bnpm wedge:** Wrap npm with pre-extract gate; preserve registry compatibility.

### Socket.dev

- **Strengths:** Best-in-class detection; fast response (e.g., axios 2026 compromise in ~6 minutes).
- **Gaps:** Primarily SaaS/API; not a developer's default install binary.
- **bnpm wedge:** CLI-first enforcement; partner on feed quality; differentiate on publish + proxy.

### Snyk / Dependabot

- **Strengths:** Enterprise sales motion, IDE integration, broad language support.
- **Gaps:** CVE-centric; weak on novel malicious publishes and typosquats without upgrade paths.
- **bnpm wedge:** Block unknown-malware publishes; pipeline audit for GitHub Actions misconfigs.

### pnpm / Yarn Berry

- **Strengths:** Disk efficiency, strictness options, monorepo ergonomics.
- **Gaps:** No threat intelligence layer; security is operator-configured.
- **bnpm wedge:** PM-agnostic blocklist (NPM-022 shims); don't compete on disk—compete on safety.

## Positioning statement

> **bnpm is Cloudflare for npm consumption** — block before install, not alert after merge.

## Gaps bnpm must close (90 days)

1. False positive rate < 0.1% with graduated warn→block rollout.
2. Feed freshness < 15 minutes for critical blocks (NPM-007 ingestion).
3. Publish wizard to match Socket's detection speed with maintainer-grade UX.

## Sources

- OpenJS Foundation npm security advisories
- Socket.dev incident reports (axios 2026, TanStack 2026)
- GitHub Advisory Database, OSV
- Customer interviews (design partner pipeline)
