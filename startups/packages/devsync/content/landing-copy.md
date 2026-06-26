# DevSync — Landing Page Copy

**SYNC-024** — Marketing content for devsync.dev

---

## Hero

### Headline
**Sync your code. Not your git.**

### Subhead
DevSync keeps your working directories in sync across machines — without corrupting `.git/`, syncing `node_modules`, or silently merging your code.

### CTA
[Join the waitlist](#waitlist) · [Read the git safety guarantee](./docs/git-safety.md)

---

## Problem

You work on a MacBook. You continue on your desktop. You switch to a cloud VM.

Dropbox corrupts your repo. Syncthing syncs 2GB of `node_modules`. Git only moves committed history — not the WIP you need right now.

**Developers deserve sync that understands code.**

---

## Features

### Git-safe by default
`.git/` is **never synced**. Hard guarantee, not a setting. [Learn why →](./docs/git-safety.md)

### `.gitignore` aware
Respects your ignore rules. Built-in profiles for `node_modules` regen, minimal source-only sync, and more.

### Two-way-safe conflicts
Code files are **never auto-merged**. Both versions preserved. You decide.

### Fast, local-first sync
Peers discover each other on your LAN. Content-defined chunking means only changed bytes transfer.

### Works offline
Edit offline. Sync when peers reconnect. No cloud dependency for LAN sync.

---

## How It Works

1. **Install** — `curl -fsSL https://devsync.dev/install | sh`
2. **Add a project** — `devsync add ~/code/myapp`
3. **Pair machines** — 6-word code, done in 30 seconds
4. **Keep working** — Switch machines, pick up where you left off

---

## Pricing Preview

| | Free | Pro ($12/mo) |
|---|------|-------------|
| LAN sync | ✓ | ✓ |
| Peers | 2 | 5 |
| Encrypted relay | — | ✓ |
| `node_modules` regen | — | ✓ |
| Support | Community | Email |

*LAN sync free forever. No credit card for beta.*

---

## Social Proof (placeholder)

> "I corrupted two repos with Dropbox before switching to DevSync. Zero incidents in 6 months."
> — Beta user, indie developer

---

## Waitlist

### Headline
Be first to sync without fear.

### Form
- Email address
- Primary OS (macOS / Linux / Windows)
- How many machines do you sync between?

### Privacy
No spam. Beta invites only. Unsubscribe anytime.

---

## Footer

- [Architecture RFC](./spec/architecture-rfc.md)
- [Git Safety Guarantee](./docs/git-safety.md)
- [GitHub](https://github.com/theo-startups/devsync)
- Twitter / Mastodon / Discord (coming)

**DevSync** — Built for developers who've been burned by Dropbox.

© 2026 DevSync. All rights reserved.
