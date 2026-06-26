# SOC 2 Readiness Assessment

**Task ID:** BENCH-024  
**Target:** SOC 2 Type I audit — Q4 2026  
**Scope:** Holdout vault (BENCH-007), sealed runtime (BENCH-009), API (BENCH-020), dashboard (BENCH-021)

---

## Executive Summary

BenchTrust v0.1 stores encrypted holdout tasks and runs agent evals in network-isolated containers. SOC 2 Type I readiness focuses on **Security** and **Confidentiality** trust criteria for vault data and eval artifacts. Availability controls are planned for production API launch.

---

## Trust Service Criteria Mapping

### Security (CC)

| Control | Status v0.1 | Evidence |
|---------|-------------|----------|
| CC6.1 Logical access | In progress | Vault ACL per `licenseId`; API auth planned |
| CC6.6 Encryption in transit | Planned | TLS 1.3 on API (port 3848) |
| CC6.7 Encryption at rest | Implemented | AES-256-GCM vault blobs (`holdout-vault.ts`) |
| CC6.8 Key management | In progress | scrypt-derived keys; prod: KMS/HSM |
| CC7.2 System monitoring | Planned | Vault audit log + API access logs |
| CC7.3 Incident detection | Planned | Canary leak alerts (BENCH-008) |

### Confidentiality (C)

| Control | Status | Notes |
|---------|--------|-------|
| C1.1 Confidential data identification | Implemented | Holdout tasks classified confidential |
| C1.2 Confidential data disposal | Planned | Vault delete + secure wipe procedure |
| C1.3 Access restrictions | In progress | Per-partner vault slices; no public export |

### Availability (A)

| Control | Status | Notes |
|---------|--------|-------|
| A1.2 Recovery | Planned | RTO 4h for API; vault backup daily |
| A1.3 Processing integrity | In progress | Sealed runtime integrity checks |

---

## Vault-Specific Controls

| Control | Implementation |
|---------|----------------|
| Encryption at rest | AES-256-GCM with per-vault salt (`src/vault/holdout-vault.ts`) |
| Audit trail | Append-only `audit.log` for store/retrieve/list/delete |
| Access control | Actor-tagged operations; production: IAM + API keys |
| Canary monitoring | Unique watermarks per eval (BENCH-008) |
| No egress | Sealed Docker `networkMode: none` (BENCH-009) |

---

## Runtime Security

| Control | Implementation |
|---------|----------------|
| Network isolation | No egress from agent container |
| Read-only root FS | Except `/workspace` mount |
| Grader sidecar | Tests inaccessible to agent |
| Trajectory logging | All tool calls retained for audit (BENCH-017) |

---

## Policies Required

- [ ] Information Security Policy
- [ ] Access Control Policy
- [ ] Incident Response Plan (vault leak playbook)
- [ ] Vendor Management (cloud provider, W&B integration)
- [ ] Change Management (GitHub PR + CI)
- [ ] Data Classification Policy (holdout = Restricted)
- [ ] Secure Development Lifecycle (SDLC) Policy

---

## Access Controls

| Environment | Requirement |
|-------------|-------------|
| Production vault | SSO + MFA; break-glass 2-person approval |
| API keys | Scoped per org; 90-day rotation |
| QA reviewers | No vault write; queue access only |
| CI/CD | OIDC to cloud; no long-lived secrets |

---

## Evidence Collection

| Artifact | Frequency |
|----------|-----------|
| GitHub audit log export | Monthly |
| Vault audit.log archive | Continuous |
| API access logs | Continuous |
| Penetration test report | Pre-Type I |
| Change management tickets | Per deploy |
| QA reviewer audit trail | Per task approval |

---

## Gap Analysis

| Gap | Severity | Remediation | Target |
|-----|----------|-------------|--------|
| API authentication not implemented | High | JWT + API keys (BENCH-020 v1) | Week 12 |
| Master key in env var (dev default) | Critical | KMS integration | Week 10 |
| No formal IR playbook | Medium | Draft incident response doc | Week 8 |
| Dashboard lacks auth | Medium | SSO proxy in front of Vite | Week 14 |
| No automated backup | Medium | S3 vault snapshot cron | Week 11 |

---

## Shared Templates

Policy templates may be shared with:
- NPM-031 (bnpm SOC 2)
- COMM-033 (Better Slack SOC 2)
- MOB-031 (ShipKit SOC 2)

---

## Next Steps

1. Engage auditor by Week 10
2. Complete pen test before Type I observation period
3. Rotate dev master key; deploy KMS in staging
4. Implement API authentication before production partners
5. Link procurement pack (BENCH-032) security questionnaire answers

---

*v0.1 acknowledgment: CLI and local vault have reduced scope. Type I targets production API + hosted vault.*

*BenchTrust Compliance — BENCH-024*
