# Penetration Test Checklist (NPM-030)

Third-party security review scope for bnpm CLI, control plane API, registry proxy, and dashboard.

**Target:** Type I readiness before enterprise sales (pairs with NPM-031 SOC 2).

---

## 1. CLI (`bnpm` / `bnpx`)

- [ ] Command injection via passthrough args to `npm` subprocess
- [ ] Path traversal in `.better-npmrc` / blocklist file loading
- [ ] Malicious blocklist bundle (oversized JSON, prototype pollution)
- [ ] Tarball diff parser — zip bomb / decompression bomb in `npm pack` output
- [ ] Environment variable leakage (`BNPM_*`, `NPM_TOKEN`) in logs
- [ ] Symlink attacks in `bnpm init` file writes
- [ ] Privilege escalation via `emergency deprecate --execute`

## 2. Control Plane API (port 3850)

- [ ] Unauthenticated access to policy CRUD
- [ ] IDOR on `/api/v1/policies/:id` across orgs
- [ ] API key brute-force / prefix enumeration
- [ ] Mass assignment in policy POST/PUT bodies
- [ ] Audit log injection / XSS in dashboard rendering
- [ ] Rate limiting on `/api/v1/blocks` event ingestion
- [ ] CORS misconfiguration (overly permissive origins)
- [ ] SSRF via webhook URL fields (future)

## 3. Registry Proxy (NPM-025)

- [ ] Bypass block via URL encoding (`%40` for `@`)
- [ ] Cache poisoning between tenants
- [ ] Upstream registry SSRF (custom `upstream` config)
- [ ] Denial of service via large tarball passthrough
- [ ] TLS verification on upstream fetch

## 4. Dashboard (NPM-024)

- [ ] Stored XSS in policy editor textarea
- [ ] CSRF on policy save endpoint
- [ ] Session fixation / missing auth on MVP routes
- [ ] Sensitive data in client-side mock fallbacks

## 5. Integrations

- [ ] Slack webhook URL validation (no internal network SSRF)
- [ ] Stripe webhook signature verification
- [ ] Webhook replay attacks

## 6. Supply Chain

- [ ] Dependency audit (`bun audit` / `npm audit`)
- [ ] Sigstore provenance on release artifacts (NPM-032)
- [ ] GitHub Action token scope minimization

## 7. Infrastructure (when deployed)

- [ ] TLS 1.2+ only, HSTS enabled
- [ ] Secrets in env, not in repo
- [ ] Database encryption at rest
- [ ] Backup and restore tested
- [ ] WAF rules on public endpoints

---

## Remediation workflow

1. Engage pen test firm (recommend: Cobalt, Bishop Fox, or NCC Group).
2. Provide staging environment with test org credentials.
3. Triage findings: Critical/High within 7 days, Medium within 30 days.
4. Re-test fixes before Type I SOC 2 audit.
5. Publish summary to enterprise prospects under NDA.

## Evidence collection

- Pen test report PDF
- Remediation tickets (Linear/GitHub Issues)
- Re-test confirmation letter
- Link from `docs/soc2-readiness.md`
