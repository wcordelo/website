# Agent Permissions Security Review — COMM-032

**Review date:** 2026-06-26  
**Scope:** Agent capability engine, registry, audit log, proposal flow  
**Reviewer:** Engineering (v0.1 self-review)

## Architecture summary

```
Agent request → X-Agent-Key auth → Capability engine → Allow/Deny
                                              ↓
                                        Audit log entry
```

Agents authenticate via `X-Agent-Key` header. Capabilities are evaluated per-action with resource patterns. **Deny wins over allow** (COMM-016).

## Threat model

| Threat | Mitigation | Status |
|--------|------------|--------|
| Stolen agent API key | Key rotation, rate limits, audit log | Partial — rotation manual in v0.1 |
| Agent writes to private channels | Deny rules on `channel:#private` | ✅ Tested |
| Agent publishes posts without approval | `post:propose` creates `proposed` status; human must approve | ✅ |
| Agent impersonates human | `created_by_type = 'agent'` on all agent actions | ✅ |
| Privilege escalation via capability edit | Only workspace admins can register agents (v0.1: any member) | ⚠️ Gap |
| Audit log tampering | Append-only SQLite table | ✅ v0.1; needs immutability in prod |

## Capability patterns reviewed

| Capability | Default CI Reporter | Risk |
|------------|---------------------|------|
| `thread:write` | Allow `channel:#ci` | Low — scoped channel |
| `post:propose` | Allow `*` | Medium — requires human approval |
| `channel:read` | Deny `channel:#private` | Low — explicit deny |

## Recommendations (pre-launch)

### P0 — Must fix before production agents

1. **Admin-only agent registration** — restrict `POST /api/agents` to workspace admins
2. **API key hashing** — store bcrypt hash, not plaintext `api_key`
3. **Rate limiting** — enforce `rate_limit` column per agent (currently schema-only)

### P1 — Should fix

4. **Capability change audit** — log when capabilities are added/removed
5. **Proposal expiry** — auto-reject `proposed` posts after 7 days
6. **Webhook signature verification** — GitHub, Linear, Slack (Slack stub has signature check)

### P2 — Nice to have

7. **Agent sandbox mode** — dry-run capability evaluation without side effects
8. **Per-thread agent allowlist** — restrict agents to specific threads
9. **MCP tool scoping** — align MCP server tools with capability engine

## Test coverage

| Test | File |
|------|------|
| Deny wins on #private | `tests/api.test.ts` |
| Agent propose → human approve | `tests/features.test.ts` |
| Audit log records actions | `tests/api.test.ts` |

## Sign-off

v0.1 is suitable for **design partner beta** with human-in-the-loop approval for all agent writes. Not ready for unsupervised agent production without P0 fixes.
