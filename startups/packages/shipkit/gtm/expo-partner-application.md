# Expo Partner Application (MOB-030)

## Application Summary

**Product:** ShipKit — release intelligence CLI and dashboard for Expo/React Native teams.

**Partnership type:** Technology Partner (EAS Build integration)

## Value Proposition for Expo

ShipKit reduces store rejection rates and SDK upgrade friction for the Expo ecosystem:

- Scans Expo projects for 16KB page alignment, privacy manifests, and store preflight rules
- Integrates with EAS Build via OAuth for post-build AAB analysis
- Recommends upgrade paths aligned with Expo SDK release cadence

## Integration Points

| Expo Service | ShipKit Feature | Status |
|--------------|-----------------|--------|
| EAS Build | OAuth + artifact download | Stub (MOB-018) |
| Expo SDK | Breaking change KB | Live |
| `expo-doctor` | Complementary (deep compliance vs config) | Positioned as additive |
| Expo dashboard | Link to ShipKit health score | Planned |

## Traction

- GitHub Action published (MOB-027)
- Design partner case study: 58 → 84 health score in 90 days (MOB-029)
- 90+ store preflight rules engine
- Agency portfolio view for multi-app teams

## Requested Support

1. **EAS API access** for production OAuth (build artifact URLs, project metadata)
2. **Co-marketing** — "Ship with confidence" blog post on expo.dev
3. **Expo Discord** channel mention for ShipKit launch (MOB-032)
4. **SDK preview access** for breaking change KB updates

## Team

- Built by mobile release engineers with agency background
- Open to feedback loop with Expo developer relations

## Links

- Landing page: `docs/landing-page.md`
- GitHub Action: `action/action.yml`
- SOC 2 checklist: `docs/soc2-checklist.md`
