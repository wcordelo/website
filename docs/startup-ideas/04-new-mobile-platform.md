# New Mobile Platform — ShipKit Wedge — Execution Plan

**Working name:** ShipKit (release/compliance wedge — NOT a full mobile platform)  
**Priority signal:** Reframed: release/compliance layer  
**Task prefix:** `MOB-001` through `MOB-035`

---

## 1. Executive Summary

Building a "new mobile platform" to compete with iOS and Android is a decade-long, capital-intensive bet that kills most startups. The original idea is reframed: **ShipKit** is a **mobile release and compliance wedge**—the layer that helps React Native and Expo teams survive store policy changes, SDK upgrades, and binary requirements without hiring a dedicated mobile platform engineer.

The immediate pain is acute: Google's **16 KB page size requirement** for Android native libraries, Apple's **privacy manifest** rules, Expo SDK upgrade cliffs, and App Store rejection cycles that burn weeks. Teams shipping with Expo/RN spend **20–40% of mobile eng time** on release toil, not features. Agencies juggle 10+ apps and drown in duplicate upgrade work.

ShipKit scans repos for compatibility issues, maintains a **breaking-change knowledge base**, runs codemods and AI-assisted fixes, integrates with EAS Build and GitHub, and provides a **store preflight** rule engine before submission. It is NOT a runtime, NOT a new framework—it's the **CI/CD and compliance brain** for existing mobile stacks.

**Why now:** 16 KB deadline forces upgrades; Expo's growth creates a concentrated market; AI can fix mechanical migration work; no dominant "mobile release copilot" exists.

**90-day goal:** CLI `shipkit scan` with 16 KB report; EAS integration; 5 agency design partners; first paid upgrade wizard customer.

---

## 2. Problem Statement & Evidence

### The core problem

Mobile release engineering is a specialized, high-stakes discipline that small teams cannot afford—but store policies punish ignorance with rejections and delistings.

### Evidence

| Signal | Data point |
|--------|------------|
| RN/Expo market | **30%+** of new mobile apps use cross-platform frameworks |
| 16 KB deadline | Google Play requires **16 KB page alignment** for native libs (2025–2026 rollout) |
| Upgrade pain | Expo SDK upgrades break **40–60%** of projects without manual fixes |
| Rejection cost | Average App Store rejection cycle: **3–7 days** per round |
| Agency scale | Agencies manage **5–20 apps**; upgrades are N× duplicated work |
| Talent gap | "Mobile release engineer" is a rare, expensive hire |

### Specific pain scenarios

1. **16 KB crash on Android 15** — App works locally; production crashes on new devices.
2. **Privacy manifest rejection** — Apple rejects for missing `NSPrivacyAccessedAPITypes`.
3. **Expo 49 → 52 upgrade** — Breaking changes across `app.config`, dependencies, native modules.
4. **Agency client emergency** — Client app delisted; need fix across portfolio in 48 hours.

### Why NOT a full platform

| Full platform risk | ShipKit mitigation |
|--------------------|-------------------|
| 10-year OS roadmap | Integrate with Expo/RN existing runtime |
| Developer ecosystem cold start | CLI + GitHub Action = instant distribution |
| Capital requirements ($100M+) | SaaS + services; <$2M to PMF |
| Competing with Apple/Google | Complement, don't replace |

---

## 3. Target Customer Profiles (ICP)

### Primary ICP: Expo/React Native product teams (5–30 eng)

| Attribute | Detail |
|-----------|--------|
| Apps | 1–3 production apps in stores |
| Trigger | 16 KB warning in Play Console; Expo upgrade email |
| Buyer | Mobile lead or eng manager |
| Budget | $500–$5K/month for release tooling |

### Secondary ICP: Mobile agencies (5–50 apps)

| Attribute | Detail |
|-----------|--------|
| Pain | Portfolio upgrades; client SLA pressure |
| Offer | Multi-app dashboard, batch scans, white-label reports |
| Budget | $2K–$15K/month |

### Tertiary ICP: Enterprise mobile platform teams

| Attribute | Detail |
|-----------|--------|
| Pain | Policy compliance across dozens of apps |
| Offer | Store preflight API, custom rules, SOC 2 |
| Expansion | v1.0+ enterprise tier |

### Anti-ICP

