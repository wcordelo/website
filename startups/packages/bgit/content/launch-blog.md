# Git Was Not Built For Agents

*Launch post — bgit v0.1*

Git tells you **what** changed. It does not tell you **why**.

When a human edits `auth.ts`, they remember the bug report, the Slack thread, the failing test. When an agent edits `auth.ts`, the commit message might say "fix auth" — and six months later, nobody knows which prompt produced the change, which session it belonged to, or whether it was intentional.

We built **bgit** because git was not built for agents.

## The agent commit problem

Agent-assisted repos accumulate a new kind of technical debt: **unexplained commits**. Our benchmark (GIT-026) on synthetic agent workflows shows roughly 40% of commits lack a traceable link to intent — not because developers are careless, but because git's object model has no slot for session metadata.

You can add trailers. You can write better commit messages. You can ask the agent to explain itself. None of that survives squash, rebase, or "just fix it quickly" Fridays.

## What bgit is

bgit is a **git overlay**. Your remotes, branches, and `git push` workflow stay the same. A `.bgit/` directory stores:

- **Sessions** — goal, agent, user, timestamps
- **Checkpoints** — diff stats and file touches mid-session
- **Trace** — redacted agent logs linked to checkpoints
- **Secrets** — encrypted vault with OS keychain integration

```bash
bgit session start --goal "Fix authentication bug"
# ... agent works ...
bgit checkpoint
bgit session end --squash
bgit why src/auth.ts
```

`bgit why` walks backward: file → checkpoint → session → intent. `bgit trace` walks forward: commit → session → tool calls.

Git was built for patches. bgit is built for **provenance**.

## Git compatibility first

We are not replacing git. We are not asking you to migrate to jj (though we are evaluating it — GIT-029). `bgit export` strips the overlay and verifies a plain `git clone` still works. Your team can adopt bgit one repo at a time; teammates without bgit see normal commits.

## Security by default

Agents read secrets. Git indexes secrets. Those facts collide.

- Encrypted secret vault (AES-256-GCM)
- macOS Keychain for master key wrapping; file fallback at `~/.bgit/keys/`
- Smudge/clean git filter: `bgit-secret:API_KEY` in the index, real values only in the working tree
- Redaction before any log hits disk
- MCP `secret_get` gated behind `BGIT_MCP_SECRET_GET=1`

See our threat model (GIT-031) for the full picture.

## MCP: agents use bgit without learning bgit

Claude Code and compatible clients connect via `bgit mcp`. Ten tools — session start/end, checkpoint, why, trace, diff — let agents record intent as a side effect of work. The goal is invisibility: the agent checkpoints; the human reviews with `bgit why` in PRs.

## What we are shipping in v0.1

- Session lifecycle with squash
- Checkpoint + auto-checkpoint hooks
- `why` and `trace`
- Secret vault + git filter
- JSON output for scripting
- Homebrew formula

## What comes next

- Design partner program — 5 teams, weekly feedback (GIT-025)
- Policy engine — require session before commit (GIT-028)
- Semantic diff — function-level intent-aware diffs (GIT-030)
- Cursor log adapter (GIT-022)

## Try it

```bash
brew install bgit   # or build from source
cd your-repo && bgit init
bgit session start --goal "Your first agent session"
```

Read the docs. Run a session. Tell us what breaks.

**Git tells you what. bgit tells you why.**

---

*Interested in the design partner program? See `gtm/design-partner-program.md` or reach out via the waitlist.*
