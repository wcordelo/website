# DevSync Private Beta Onboarding

**SYNC-027** — Invite flow for private beta participants.

## Goals

- Onboard design partners (see [design-partners.md](../content/design-partners.md)) without support overload
- Collect structured feedback on git safety, conflict UX, and multi-root workflows
- Gate access while relay infrastructure (SYNC-019) is stubbed

## Invite Flow

```
Landing waitlist (SYNC-024)
        │
        ▼
Design partner outreach (SYNC-025)
        │
        ▼
Manual invite email ──► Beta signup link (unique token)
        │
        ▼
Install guide + pairing walkthrough
        │
        ▼
Week-1 check-in survey
        │
        ▼
Telemetry opt-in prompt (SYNC-028)
```

## Invite Email Template

**Subject:** You're in — DevSync private beta

**Body:**

1. Download: `curl -fsSL https://devsync.dev/install.sh | bash` (placeholder)
2. Run `devsync init` and `devsync add ~/projects/<repo>`
3. Pair second machine: `devsync pair --show-code` on A, `devsync pair <code>` on B
4. Join `#devsync-beta` Slack channel (invite link)
5. Report issues: GitHub Discussions or `feedback@devsync.dev`

## Onboarding Checklist (user-facing)

- [ ] Initialize config (`devsync init`)
- [ ] Add at least one sync root with `default` profile
- [ ] Pair two devices on same LAN (or file-based transport for testing)
- [ ] Verify `.git/` is not synced (`devsync status`)
- [ ] Trigger a conflict intentionally; resolve via `devsync conflicts`
- [ ] Opt in to anonymous telemetry (`devsync telemetry enable`)

## Support Tiers

| Tier | Response SLA | Channels |
|------|--------------|----------|
| Beta blockers | 24h | Slack, email |
| UX feedback | 1 week | Survey, GitHub |
| Feature requests | Backlog | GitHub Discussions |

## Exit Criteria for Open Beta

- 10 design partners synced 3+ roots for 2 weeks without data loss
- Git lock pause (SYNC-016) validated under real `git commit` workloads
- Conflict TUI (SYNC-023) used by 5+ partners without CLI fallback

## Metrics (opt-in only)

- `sync_root_added`, `pairing_completed`, `conflict_detected`, `conflict_resolved`
- No file paths or repository names in telemetry payloads
