import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/schema.ts";
import type { Agent, AgentCapability, AuditEntry } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { logAudit } from "../permissions/engine.ts";
import { getAuth } from "./middleware.ts";

const registerAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  capabilities: z
    .array(
      z.object({
        capability: z.string(),
        effect: z.enum(["allow", "deny"]),
        resourcePattern: z.string().default("*"),
      }),
    )
    .optional(),
});

/** COMM-015, COMM-017: Agent registry + audit log */
export const agentRoutes = new Hono();

agentRoutes.get("/", (c) => {
  const { user } = getAuth(c);
  const db = getDb();
  const agents = db
    .query("SELECT id, workspace_id, name, description, owner_id, status, rate_limit, created_at FROM agents WHERE workspace_id = ?")
    .all(user.workspace_id) as Omit<Agent, "api_key">[];
  return c.json({ agents });
});

agentRoutes.get("/audit", (c) => {
  const { user } = getAuth(c);
  const limit = Number(c.req.query("limit") ?? "50");
  const db = getDb();
  const entries = db
    .query("SELECT * FROM audit_log WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(user.workspace_id, limit) as AuditEntry[];
  return c.json({ entries });
});

agentRoutes.post("/", async (c) => {
  const { user } = getAuth(c);
  const body = registerAgentSchema.parse(await c.req.json());
  const db = getDb();
  const id = newId();
  const apiKey = `bsk_${crypto.randomUUID().replace(/-/g, "")}`;

  db.run(
    `INSERT INTO agents (id, workspace_id, name, description, owner_id, api_key)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    user.workspace_id,
    body.name,
    body.description ?? "",
    user.id,
    apiKey,
  );

  for (const cap of body.capabilities ?? []) {
    db.run(
      "INSERT INTO agent_capabilities (id, agent_id, capability, effect, resource_pattern) VALUES (?, ?, ?, ?, ?)",
      newId(),
      id,
      cap.capability,
      cap.effect,
      cap.resourcePattern,
    );
  }

  const agent = db.query("SELECT * FROM agents WHERE id = ?").get(id) as Agent;
  logAudit(user.workspace_id, "human", user.id, "agent.register", "agent", id, { name: body.name });

  return c.json({ agent }, 201);
});

agentRoutes.get("/:agentId/capabilities", (c) => {
  const agentId = c.req.param("agentId");
  const db = getDb();
  const caps = db
    .query("SELECT id, agent_id, capability, effect, resource_pattern FROM agent_capabilities WHERE agent_id = ?")
    .all(agentId) as AgentCapability[];
  return c.json({ capabilities: caps });
});
