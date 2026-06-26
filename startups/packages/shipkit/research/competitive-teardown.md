# Competitive Teardown (MOB-002)

## ShipKit Positioning

Release and compliance intelligence for Expo/React Native teams — not a build runner, not a framework.

## Competitive Matrix

| Capability | Expo Docs | Fastlane | Bitrise | Renovate | EAS | **ShipKit** |
|------------|-----------|----------|---------|----------|-----|-------------|
| 16 KB compatibility scan | Partial | ✗ | ✗ | ✗ | Partial | **✓** |
| Expo SDK detection | ✓ | ✗ | ✗ | ✗ | ✓ | **✓** |
| Breaking change KB | Docs only | ✗ | ✗ | ✗ | Changelog | **✓ curated** |
| Upgrade path resolver | Manual | ✗ | ✗ | Partial | ✗ | **✓** |
| Store preflight rules | ✗ | Partial | Partial | ✗ | ✗ | **✓ 90+ rules** |
| Privacy manifest check | Guide | ✗ | ✗ | ✗ | ✗ | **✓** |
| AI-assisted fixes | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ (v0.5)** |
| HTML client reports | ✗ | ✗ | Partial | ✗ | Build logs | **✓** |
| Agency multi-app | ✗ | ✗ | Partial | ✗ | Per-project | **✓ (v0.5)** |
| Pricing | Free | OSS | $$$$ | OSS/$$ | Included | **Freemium CLI** |

## Competitor Deep Dives

### Expo / EAS

- **Strengths:** Native SDK knowledge, build infra, docs, partner ecosystem.
- **Weaknesses:** No proactive compliance scanning, no cross-SDK breaking change KB, no store preflight.
- **ShipKit wedge:** Complement EAS — scan before build, preflight before submit.

### Fastlane

- **Strengths:** Mature iOS/Android automation, large plugin ecosystem, lane-based workflows.
- **Weaknesses:** No Expo awareness, no dependency-level 16 KB registry, steep setup.
- **ShipKit wedge:** Zero-config Expo scan vs. writing custom lanes.

### Bitrise

- **Strengths:** Mobile-first CI, visual workflows, enterprise features.
- **Weaknesses:** Generic mobile CI, not policy-aware, expensive at scale.
- **ShipKit wedge:** Policy intelligence layer that integrates with any CI.

### Renovate / Dependabot

- **Strengths:** Automated dependency PRs, wide ecosystem.
- **Weaknesses:** No native module awareness, no 16 KB compatibility data, no Expo SDK cliffs.
- **ShipKit wedge:** Mobile-specific upgrade intelligence beyond version bumps.

## Differentiation Thesis

1. **Policy-aware** — know *why* you'll be rejected, not just that the build failed.
2. **Expo-native** — first-class `app.config`, SDK detection, EAS integration path.
3. **Registry-backed** — curated 16 KB compatibility data, not guesswork.
4. **Agency-ready** — portfolio scans and shareable HTML reports from day one.

## Gaps to Watch

- Expo could ship native scanning (partner early — MOB-030).
- False positives erode trust (MOB-035 feedback loop).
- Enterprise needs SOC 2 (MOB-031 checklist).

## Recommendation

Ship CLI + GitHub Action first (distribution), HTML reports second (agency deliverable), upgrade wizard third (monetization).
