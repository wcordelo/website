import type { Context, Next } from "hono";
import { getDb } from "../db/schema.ts";
import type { User } from "../db/schema.ts";

export type AuthContext = {
  user: User;
  token: string;
};

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : c.req.query("token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = getDb();
  const row = db
    .query(
      `SELECT u.id, u.workspace_id, u.email, u.name, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .get(token) as User | null;

  if (!row) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  c.set("auth", { user: row, token } satisfies AuthContext);
  await next();
}

export async function optionalAuth(c: Context, next: Next): Promise<void> {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    const db = getDb();
    const row = db
      .query(
        `SELECT u.id, u.workspace_id, u.email, u.name, u.role, u.created_at
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > datetime('now')`,
      )
      .get(token) as User | null;
    if (row) c.set("auth", { user: row, token } satisfies AuthContext);
  }
  await next();
}

export function getAuth(c: Context): AuthContext {
  return c.get("auth") as AuthContext;
}

export async function agentAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const apiKey = c.req.header("X-Agent-Key") ?? c.req.header("Authorization")?.replace("Bearer ", "");
  if (!apiKey) {
    return c.json({ error: "Agent API key required" }, 401);
  }

  const db = getDb();
  const agent = db
    .query("SELECT * FROM agents WHERE api_key = ? AND status = 'active'")
    .get(apiKey) as { id: string; workspace_id: string; name: string } | null;

  if (!agent) {
    return c.json({ error: "Invalid agent key" }, 401);
  }

  c.set("agent", agent);
  await next();
}

export function getAgent(c: Context): { id: string; workspace_id: string; name: string } {
  return c.get("agent");
}
