import { describe, expect, test } from "bun:test";
import { StripeBillingStub, TIER_DEFINITIONS } from "../src/billing/stripe.js";

describe("stripe billing stub", () => {
  const billing = new StripeBillingStub("sk_test_stub");

  test("tier definitions include free team enterprise", () => {
    const ids = TIER_DEFINITIONS.map((t) => t.id);
    expect(ids).toEqual(["free", "team", "enterprise"]);
  });

  test("isConfigured returns false for stub key", () => {
    expect(billing.isConfigured()).toBe(false);
  });

  test("createCheckoutSession returns session for team tier", async () => {
    const session = await billing.createCheckoutSession({
      tier: "team",
      orgId: "org_1",
      email: "test@example.com",
      successUrl: "https://app.betternpm.dev/success",
      cancelUrl: "https://app.betternpm.dev/cancel",
    });
    expect(session.sessionId).toStartWith("cs_stub_");
    expect(session.tier).toBe("team");
    expect(session.url).toContain("checkout");
  });

  test("createCheckoutSession rejects free tier", async () => {
    await expect(
      billing.createCheckoutSession({
        tier: "free",
        orgId: "org_1",
        email: "test@example.com",
        successUrl: "https://app.betternpm.dev/success",
        cancelUrl: "https://app.betternpm.dev/cancel",
      }),
    ).rejects.toThrow("Free tier");
  });

  test("parseWebhookPayload extracts metadata", () => {
    const event = billing.parseWebhookPayload(
      JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { orgId: "org_1", tier: "team" },
            customer: "cus_123",
            id: "sub_456",
          },
        },
      }),
      "sig",
    );
    expect(event.type).toBe("checkout.session.completed");
    expect(event.orgId).toBe("org_1");
    expect(event.tier).toBe("team");
  });

  test("seatPrice calculates extra seats", () => {
    expect(billing.seatPrice("team", 25)).toBe(49);
    expect(billing.seatPrice("team", 30)).toBe(74);
  });
});
