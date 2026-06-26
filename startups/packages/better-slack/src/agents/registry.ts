import { getDb } from "../db/schema.ts";
import type { Agent, AgentCapability } from "../db/schema.ts";

/** COMM-015: Agent registry helpers */
export function getAgentById(agentId: string): Agent | null {
  return getDb().query("SELECT * FROM agents WHERE id = ?").get(agentId) as Agent | null;
}

export function getAgentByApiKey(apiKey: string): Agent | null {
  return getDb().query("SELECT * FROM agents WHERE api_key = ? AND status = 'active'").get(apiKey) as Agent | null;
}

export function listAgents(workspaceId: string): Omit<Agent, "api_key">[] {
  return getDb()
    .query(
      "SELECT id, workspace_id, name, description, owner_id, status, rate_limit, created_at FROM agents WHERE workspace_id = ?",
    )
    .all(workspaceId) as Omit<Agent, "api_key">[];
}

export function getAgentCapabilities(agentId: string): AgentCapability[] {
  return getDb()
    .query("SELECT * FROM agent_capabilities WHERE agent_id = ?")
    .all(agentId) as AgentCapability[];
}

export function findCiReporterAgent(workspaceId: string): Agent | null {
  return getDb()
    .query("SELECT * FROM agents WHERE workspace_id = ? AND name = 'CI Reporter' LIMIT 1")
    .get(workspaceId) as Agent | null;
}
