# BenchTrust Procurement Compliance Pack

**Task ID:** BENCH-032  
**Related:** BENCH-024 (SOC 2 readiness)

---

## Security Questionnaire (Summary Responses)

### Data Handling

| Question | Response |
|----------|----------|
| Where is holdout data stored? | Encrypted at rest (AES-256-GCM); client-side encryption option; S3-compatible backend |
| Who can access raw tasks? | Time-limited eval worker tokens only; decrypted inside sealed runtime |
| Is data used for model training? | **No** — contractual prohibition for all partners |

### Runtime Security

| Question | Response |
|----------|----------|
| Network egress | **Disabled** — `network_mode: none` |
| Filesystem | Read-only root; writable `/workspace` only |
| Grader isolation | Separate sidecar container; agent cannot modify tests |

### Audit & Logging

| Question | Response |
|----------|----------|
| Access audit trail | Vault audit log (store/retrieve/list/delete) |
| Eval reproducibility | Methodology version hash on every scorecard |
| Contamination monitoring | Canary strings + CRS scoring |

---

## Data Processing Agreement (DPA) — Key Terms

1. **Processor role:** BenchTrust processes partner-licensed task metadata for evaluation only.
2. **Subprocessors:** Cloud storage (AWS/GCP), sealed compute workers — list available on request.
3. **Retention:** Eval artifacts 12 months; vault tasks retained per license agreement.
4. **Breach notification:** 72 hours per GDPR-aligned terms.
5. **Data residency:** US default; EU region available Enterprise tier.

---

## SLA Template (Enterprise)

| Metric | Commitment |
|--------|------------|
| Eval completion | 10 business days from task vault sync |
| Scorecard delivery | Within 2 business days of eval completion |
| API uptime | 99.5% monthly |
| Support response | 4h critical / 24h standard |
| Canary leak investigation | 48h initial response |

---

## Included Documents (v0.1)

- [ ] Security questionnaire (full) — *template stub*
- [ ] DPA template — *legal review required*
- [ ] SLA template — above
- [ ] Pricing reference — `pricing.md` (BENCH-023)
- [ ] Methodology manifesto — `research/methodology-manifesto.md` (BENCH-002)

---

*Procurement pack v0.1 — distribute under NDA for enterprise evals*
