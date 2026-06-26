# Introducing bnpm: Block Before Install

**Draft — NPM-029 launch pack**  
**Audience:** Engineering leaders, platform teams  
**Target:** betternpm.dev/blog/introducing-bnpm

---

Every week, another npm headline. Maintainer account takeovers. Typosquats that ride along on a caret range. CI pipelines that run `npm install` with full lifecycle scripts and a token in the environment.

We built **bnpm** because the last mile of the JavaScript supply chain— the moment before code lands in `node_modules`— deserves a choke point.

## What is bnpm?

`bnpm` is a drop-in overlay for npm. Swap your install command:

```bash
bunx @theo-startups/bnpm install
```

If a package matches our threat blocklist, **install never runs**. No postinstall script. No second-stage payload. No Monday morning IR call.

## What ships in v0.1

- **Install-time block gate** with curated IOCs from 2025–2026 incidents (axios, TanStack, typosquats)
- **`.better-npmrc`** policy file your agents and humans can share
- **`bnpm ci`** strict mode with `--ignore-scripts` injection
- **`bnpm audit-pipeline`** for GitHub Actions misconfigs (OIDC, `pull_request_target`, cache poisoning)
- **GitHub Action** for PR checks

## Why not just use npm audit?

`npm audit` knows CVEs. bnpm blocks **malicious publishes** that don't have a CVE yet— the window where attackers win.

## Get started

```bash
bunx @theo-startups/bnpm init --strict
```

Read the docs. Star the repo. Tell us what we blocked before it blocked you.

— The bnpm team
