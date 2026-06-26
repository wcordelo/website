/** COMM-028: Stripe billing — tier stubs */

export type BillingTier = "free" | "team" | "enterprise";

export interface TierLimits {
  maxChannels: number;
  maxAgents: number;
  maxPosts: number;
  ssoEnabled: boolean;
  auditRetentionDays: number;
}

export const TIER_LIMITS: Record<BillingTier, TierLimits> = {
  free: {
    maxChannels: 3,
    maxAgents: 1,
    maxPosts: 10,
    ssoEnabled: false,
    auditRetentionDays: 7,
  },
  team: {
    maxChannels: 50,
    maxAgents: 10,
    maxPosts: 500,
    ssoEnabled: false,
    auditRetentionDays: 90,
  },
  enterprise: {
    maxChannels: Infinity,
    maxAgents: Infinity,
    maxPosts: Infinity,
    ssoEnabled: true,
    auditRetentionDays: 365,
  },
};

export interface StripePriceIds {
  teamMonthly: string;
  teamAnnual: string;
  enterprise: string;
}

export function getStripePriceIds(): StripePriceIds {
  return {
    teamMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "price_team_monthly_stub",
    teamAnnual: process.env.STRIPE_PRICE_TEAM_ANNUAL ?? "price_team_annual_stub",
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise_stub",
  };
}

export interface CheckoutSessionRequest {
  workspaceId: string;
  tier: "team" | "enterprise";
  billingPeriod: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  stub: true;
}

/**
 * Create a Stripe Checkout session (stub).
 * Set STRIPE_SECRET_KEY to enable live billing.
 */
export function createCheckoutSession(req: CheckoutSessionRequest): CheckoutSessionResult {
  const prices = getStripePriceIds();
  const priceId =
    req.tier === "enterprise"
      ? prices.enterprise
      : req.billingPeriod === "annual"
        ? prices.teamAnnual
        : prices.teamMonthly;

  const sessionId = `cs_stub_${req.workspaceId}_${Date.now()}`;
  return {
    sessionId,
    url: `https://checkout.stripe.com/stub/${sessionId}?price=${priceId}`,
    stub: true,
  };
}

export function getWorkspaceTier(workspaceId: string): BillingTier {
  const override = process.env[`BILLING_TIER_${workspaceId}`] as BillingTier | undefined;
  if (override && override in TIER_LIMITS) return override;
  return (process.env.DEFAULT_BILLING_TIER as BillingTier) ?? "free";
}

export function getTierLimits(tier: BillingTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function checkLimit(
  tier: BillingTier,
  resource: keyof TierLimits,
  currentCount: number,
): { allowed: boolean; limit: number } {
  const limits = TIER_LIMITS[tier];
  const limit = limits[resource];
  if (typeof limit !== "number") {
    return { allowed: true, limit: Infinity };
  }
  return { allowed: currentCount < limit, limit };
}
