# Billing — COMM-028

Better Slack uses Stripe for subscription billing. v0.1 ships tier stubs; set `STRIPE_SECRET_KEY` for live checkout.

## Tiers

| Tier | Channels | Agents | Posts | SSO | Audit retention |
|------|----------|--------|-------|-----|-----------------|
| Free | 3 | 1 | 10 | No | 7 days |
| Team | 50 | 10 | 500 | No | 90 days |
| Enterprise | Unlimited | Unlimited | Unlimited | Yes | 365 days |

## API

```bash
# Get current tier
GET /api/billing/tier
Authorization: Bearer <token>

# Start checkout (stub returns Stripe URL)
POST /api/billing/checkout
{
  "tier": "team",
  "billingPeriod": "monthly",
  "successUrl": "https://app.better-slack.dev/billing/success",
  "cancelUrl": "https://app.better-slack.dev/billing"
}
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API key (live billing) |
| `STRIPE_PRICE_TEAM_MONTHLY` | Price ID for Team monthly |
| `STRIPE_PRICE_TEAM_ANNUAL` | Price ID for Team annual |
| `STRIPE_PRICE_ENTERPRISE` | Price ID for Enterprise |
| `DEFAULT_BILLING_TIER` | Default tier for new workspaces (`free`) |
| `BILLING_TIER_<workspaceId>` | Per-workspace tier override (testing) |

## Implementation

See `src/billing/stripe.ts` for tier limits and checkout session stub.