- Native Swift/Kotlin-only shops (lower fit until v1).
- Teams not in app stores.
- Startups pre-product-market-fit (no release pain yet).

---

## 4. Competitive Landscape & Differentiation Matrix

| Capability | Expo docs | Fastlane | Bitrise | Renovate | **ShipKit** |
|------------|-----------|----------|---------|----------|-------------|
| 16 KB compatibility scan | partial | ✗ | ✗ | ✗ | **✓** |
| Expo SDK upgrade wizard | manual | ✗ | ✗ | partial | **✓** |
| Breaking change KB | docs only | ✗ | ✗ | ✗ | **✓** |
| AI-assisted codemods | ✗ | ✗ | ✗ | ✗ | **✓** |
| Store preflight rules | ✗ | partial | partial | ✗ | **✓** |
| Privacy manifest validator | ✗ | ✗ | ✗ | ✗ | **✓** |
| Multi-app agency view | ✗ | ✗ | partial | ✗ | **✓ (v0.5)** |
| EAS deep integration | n/a | partial | ✓ | ✗ | **✓** |

### Differentiation thesis

1. **Policy-aware, not just build automation** — know *why* you'll be rejected.
2. **Expo-native** — first-class `app.config`, EAS, SDK detection.
3. **AI fix with eval harness** — not blind codegen; measured fix success.
4. **Agency portfolio** — multi-app is the business model, not an afterthought.

---

## 5. Product Vision & MVP Scope

### Vision (3-year)

ShipKit is the **release engineering copilot** for cross-platform mobile—every store submission is preflight-validated, every SDK upgrade is guided, every policy change is surfaced before it becomes a crisis.

### v0.1 — "Scan and report" (Weeks 1–6)

| Feature | Description |
|---------|-------------|
| CLI `shipkit scan` | Repo analysis for 16 KB, SDK version, deps |
| Dependency graph scanner | Map native modules |
| Expo SDK detector | Identify SDK-specific issues |
| 16 KB compatibility registry | Known-good/bad package versions |
| HTML scan report | Shareable client deliverable |
| GitHub Action | Scan on PR |

### v0.5 — "Fix and integrate" (Weeks 7–12)

| Feature | Description |
|---------|-------------|
| Breaking change knowledge base | Curated Expo/RN migration guides |
| Upgrade target resolver | "To fix 16 KB, upgrade X, Y, Z" |
| Codemods: package.json, app.config | Mechanical migrations |
| AI fix orchestrator + eval harness | Agent fixes with verification |
| EAS OAuth integration | Pull build artifacts |
| Post-build AAB analyzer | Binary-level 16 KB check |
| Dashboard MVP + upgrade wizard UI | |

### v1.0 — "Ship with confidence" (Months 4–6)

| Feature | Description |
|---------|-------------|
| Store preflight rule engine | Apple + Google rules |
| Privacy manifest validator | Auto-fix suggestions |
| Agency multi-app view | Portfolio management |
| Auto-fix branch creator (GitHub App) | PR with fixes |
| Billing + launch campaign |

---

## 6. Technical Architecture

### System diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  CLI/Action │────►│  API Service │────►│  Dashboard  │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Scan Engine   │  │ Knowledge DB  │  │ AI Fix Orch.  │
│ (deps, binary)│  │ (breaking chg)│  │ (codemods+LLM)│
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                  ┌───────────────┐
                  │ EAS / GitHub  │
                  │ Integrations  │
                  └───────────────┘
