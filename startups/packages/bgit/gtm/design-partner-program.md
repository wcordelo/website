# GIT-025: bgit Design Partner Program

**Goal:** Recruit 5 engineering teams using AI agents daily; validate session/checkpoint/why workflows and MCP integration.

## Ideal Partner Profile

- 3+ engineers shipping agent-assisted code weekly
- Claude Code, Cursor, or custom MCP agents in production
- Pain: unexplained commits, lost context, secret leakage anxiety
- Willing to share anonymized commit noise metrics (GIT-026)

## Program Structure

| Phase | Duration | Focus |
|-------|----------|-------|
| Onboarding | Week 1 | `bgit init`, session workflow, MCP config |
| Active use | Weeks 2–8 | Daily sessions, weekly feedback |
| Expansion | Weeks 9–12 | Squash, secrets, policy hooks |

## Feedback Cadence

### Weekly (30 min)

1. **Usage** — sessions/week, checkpoint frequency, `why`/`trace` usage
2. **Friction** — CLI errors, hook conflicts, MCP tool gaps
3. **Value** — time saved finding intent; commit noise delta
4. **Security** — secret vault, filter behavior, redaction misses

### Bi-weekly (async)

- Slack thread or GitHub discussion with tagged issues
- Partner submits one "mystery commit" story (before/after bgit)

### Monthly

- Review benchmark data vs GIT-026 synthetic baseline
- Prioritize v0.5 roadmap items from partner votes

## Agreement Template

```
DESIGN PARTNER AGREEMENT — bgit v0.1

Parties:
  Provider: [Company Name] ("bgit")
  Partner:  [Team / Company Name] ("Partner")

Term: 12 weeks from Effective Date: [DATE]

1. License Grant
   Partner receives early access to bgit CLI and MCP server at no charge
   during the Term. Software is provided "as-is" under MIT license.

2. Partner Commitments
   a. Run `bgit init` in at least one active repository
   b. Start a bgit session before agent work ≥3 days/week
   c. Attend weekly 30-minute feedback call (or async substitute)
   d. Report P0 bugs within 24 hours
   e. Allow anonymized usage metrics (opt-in telemetry when available)

3. Provider Commitments
   a. Priority support channel (Slack invite or GitHub Discussions)
   b. Bi-weekly builds with partner-requested fixes where feasible
   c. Public credit optional (logo on docs.bgit.dev with permission)
   d. No charge during Term; pricing discussion deferred to v1.0

4. Confidentiality
   Partner may share feedback publicly. Partner secrets and repo names
   remain confidential unless Partner opts into case study.

5. Data
   Session metadata stays in Partner's `.bgit/` directory. Provider does
   not access Partner repos without explicit screen-share or export.

6. Termination
   Either party may exit with 7 days notice. Partner retains MIT-licensed
   software; feedback obligations end.

Signed:

_________________________  Date: _______
Partner Representative

_________________________  Date: _______
bgit Representative
```

## Recruitment Channels

1. HN launch post (GIT-032) — "design partner" CTA
2. Claude / Cursor community Discords
3. Warm intros from investors and OSS maintainers
4. `bgit trace` demo videos in partner onboarding doc

## Success Metrics

| Metric | Target (Week 8) |
|--------|-----------------|
| Signed partners | 5 |
| Weekly active repos | 5 |
| Sessions per partner / week | ≥10 |
| `why` lookups / week | ≥5 |
| Commit noise reduction | ≥30% vs baseline |

## Onboarding Checklist

- [ ] Send agreement for signature
- [ ] Schedule Week 1 kickoff
- [ ] Share install: `brew install bgit` or `bun link`
- [ ] Configure MCP in Claude Code / Cursor
- [ ] Set `BGIT_MASTER_KEY` or verify keychain (GIT-018)
- [ ] Enable smudge/clean filter for `.env` (GIT-019)
- [ ] Baseline commit noise count (pre-bgit week)

## Escalation

| Severity | Response |
|----------|----------|
| P0 — data loss, secret in git | 4h, hotfix branch |
| P1 — broken session/MCP | 24h |
| P2 — UX friction | Next sprint |
| P3 — feature request | Backlog vote |
