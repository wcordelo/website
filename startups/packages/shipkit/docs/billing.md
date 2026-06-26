# Billing Integration (MOB-026)

Stripe tier stubs for ShipKit v0.1. Production billing ships with dashboard GA.

## Pricing Tiers

| Tier | Price | Apps | Scans/mo | Features |
|------|-------|------|----------|----------|
| **Free** | $0 | 1 | 10 | CLI scan, HTML report, GitHub Action |
| **Team** | $49/mo | 5 | 100 | Dashboard, Slack alerts, upgrade wizard |
| **Agency** | $199/mo | 25 | 500 | Portfolio view, white-label reports, priority support |
| **Enterprise** | Custom | Unlimited | Unlimited | SSO, SOC 2 report, dedicated registry, SLA |

## Stripe Product IDs (stub)

```
prod_shipkit_free     → price_free_000
prod_shipkit_team     → price_team_4900
prod_shipkit_agency   → price_agency_19900
prod_shipkit_enterprise → contact_sales
```

## Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Provision org, set tier in `organizations.plan` |
| `customer.subscription.updated` | Sync tier limits (app count, scan quota) |
| `customer.subscription.deleted` | Downgrade to Free, retain scan history 30 days |
| `invoice.payment_failed` | Email admin, grace period 7 days |

## Implementation Notes

- Metered billing for scans over quota: `$0.10/scan` (Team), `$0.05/scan` (Agency).
- Annual discount: 2 months free on Team and Agency annual plans.
- Design partners (MOB-029): 6-month Team tier comped via Stripe coupon `DESIGN_PARTNER_100`.

## Env Vars

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TEAM=price_team_4900
STRIPE_PRICE_AGENCY=price_agency_19900
```

## API Endpoints (planned)

- `POST /billing/checkout` — create Stripe Checkout session
- `GET /billing/portal` — customer portal redirect
- `GET /billing/usage` — current scan quota consumption
