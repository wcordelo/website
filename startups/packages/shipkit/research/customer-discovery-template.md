# Customer Discovery Template (MOB-001)

## Interview Goals

- Validate release/compliance pain for Expo/RN teams
- Quantify time spent on SDK upgrades and store rejections
- Identify willingness to pay for automated scanning

## Target Segments

| Segment | Count | Role to interview |
|---------|-------|-------------------|
| Product teams (5–30 eng) | 10 | Mobile lead, eng manager |
| Agencies (5–50 apps) | 10 | Technical director, release engineer |

## Interview Script (30 min)

### Warm-up (5 min)

1. Tell me about your mobile stack (Expo managed/bare, RN version, app count).
2. How often do you ship to the App Store and Play Store?

### Pain discovery (15 min)

3. Walk me through your last Expo SDK upgrade. What broke? How long did it take?
4. Have you encountered the Android 16 KB page size requirement? What happened?
5. Describe your last App Store or Play Store rejection. Root cause? Resolution time?
6. What tools do you use today for release (EAS, Fastlane, Bitrise, manual)?
7. Who owns release engineering on your team? Is it a dedicated role?

### Solution fit (7 min)

8. If a CLI could scan your repo and produce a 16 KB + SDK compatibility report, would you run it in CI?
9. What would make you trust the results? (false positives are costly)
10. Would you pay for upgrade recommendations + codemods? What price point?

### Close (3 min)

11. Can we run ShipKit scan on your repo (with permission) and share results?
12. Would you be a design partner for v0.5?

## Synthesis Template

| Interview # | Company | Segment | SDK pain (1–5) | 16KB aware? | WTP | Key quote |
|-------------|---------|---------|----------------|-------------|-----|-----------|
| 1 | | | | | | |

## Success Criteria

- 20 interviews completed
- ≥60% report SDK upgrade pain ≥4/5
- ≥40% encountered 16 KB or privacy manifest issues
- ≥5 design partner commitments
