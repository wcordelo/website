# SOC 2 Readiness Checklist (MOB-031)

Security and compliance preparation for ShipKit enterprise tier.

## Trust Service Criteria

### CC1 — Control Environment

- [ ] Security policies documented and approved by leadership
- [ ] Roles and responsibilities defined (eng, ops, security)
- [ ] Background checks for employees with data access
- [ ] Code of conduct and security awareness training

### CC2 — Communication

- [ ] Security incident reporting process published
- [ ] Customer security contact documented
- [ ] Status page for service availability

### CC3 — Risk Assessment

- [ ] Annual risk assessment completed
- [ ] Vendor risk assessment for third-party services (AWS, Stripe, etc.)
- [ ] Threat model for scan data handling

### CC6 — Logical Access

- [ ] SSO/MFA enforced for all internal systems
- [ ] Principle of least privilege for production access
- [ ] Access reviews quarterly
- [ ] API keys rotated on schedule

### CC7 — System Operations

- [ ] Production deployment requires PR review
- [ ] Automated CI/CD with security scanning
- [ ] Infrastructure as code (Terraform/Pulumi)
- [ ] Logging and monitoring for all services

### CC8 — Change Management

- [ ] Change approval process for production
- [ ] Rollback procedures documented and tested
- [ ] Dependency update policy

### CC9 — Risk Mitigation

- [ ] Encryption at rest (AES-256) for customer scan data
- [ ] Encryption in transit (TLS 1.2+)
- [ ] Secrets managed via vault (not env files in repos)
- [ ] Data retention policy (scan results: 90 days default)

## ShipKit-Specific Controls

### Scan Data Handling

- [ ] Repo clones deleted after scan completion
- [ ] No source code stored beyond scan metadata
- [ ] Customer opt-in for anonymized registry contributions (MOB-035)
- [ ] Data processing agreement (DPA) template ready

### API Security

- [ ] Rate limiting on all endpoints
- [ ] OAuth 2.0 for third-party integrations (EAS, GitHub)
- [ ] Audit log for admin actions
- [ ] Penetration test before enterprise launch

### Availability

- [ ] 99.9% uptime SLA target documented
- [ ] Disaster recovery plan (RPO < 1h, RTO < 4h)
- [ ] Multi-region backup for scan metadata DB

## Evidence Collection

| Control | Evidence Type | Owner | Status |
|---------|--------------|-------|--------|
| MFA enforcement | Screenshot + policy doc | Eng | Pending |
| Encryption at rest | AWS RDS config export | Ops | Pending |
| Access reviews | Quarterly review log | Security | Pending |
| Incident response | Tabletop exercise report | Ops | Pending |

## Timeline

| Phase | Target | Milestone |
|-------|--------|-----------|
| Policy docs | Month 3 | Security policy v1 published |
| Technical controls | Month 4 | Encryption + MFA live |
| Type I audit | Month 6 | SOC 2 Type I report |
| Type II audit | Month 12 | SOC 2 Type II report |

## References

- [AICPA Trust Services Criteria](https://www.aicpa.org/resources/landing/system-and-organization-controls-soc-2)
- [Vanta SOC 2 guide](https://www.vanta.com/products/soc-2)
- ShipKit data flow diagram (TODO: MOB-017)
