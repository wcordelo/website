# DevSync Design Partner Program

**SYNC-025** — Early adopter outreach for Dropbox-for-developers positioning.

## Target Partners

| Segment | Why | Example teams |
|---------|-----|----------------|
| Polyglot freelancers | Multiple machines, no IT | Solo devs with Mac + Linux |
| Small eng teams (2–8) | Shared dotfiles + monorepo roots | Early-stage startups |
| OSS maintainers | Cross-device contributor setup | Library authors |

## Value Proposition

- **Git-safe by default** — unlike Syncthing/Dropbox, `.git/` never touched
- **Ignore-aware** — respects `.gitignore` and `node_regen` for lockfile-only sync
- **Developer conflicts** — side-by-side files, never silent merges

## Outreach Script

> We're building DevSync — sync for working directories that respects git and `.gitignore`. Looking for 5 design partners to run it on 2+ machines for 2 weeks. You get direct Slack access to the team; we get honest feedback on conflicts and pairing.

## Partner Commitments

| DevSync provides | Partner provides |
|------------------|------------------|
| Private beta access | 2+ synced machines |
| Slack support channel | Weekly 15-min feedback |
| Influence on roadmap | Public testimonial if satisfied |

## Selection Criteria

1. Active git repos with real daily commits
2. At least one `node_modules` or `target/` heavy project (tests ignore profiles)
3. Willingness to test conflict resolution under parallel edits

## Tracking

| Partner | Segment | Roots | Status |
|---------|---------|-------|--------|
| _TBD_ | Freelancer | 2 | Invited |

## Coordination

Coordinate with NPM-028 and GIT-025 outreach to avoid contacting the same teams twice (see AGENT-TASKS.md).

## Next Steps

1. Send invites from waitlist (SYNC-024 landing page)
2. Onboard via [beta-onboarding.md](./beta-onboarding.md) (SYNC-027)
3. Collect Week-1 survey before expanding beta
