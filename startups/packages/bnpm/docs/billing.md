# bnpm Billing (NPM-026)

Stripe-backed subscription billing for Team and Enterprise tiers.

## Tiers

| Tier | Price | Seats | Stripe Price ID |
|------|-------|-------|-----------------|
| **Free** | $0 | 3 | — |
| **Team** | $49/mo | 25 (+$5/extra seat) | `STRIPE_PRICE_TEAM` |
| **Enterprise** | Custom | Unlimited | `STRIPE_PRICE_ENTERPRISE` |

## Environment variables

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

## Checkout flow

1. User selects tier in dashboard (`app.betternpm.dev/billing`).
2. Control plane calls `StripeBillingStub.createCheckoutSession()`.
3. User completes Stripe Checkout.
4. Webhook `checkout.session.completed` activates org subscription.

## Webhook events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate tier, provision seats |
| `customer.subscription.updated` | Sync seat count |
| `customer.subscription.deleted` | Downgrade to Free |
| `invoice.payment_failed` | Email admin, grace period 7 days |

## Implementation

See `src/billing/stripe.ts` for tier definitions and stub checkout/webhook handlers.
Wire to the real Stripe SDK when deploying the control plane (NPM-023).

## Feature gating

| Feature | Free | Team | Enterprise |
|---------|------|------|------------|
| CLI blocklist | ✓ | ✓ | ✓ |
| GitHub Action | Public repos | ✓ | ✓ |
| Dashboard | — | ✓ | ✓ |
| Slack alerts | — | ✓ | ✓ |
| Registry proxy | — | — | ✓ |
| SSO / SAML | — | — | ✓ |
| SOC 2 report | — | — | ✓ |
