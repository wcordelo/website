# Getting Started with bgit

bgit is an agent-native git overlay. Git stays canonical; bgit adds sessions, checkpoints, and provenance.

## Install

```bash
cd startups && bun install
bun run bgit -- --version
```

Or via Homebrew (see `formula/bgit.rb`).

## Quick Start

```bash
cd your-git-repo
bun run bgit init
bun run bgit session start --goal "Fix login bug"
# ... agent work ...
bun run bgit checkpoint "WIP: rate limiting"
bun run bgit session end --squash
bun run bgit why src/auth/login.ts:42
bun run bgit trace sess_abc123
```

## MCP Server

```bash
bun run bgit mcp
```

Expose 10 tools to agents: `session_start`, `session_end`, `intent_create`, `status`, `diff`, `why`, `checkpoint`, `secret_get` (gated), `log`, `workspace_add` (stub).

Enable secret access:

```bash
BGIT_MCP_SECRET_GET=1 bgit mcp
```

## JSON Mode

All commands support `--json` for scripting.

## Secrets

```bash
BGIT_SECRET_VALUE=sk-xxx bgit secret set API_KEY
bgit secret get API_KEY
```

Secrets are encrypted with AES-256-GCM in `.bgit/secrets/`.
