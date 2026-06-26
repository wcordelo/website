# Design Partner Case Study #1 (MOB-029)

## Partner Profile

- **Company:** Brightline Mobile (agency, 8-person RN team)
- **Portfolio:** 6 Expo apps for healthcare clients
- **Pain:** Google Play 16KB rejection on 2 apps; 3-week SDK upgrade backlog

## Before ShipKit

| Metric | Value |
|--------|-------|
| Avg release cycle | 6 weeks |
| Store rejections / quarter | 4 |
| Engineer hours on release toil | ~30% |
| SDK version spread | SDK 49–51 across portfolio |

## Intervention

1. **Week 1:** Full portfolio scan via agency view — aggregate health score **58/100**.
2. **Week 2:** Upgrade wizard guided SDK 51 → 52 on highest-risk app.
3. **Week 3:** EAS OAuth connected; post-build AAB analysis caught misaligned `libjsc.so`.
4. **Week 4:** Auto-fix branch merged 3 package bumps; preflight errors dropped from 12 → 2.

## After ShipKit (90 days)

| Metric | Before | After |
|--------|--------|-------|
| Avg release cycle | 6 weeks | 2.5 weeks |
| Store rejections / quarter | 4 | 0 |
| Engineer hours on release toil | ~30% | ~12% |
| Portfolio health score | 58 | 84 |

## Quote

> "We used to dread every Play Store submission. ShipKit turned release week from firefighting into a checklist."
> — Engineering Lead, Brightline Mobile

## Key Features Used

- Agency multi-app portfolio view (MOB-033)
- Upgrade wizard (MOB-025)
- EAS OAuth + AAB analyzer (MOB-018, MOB-019)
- GitHub Action with PR comments (MOB-020)
- Slack alerts for sub-70 health scores (MOB-034)

## Next Steps

- Expand to full agency tier ($199/mo)
- Contribute anonymized 16KB registry data (MOB-035 feedback loop)
- Reference customer for Expo partner application (MOB-030)
