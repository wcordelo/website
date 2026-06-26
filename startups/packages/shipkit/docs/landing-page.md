# ShipKit — Release Intelligence for Expo/RN Teams

**Tagline:** Scan. Preflight. Ship.

## The Problem

Mobile teams spend 20–40% of engineering time on release toil — SDK upgrades, store rejections, and binary compliance (16 KB page size, privacy manifests). Agencies multiply this pain across portfolios.

## The Solution

ShipKit is a CLI that scans your Expo/React Native repo and tells you what's broken *before* you submit to the stores.

```bash
npx @theo-startups/shipkit scan .
npx @theo-startups/shipkit preflight
npx @theo-startups/shipkit upgrade-plan
```

## Features (v0.1)

- **Full repo scan** — dependency graph, native module detection, Expo SDK version
- **16 KB compatibility** — registry of known-good/bad package versions
- **Store preflight** — 90+ Apple and Google submission rules
- **Upgrade planner** — target SDK recommendations with breaking change warnings
- **HTML reports** — shareable client deliverables for agencies

## Quick Start

```bash
# Install
npm install -g @theo-startups/shipkit

# Scan your project
shipkit scan ./my-expo-app

# Check store readiness
shipkit preflight

# Get upgrade recommendations
shipkit upgrade-plan --json
```

## GitHub Action

```yaml
- uses: shipkit/scan-action@v1
  with:
    path: .
```

## Pricing (planned)

| Tier | Price | Includes |
|------|-------|----------|
| CLI (OSS) | Free | scan, preflight, JSON reports |
| Pro | $49/mo per app | HTML reports, upgrade wizard, AI fixes |
| Agency | $299/mo | Multi-app dashboard, white-label reports |

## CTA

Run your first scan in 60 seconds. No account required.

```bash
npx @theo-startups/shipkit scan .
```

[Documentation](./README.md) · [GitHub](https://github.com/theo-startups/shipkit)
