import type { AgentCapability, PermissionLevel } from "../db/schema.ts";
import { getDb } from "../db/schema.ts";

export type CapabilityAction =
  | "channel:read"
  | "channel:write"
  | "thread:read"
  | "thread:write"
  | "post:read"
  | "post:propose"
  | "post:publish";

export interface PermissionContext {
  workspaceId: string;
  channelSlug?: string;
  channelId?: string;
}

/**
 * Capability engine — deny wins over allow (COMM-016).
 */
export function evaluateAgentCapability(
  agentId: string,
  action: CapabilityAction,
  ctx: PermissionContext,
): boolean {
  const db = getDb();
  const caps = db
    .query("SELECT * FROM agent_capabilities WHERE agent_id = ?")
    .all(agentId) as AgentCapability[];

  const resource = buildResourcePattern(action, ctx);
  const matching = caps.filter((cap) => matchesPattern(cap.capability, action, cap.resource_pattern, resource));

  if (matching.some((c) => c.effect === "deny")) return false;
  if (matching.some((c) => c.effect === "allow")) return true;
  return false;
}

export function evaluateHumanChannelPermission(
  userId: string,
  channelId: string,
  required: PermissionLevel,
): boolean {
  const db = getDb();
  const row = db
    .query("SELECT level FROM channel_permissions WHERE channel_id = ? AND user_id = ?")
    .get(channelId, userId) as { level: PermissionLevel } | null;

  if (!row) {
    const user = db.query("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | null;
    return user?.role === "admin";
  }

  const levels: PermissionLevel[] = ["read", "write", "admin"];
  return levels.indexOf(row.level) >= levels.indexOf(required);
}

function buildResourcePattern(action: CapabilityAction, ctx: PermissionContext): string {
  if (ctx.channelSlug) return `channel:#${ctx.channelSlug}`;
  if (ctx.channelId) return `channel:${ctx.channelId}`;
  return action.split(":")[0] ?? "*";
}

function matchesPattern(
  capCapability: string,
  action: CapabilityAction,
  resourcePattern: string,
  resource: string,
): boolean {
  const actionPrefix = action.split(":")[0];
  const capPrefix = capCapability.split(":")[0];
  if (capCapability !== action && capPrefix !== actionPrefix) return false;

  if (resourcePattern === "*") return true;
  if (resourcePattern === resource) return true;
  if (resourcePattern.startsWith("channel:#") && resource.startsWith("channel:#")) {
    return resourcePattern === resource;
  }
  return false;
}

export function logAudit(
  workspaceId: string,
  actorType: "human" | "agent" | "system",
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: Record<string, unknown> = {},
): void {
  const db = getDb();
  db.run(
    `INSERT INTO audit_log (id, workspace_id, actor_type, actor_id, action, resource_type, resource_id, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    workspaceId,
    actorType,
    actorId,
    action,
    resourceType,
    resourceId,
    JSON.stringify(details),
  );
}
