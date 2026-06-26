# SOC 2 Readiness Checklist — COMM-033

**Target:** SOC 2 Type I audit — Q4 2026  
**Scope:** Better Slack API, web UI, agent integration layer, billing

## Trust service criteria mapping

### Security (CC)

| Control | Status v0.1 | Evidence |
|---------|-------------|----------|
| CC6.1 Logical access | Planned | Email auth stub; SAML via WorkOS (COMM-029) |
| CC6.2 Credential management | Gap | API keys stored plaintext — see COMM-032 P0 |
| CC6.6 Encryption in transit | Planned | TLS 1.3 on production |
| CC6.7 Encryption at rest | Planned | SQLite → Postgres with encryption |
| CC7.2 System monitoring | Planned | Structured logs + audit_log table |

### Availability (A)

| Control | Status | Notes |
|---------|--------|-------|
| A1.2 Recovery | Planned | RTO 4h for API; SQLite backup daily |

### Confidentiality (C)

| Control | Status | Notes |
|---------|--------|-------|
| C1.1 Confidential data | In progress | Thread content in SQLite; no PII beyond email |

### Processing Integrity (PI)

| Control | Status | Notes |
|---------|--------|-------|
| PI1.1 Processing accuracy | In progress | Agent proposal approval flow (COMM-018) |

## Policies required

- [ ] Information Security Policy
- [ ] Access Control Policy
- [ ] Incident Response Plan
- [ ] Vendor Management (Stripe, WorkOS, GitHub, Linear, Slack)
- [ ] Change Management (GitHub PR + CI)
- [ ] Data Retention Policy (audit log, message history)

## Access controls

- Production: SSO + MFA required (WorkOS SAML)
- Break-glass: 2-person approval
- Agent API keys: scoped per capability; 90-day rotation target
- Human sessions: 7-day expiry (current default)

## Agent-specific controls

- All agent actions logged to `audit_log` (COMM-017)
- Capability engine with deny-wins (COMM-016)
- Human approval required for agent-proposed posts (COMM-018)
- See `docs/agent-permissions-review.md` for full review

## Evidence collection

- GitHub audit log export
- CI/CD deployment logs
- Agent audit log queries (`GET /api/agents/audit`)
- Pen test report (planned pre-Type I)
- Stripe billing event logs

## v0.1 gap acknowledgment

SQLite single-file DB, stub auth, and plaintext agent keys mean **minimal SOC 2 scope** in v0.1. Type I targets production Postgres deployment with SAML SSO and hashed credentials.

## Next steps

1. Complete COMM-032 P0 items (key hashing, admin-only registration)
2. Migrate to Postgres with encryption at rest
3. Engage auditor by Week 10 of design partner program
4. Pen test before Type I window
