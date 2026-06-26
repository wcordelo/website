# SOC 2 Readiness Checklist (NPM-031)

**Target:** SOC 2 Type I audit — Q4 2026  
**Scope:** bnpm control plane API (NPM-023), CLI telemetry (opt-in), registry proxy (NPM-025)

## Trust service criteria mapping

### Security (CC)

| Control | Status v0.1 | Evidence |
|---------|-------------|----------|
| CC6.1 Logical access | Planned | IAM roles doc |
| CC6.6 Encryption in transit | Planned | TLS 1.3 on API |
| CC6.7 Encryption at rest | Planned | S3 SSE-KMS |
| CC7.2 System monitoring | Planned | CloudWatch / Fly metrics |

### Availability (A)

| Control | Status | Notes |
|---------|--------|-------|
| A1.2 Recovery | Planned | RTO 4h for control plane |

### Confidentiality (C)

| Control | Status | Notes |
|---------|--------|-------|
| C1.1 Confidential data | In progress | No PII in v0.1 CLI |

## Policies required

- [ ] Information Security Policy
- [ ] Access Control Policy
- [ ] Incident Response Plan (link NPM-012/013 flows)
- [ ] Vendor Management (Socket, AWS, Stripe)
- [ ] Change Management (GitHub PR + CI)

## Access controls

- Production: SSO + MFA required
- Break-glass: 2-person approval
- API keys: scoped per org; 90-day rotation

## Evidence collection

- GitHub audit log export
- CI/CD deployment logs
- Pen test report (NPM-030)
- Blocklist change approval tickets

## v0.1 gap acknowledgment

CLI-only v0.1 has **minimal SOC 2 scope**. Type I targets control plane launch (NPM-023/024).

## Next steps

1. Engage auditor by Week 10
2. Complete NPM-030 pen test before Type I
3. Share policy templates with COMM-033, BENCH-024 tracks
