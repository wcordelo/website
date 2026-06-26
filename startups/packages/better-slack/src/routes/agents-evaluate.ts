import type { Context } from "hono";
import { z } from "zod";
import { evaluateAgentCapability, logAudit } from "../permissions/engine.ts";
import { getAgent } from "./middleware.ts";

export async function agentEvaluateHandler(c: Context): Promise<Response> {
  const agent = getAgent(c);
  const body = z
    .object({
      action: z.string(),
      channelSlug: z.string().optional(),
    })
    .parse(await c.req.json());

  const allowed = evaluateAgentCapability(agent.id, body.action as never, {
    workspaceId: agent.workspace_id,
    channelSlug: body.channelSlug,
  });

  logAudit(agent.workspace_id, "agent", agent.id, "capability.evaluate", "capability", null, {
    action: body.action,
    allowed,
  });

  return c.json({ allowed });
}
