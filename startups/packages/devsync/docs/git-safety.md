# Why DevSync Won't Corrupt Your Git Repo

**SYNC-026** — Public safety guarantee  
**Last updated:** 2026-06-26

## The Problem

Dropbox, Google Drive, and iCloud were not built for git repositories. When two machines sync the same `.git/` directory concurrently, you risk:

- **Corrupted index** — `.git/index` written mid-operation
- **Stale lock files** — `.git/index.lock` synced between machines
- **Ref corruption** — Concurrent writes to `.git/refs/`
- **Pack file damage** — Partial object writes during `git fetch`

These failures are rare but catastrophic: your entire version history can become unreadable.

## DevSync's Guarantee

> **`.git/` is never synced unless you explicitly set `dangerously_sync_git: true` in your config.**

This is not a preference or a profile setting. It is a **hard exclude** checked before every other ignore rule.

## How It Works

### 1. Hard Exclude (SYNC-007)

Every file path is checked against git-internal paths before sync:

```
src/index.ts     → sync allowed
node_modules/    → ignored (profile)
.git/            → HARD EXCLUDED (never synced)
.git/config      → HARD EXCLUDED
.git/index.lock  → HARD EXCLUDED
```

The check runs in `ignore/git-exclude.ts` and cannot be overridden by `.gitignore` or profiles.

### 2. Lock Awareness (SYNC-016, coming)

When `.git/index.lock` exists locally, DevSync pauses sync for that repository root. This prevents pushing a lock file or syncing while git is mid-operation.

### 3. What Gets Synced Instead

DevSync syncs your **working tree** — the files you edit:

- Source code (`src/`, `lib/`, etc.)
- Config files (`.env.example`, `tsconfig.json`)
- Uncommitted changes and WIP branches' working files

Git history stays local. Each machine maintains its own `.git/` directory. You use `git push` / `git pull` for history; DevSync for working files.

## Comparison

| Scenario | Dropbox | Syncthing | DevSync |
|----------|---------|-----------|---------|
| Syncs `.git/` by default | Yes | Yes | **No** |
| Understands `.gitignore` | No | No | **Yes** |
| Pauses on `index.lock` | No | No | **Yes** (SYNC-016) |
| Documented guarantee | No | No | **Yes** |

## Opt-In Danger Mode

For advanced users who understand the risks:

```yaml
# ~/.devsync/sync.yaml
dangerously_sync_git: true
```

This is intentionally difficult to enable:
- Not available via CLI flags
- Not shown in any UI
- Requires manual config edit
- Logged on every sync operation

**We strongly recommend against this.** Use git remotes for history sync.

## Test Suite

Our safety guarantee is backed by automated tests:

```bash
cd startups/packages/devsync
bun test tests/git-exclude.test.ts
```

Tests verify:
- `.git/` paths always excluded
- `.git/index.lock` excluded
- Nested `.git` modules excluded
- Danger flag allows override
- Profile and `.gitignore` cannot override hard exclude

## Reporting Issues

If DevSync ever syncs `.git/` without `dangerously_sync_git: true`, that is a **P0 bug**. Report immediately:

- GitHub Issues: `theo-startups/devsync`
- Email: safety@devsync.dev

We treat git safety incidents as existential risks to the product.

---

*DevSync — sync your code, not your git internals.*
