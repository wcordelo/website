export type BillingTier = "free" | "team" | "enterprise";

export interface TierDefinition {
  id: BillingTier;
  name: string;
  priceMonthly: number | null;
  seats: number | null;
  features: string[];
  stripePriceId: string | null;
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    seats: 3,
    features: [
      "CLI blocklist gate",
      "Embedded threat intel",
      "GitHub Action (public repos)",
      "Community support",
    ],
    stripePriceId: null,
  },
  {
    id: "team",
    name: "Team",
    priceMonthly: 49,
    seats: 25,
    features: [
      "Everything in Free",
      "Control plane dashboard",
      "Org-wide policy sync",
      "Slack block alerts",
      "Staged publish approval",
      "Priority feed updates",
    ],
    stripePriceId: process.env.STRIPE_PRICE_TEAM ?? "price_team_stub",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    seats: null,
    features: [
      "Everything in Team",
      "Registry proxy",
      "SSO / SAML",
      "SOC 2 report",
      "Dedicated support",
      "Custom SLA",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise_stub",
  },
];

export interface CheckoutSessionRequest {
  tier: BillingTier;
  orgId: string;
  email: string;
  seats?: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  tier: BillingTier;
}

export interface WebhookEvent {
  type: string;
  orgId?: string;
  tier?: BillingTier;
  customerId?: string;
  subscriptionId?: string;
}

/**
 * Stripe billing stub — wire to real Stripe SDK in production.
 * Set STRIPE_SECRET_KEY and price IDs in environment.
 */
export class StripeBillingStub {
  private readonly secretKey: string | undefined;

  constructor(secretKey?: string) {
    this.secretKey = secretKey ?? process.env.STRIPE_SECRET_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey && !this.secretKey.startsWith("sk_test_stub"));
  }

  getTier(tierId: BillingTier): TierDefinition | undefined {
    return TIER_DEFINITIONS.find((t) => t.id === tierId);
  }

  async createCheckoutSession(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    const tier = this.getTier(req.tier);
    if (!tier) throw new Error(`Unknown tier: ${req.tier}`);
    if (req.tier === "free") throw new Error("Free tier does not require checkout");

    const sessionId = `cs_stub_${Date.now()}`;
    const url = this.isConfigured()
      ? `https://checkout.stripe.com/c/pay/${sessionId}`
      : `https://billing.betternpm.dev/checkout?session=${sessionId}&tier=${req.tier}`;

    return { sessionId, url, tier: req.tier };
  }

  parseWebhookPayload(body: string, _signature: string): WebhookEvent {
    const parsed = JSON.parse(body) as {
      type?: string;
      data?: {
        object?: {
          metadata?: { orgId?: string; tier?: BillingTier };
          customer?: string;
          id?: string;
        };
      };
    };

    return {
      type: parsed.type ?? "unknown",
      orgId: parsed.data?.object?.metadata?.orgId,
      tier: parsed.data?.object?.metadata?.tier,
      customerId: parsed.data?.object?.customer,
      subscriptionId: parsed.data?.object?.id,
    };
  }

  seatPrice(tier: BillingTier, seats: number): number {
    const def = this.getTier(tier);
    if (!def?.priceMonthly) return 0;
    const included = def.seats ?? seats;
    const extra = Math.max(0, seats - included);
    return def.priceMonthly + extra * 5;
  }
}

export const billing = new StripeBillingStub();
