import { Hono } from "hono";
import { getAuth } from "./middleware.ts";
import { createCheckoutSession, getWorkspaceTier, getTierLimits } from "../billing/stripe.ts";

/** COMM-028: Stripe billing API stubs */
export const billingRoutes = new Hono();

billingRoutes.get("/tier", (c) => {
  const { user } = getAuth(c);
  const tier = getWorkspaceTier(user.workspace_id);
  return c.json({ tier, limits: getTierLimits(tier) });
});

billingRoutes.post("/checkout", async (c) => {
  const { user } = getAuth(c);
  const body = (await c.req.json()) as {
    tier: "team" | "enterprise";
    billingPeriod: "monthly" | "annual";
    successUrl: string;
    cancelUrl: string;
  };

  const session = createCheckoutSession({
    workspaceId: user.workspace_id,
    tier: body.tier,
    billingPeriod: body.billingPeriod,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
  });

  return c.json({ session });
});