```

### Scan engine

1. **Static analysis:** Parse `package.json`, `app.json`/`app.config.js`, `android/`, `ios/` if bare.
2. **Dependency graph:** Resolve native modules; cross-reference 16 KB registry.
3. **Binary analysis (v0.5):** Download AAB from EAS; ELF page size inspection.

### 16 KB compatibility registry

- Community + curated data: package@version → compatible/incompatible/unknown.
- False positive feedback loop (MOB-035).
- Updated weekly from CI runs across partner repos.

### AI fix orchestrator

1. Classify issue from scan.
2. Lookup KB for known fix pattern.
3. If mechanical → codemod.
4. If complex → LLM with repo context; run eval harness (build must pass).
5. Create PR via GitHub App.

### API service

- TypeScript/Node or Go; Postgres for scans, orgs, registry.
- Background jobs for cloud scans and AAB analysis.

---

## 7. Core Features Deep Dive

### 7.1 `shipkit scan`

```bash
shipkit scan --format html --output report.html
```

Outputs:
- Expo SDK version and upgrade path.
- Packages failing 16 KB alignment.
- Privacy manifest gaps.
- Deprecated APIs flagged by Apple/Google.

### 7.2 16 KB analyzer

Inspects `.so` files in AAB/APK:
- Page alignment of LOAD segments.
- Flags non-compliant native deps.
- Links to registry entries with fix versions.

### 7.3 Upgrade wizard

Interactive (CLI + web):
1. Select target Expo SDK.
2. Show breaking changes from KB.
3. Preview codemod diffs.
4. Run AI fixes for remainder.
5. Open PR.

### 7.4 Store preflight (v1.0)

Rule engine with categories:
- **Metadata:** screenshots, descriptions, age ratings.
- **Privacy:** manifest completeness, data collection declarations.
- **Binary:** 16 KB, bitcode, minimum SDK.
- **Policy:** IAP rules, login requirements.

Each rule: `pass` | `warn` | `fail` with remediation link.

### 7.5 Agency multi-app view

- Connect GitHub org; list all RN/Expo repos.
- Portfolio health score.
- Batch upgrade campaigns: "Upgrade all to Expo 52."
- Client-branded PDF reports.

### 7.6 EAS integration

OAuth to Expo account; pull latest builds; trigger rebuild after fix PR merged.

### 7.7 Eval harness for AI fixes

- Dockerized build environment matching EAS.
- Fix is accepted only if `eas build --local` or `expo prebuild` succeeds.
- Prevents hallucinated fixes from reaching PRs.

---

## 8. Go-to-Market Strategy

### Phase 1: 16 KB urgency (Months 1–3)

- **Free CLI scan** — viral wedge.
- Content: "Is your Expo app 16 KB compliant?" checker online.
- Expo forums, React Native discord, agency outreach.

### Phase 2: Design partners (Months 2–4)

- 5 agencies with 5+ apps each.
- Free upgrade assistance for case study.
- MOB-030 Expo partner application.

### Phase 3: Paid SaaS (Months 4+)

- Dashboard, upgrade wizard, preflight.
- Agency tier at $299–$999/month.

### Messaging

> "Don't hire a mobile platform team. ShipKit gets you through store policy hell."

### Channels

- GitHub Action marketplace.
- Expo newsletter / partner program.
- Mobile agency Slack communities.

---

## 9. Business Model & Pricing Tiers

### Free

- CLI scan (local).
- HTML report.
- GitHub Action (5 runs/month).

### Pro — $49/month per app

- Cloud scans, unlimited Action runs.
- Upgrade wizard.
- EAS integration.

### Agency — $299/month (up to 10 apps)

- Multi-app dashboard.
- Batch operations.
- White-label reports.
- +$29/additional app.

### Enterprise — custom

- Store preflight API.
- Custom rules.
- SOC 2, SLA.

**Year 1 target:** 50 Pro + 10 Agency = ~$65K ARR (conservative); expand with enterprise in year 2.

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Expo builds native tooling | Medium | High | Partner don't compete; be best third-party |
| 16 KB urgency fades | Medium | Medium | Expand to privacy, SDK upgrades |
| AI fixes break builds | High | High | Eval harness; human review option |
| False positives erode trust | Medium | High | MOB-035 feedback loop; conservative defaults |
| Bare RN vs Expo fragmentation | High | Medium | Expo-first; bare RN phase 2 |
| Low willingness to pay | Medium | Medium | Agency tier; services upsell |

---

## 11. Success Metrics

### North star

**Store rejections prevented** (self-reported + preflight catches).

### 90-day targets

| Metric | Target |
|--------|--------|
| CLI downloads | 2,000 |
| Scans run | 5,000 |
| Design partner agencies | 5 |
| Apps upgraded via wizard | 15 |
| Paid customers | 10 |
| 16 KB issues correctly identified | >90% precision |

### 12-month targets

| Metric | Target |
|--------|--------|
| ARR | $150K |
| Agency customers | 25 |
| Knowledge base articles | 200 |
| AI fix success rate | >70% on eval harness |

---

## 12. Team & Skills Required

| Role | Skills |
|------|--------|
| **Mobile engineer** | Expo, RN, Android NDK, iOS codesigning |
| **Platform engineer** | CLI, GitHub Actions, API, Postgres |
| **AI/ML engineer** | Codemods, LLM orchestration, eval design |
| **GTM** | Agency relationships, mobile community |

Minimum: 2 engineers (one mobile-heavy) + founder sales.

---

## 13. 90-Day Execution Roadmap

### Weeks 1–2: Discovery + spike

- MOB-001 customer interviews (10 agencies, 10 product teams).
- MOB-002 competitive teardown.
- MOB-003 16 KB analyzer spike.
- MOB-004 monorepo scaffold.
- **Milestone:** Analyzer detects known-bad `.so`.

### Weeks 3–4: Scan MVP

- MOB-005 dependency graph; MOB-006 Expo SDK detector.
- MOB-007 16 KB registry v0; MOB-008 CLI scan.
- MOB-009 HTML report; MOB-027 GitHub Action.
- **Milestone:** First external scan completed.

### Weeks 5–6: v0.1 launch

- MOB-010 breaking change KB seed content.
- MOB-028 landing page + docs.
- MOB-001 follow-up interviews with scan results.
- **Milestone:** v0.1 public launch.

### Weeks 7–8: Upgrade path

- MOB-011 upgrade target resolver.
- MOB-012–013 codemods (package.json, app.config).
- MOB-016 API scaffold; MOB-017 cloud scan orchestrator.
- **Milestone:** First successful codemod upgrade.

### Weeks 9–10: AI + EAS

- MOB-014 AI fix orchestrator; MOB-015 eval harness.
- MOB-018 EAS OAuth; MOB-019 post-build AAB analyzer.
- MOB-020 GitHub App; MOB-021 auto-fix branch.
- **Milestone:** AI fix PR merged by partner.

### Weeks 11–12: Dashboard + paid

- MOB-024 dashboard MVP; MOB-025 upgrade wizard UI.
- MOB-022–023 preflight + privacy validator (beta).
- MOB-026 billing; MOB-029 case study #1.
- MOB-032 launch campaign; MOB-033 agency view.
- **Milestone:** v0.5 + first 10 paying customers.

---

## 14. AGENT TASK LIST

| ID | Title | Description | Dependencies | Effort | Deliverable | Category |
|----|-------|-------------|--------------|--------|-------------|----------|
| MOB-001 | Customer discovery interviews | 20 interviews with RN/Expo teams and agencies | — | M | Interview synthesis doc | Research |
| MOB-002 | Competitive teardown | Fastlane, Bitrise, Expo, EAS, Renovate analysis | — | S | Competitive matrix | Research |
| MOB-003 | 16 KB analyzer spike | ELF page alignment checker for `.so` files | MOB-001 | M | Spike repo + demo | Engineering |
| MOB-004 | Monorepo scaffold | cli, api, scanner, web packages | — | S | CI-green monorepo | Engineering |
| MOB-005 | Dependency graph scanner | Parse package.json + lockfile; native module detection | MOB-004 | M | Graph builder lib | Engineering |
| MOB-006 | Expo SDK detector | Detect SDK from deps and app.config | MOB-005 | S | SDK detector module | Engineering |
| MOB-007 | 16 KB compatibility registry | DB of package versions with 16KB status | MOB-003 | L | Registry API + seed data | Data |
| MOB-008 | CLI `scan` command | Orchestrate scanners; output JSON/text/html | MOB-005, MOB-006, MOB-007 | M | `shipkit scan` | Engineering |
| MOB-009 | HTML scan report generator | Branded shareable HTML report | MOB-008 | S | Report template | Product |
| MOB-010 | Breaking change knowledge base | Curate Expo SDK migration breaking changes | MOB-001 | L | KB with 50+ entries | Data |
| MOB-011 | Upgrade target resolver | Given scan, compute upgrade path | MOB-007, MOB-010 | M | Resolver algorithm | Engineering |
| MOB-012 | Codemod: package.json bump | jscodeshift codemod for dep upgrades | MOB-011 | M | Codemod + tests | Engineering |
| MOB-013 | Codemod: app.config migrations | Migrate app.json/app.config.js patterns | MOB-012 | M | Config codemod | Engineering |
| MOB-014 | AI fix orchestrator | LLM pipeline for non-mechanical fixes | MOB-010 | L | Orchestrator service | Engineering |
| MOB-015 | AI eval harness | Docker build verify for AI fixes | MOB-014 | M | Harness with pass/fail | Engineering |
| MOB-016 | API service scaffold | Auth, orgs, scans API | MOB-004 | M | API v0 deployed | Engineering |
| MOB-017 | Cloud scan orchestrator | Remote repo clone + scan jobs | MOB-016, MOB-008 | M | Job queue worker | Engineering |
| MOB-018 | EAS OAuth integration | Expo account connect; list builds | MOB-016 | M | EAS OAuth flow | Integration |
| MOB-019 | Post-build AAB analyzer | Download AAB; run 16KB binary check | MOB-003, MOB-018 | M | AAB analysis job | Engineering |
| MOB-020 | GitHub App setup | Permissions for repo scan + PR creation | MOB-016, MOB-008 | M | GitHub App live | Integration |
| MOB-021 | Auto-fix branch creator | Open PR with codemod/AI fixes | MOB-014, MOB-020 | M | Auto-PR E2E test | Engineering |
| MOB-022 | Store preflight rule engine | Apple/Google rule definitions + evaluator | MOB-001 | L | Rule engine v0 | Product |
| MOB-023 | Privacy manifest validator | Check iOS PrivacyInfo.xcprivacy completeness | MOB-022 | M | Validator module | Engineering |
| MOB-024 | Dashboard MVP | Web UI: scans, apps, health scores | MOB-017 | L | app.shipkit.dev | Product |
| MOB-025 | Upgrade wizard UI | Interactive upgrade flow in dashboard | MOB-011, MOB-024 | M | Wizard flow | Product |
| MOB-026 | Billing integration | Stripe per-app and agency tiers | MOB-024 | M | Checkout live | GTM |
| MOB-027 | GitHub Action publish | `shipkit/scan-action` marketplace | MOB-008 | S | Action published | GTM |
| MOB-028 | Landing page + docs | Marketing site, scan CTA, documentation | MOB-008, MOB-009 | M | shipkit.dev live | GTM |
| MOB-029 | Design partner case study #1 | Document agency upgrade success | MOB-025, MOB-018 | S | Published case study | GTM |
| MOB-030 | Expo partner application | Apply to Expo partner program | MOB-018, MOB-029 | S | Application submitted | GTM |
| MOB-031 | SOC 2 readiness checklist | Security policies for enterprise | MOB-017 | M | Checklist doc | Ops |
| MOB-032 | Launch campaign | HN, mobile newsletters, agency outreach | MOB-028, MOB-026 | M | Launch metrics report | GTM |
| MOB-033 | Agency multi-app view | Portfolio dashboard for agencies | MOB-024 | M | Multi-app UI | Product |
| MOB-034 | Slack alert integration | Notify on scan failures | MOB-017 | S | Slack webhook | Integration |
| MOB-035 | False positive feedback loop | User feedback on scan results | MOB-008 | S | Feedback UI + pipeline | Product |

**Critical path:** MOB-001 → MOB-003 → MOB-008 → MOB-018 → MOB-025

---

## 15. Open Questions & Decision Points

| # | Question | Options | Deadline | Owner |
|---|----------|---------|----------|-------|
| 1 | Expo-only vs RN bare support? | Expo-first (chosen) | Week 1 | CEO |
| 2 | AI fix: auto-PR vs suggest only? | Suggest default; auto with flag | Week 9 | Product |
| 3 | Registry: crowdsource vs manual curation? | Hybrid | Week 4 | Eng |
| 4 | Pricing per-app vs per-repo? | Per-app (matches value) | Week 10 | CEO |
| 5 | Build eval locally vs EAS remote? | Local Docker; EAS for partners | Week 9 | Eng |
| 6 | Privacy validator in v0.5 or v1? | Beta in v0.5 | Week 11 | Product |
| 7 | Services revenue (upgrade consulting)? | Offer to agencies at $5K/engagement | Week 8 | CEO |
| 8 | Open source scanner? | CLI core OSS; cloud paid | Week 2 | CEO |
| 9 | Flutter support timeline? | v2.0 evaluation | Month 6 | Product |
| 10 | Expo partnership exclusivity risk? | Non-exclusive integration | Week 12 | CEO |

---

*Document version: 1.0 — Generated for autonomous agent execution. Reframed from "new mobile platform" to ShipKit release wedge.*
