import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db/schema.ts";
import { newId } from "../db/seed.ts";
import { getAuth } from "./middleware.ts";
import { getSamlLoginUrl, handleSamlCallback } from "../auth/saml.ts";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  workspaceName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
});

export const authRoutes = new Hono();

/** COMM-013: Basic email auth stub — no password verification in v0.1 */
authRoutes.post("/signup", async (c) => {
  const body = signupSchema.parse(await c.req.json());
  const db = getDb();

  let workspace = db.query("SELECT * FROM workspaces LIMIT 1").get() as { id: string } | null;
  if (!workspace) {
    const wsId = newId();
    const slug = (body.workspaceName ?? "workspace").toLowerCase().replace(/\s+/g, "-");
    db.run("INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)", wsId, body.workspaceName ?? "My Workspace", slug);
    workspace = { id: wsId };
  }

  const existing = db
    .query("SELECT id FROM users WHERE workspace_id = ? AND email = ?")
    .get(workspace.id, body.email) as { id: string } | null;

  const userId = existing?.id ?? newId();
  if (!existing) {
    db.run(
      "INSERT INTO users (id, workspace_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
      userId,
      workspace.id,
      body.email,
      body.name,
      "stub",
      "member",
    );
  }

  const token = newId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.run("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", newId(), userId, token, expires);

  const user = db.query("SELECT id, workspace_id, email, name, role, created_at FROM users WHERE id = ?").get(userId);
  return c.json({ token, user });
});

authRoutes.post("/login", async (c) => {
  const body = loginSchema.parse(await c.req.json());
  const db = getDb();

  const user = db
    .query("SELECT id, workspace_id, email, name, role, created_at FROM users WHERE email = ?")
    .get(body.email) as { id: string } | null;

  if (!user) {
    return c.json({ error: "User not found. Use /signup first." }, 404);
  }

  const token = newId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.run("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", newId(), user.id, token, expires);

  return c.json({ token, user });
});

export const authProtectedRoutes = new Hono();

authProtectedRoutes.get("/me", async (c) => {
  const { user } = getAuth(c);
  return c.json({ user });
});

authProtectedRoutes.post("/logout", async (c) => {
  const { token } = getAuth(c);
  getDb().run("DELETE FROM sessions WHERE token = ?", token);
  return c.json({ ok: true });
});

/** COMM-029: SAML SSO stub */
authRoutes.get("/saml/login", (c) => {
  const orgId = c.req.query("org") ?? "org_default";
  const result = getSamlLoginUrl(orgId);
  if (result.stub) {
    return c.redirect(result.url);
  }
  return c.redirect(result.url);
});

authRoutes.get("/saml/callback", async (c) => {
  const code = c.req.query("code") ?? "stub";
  const profile = handleSamlCallback(code);
  if (!profile) {
    return c.json({ error: "SAML authentication failed" }, 401);
  }

  const db = getDb();
  let user = db
    .query("SELECT id, workspace_id, email, name, role, created_at FROM users WHERE email = ?")
    .get(profile.email) as { id: string } | null;

  if (!user) {
    const workspace = db.query("SELECT id FROM workspaces LIMIT 1").get() as { id: string } | null;
    if (!workspace) return c.json({ error: "No workspace" }, 500);
    const userId = newId();
    db.run(
      "INSERT INTO users (id, workspace_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
      userId,
      workspace.id,
      profile.email,
      `${profile.firstName} ${profile.lastName}`,
      "saml",
      "member",
    );
    user = { id: userId } as { id: string };
  }

  const token = newId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.run("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", newId(), user.id, token, expires);

  const fullUser = db
    .query("SELECT id, workspace_id, email, name, role, created_at FROM users WHERE id = ?")
    .get(user.id);
  return c.json({ token, user: fullUser, sso: true });
});

authRoutes.get("/saml/stub-login", async (c) => {
  const org = c.req.query("org") ?? "org_stub";
  const profile = handleSamlCallback("stub");
  if (!profile) return c.json({ error: "Stub login failed" }, 500);
  profile.organizationId = org;

  const db = getDb();
  const workspace = db.query("SELECT id FROM workspaces LIMIT 1").get() as { id: string } | null;
  if (!workspace) return c.json({ error: "No workspace" }, 500);

  let user = db
    .query("SELECT id FROM users WHERE email = ?")
    .get(profile.email) as { id: string } | null;

  const userId = user?.id ?? newId();
  if (!user) {
    db.run(
      "INSERT INTO users (id, workspace_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
      userId,
      workspace.id,
      profile.email,
      `${profile.firstName} ${profile.lastName}`,
      "saml-stub",
      "member",
    );
  }

  const token = newId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.run("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", newId(), userId, token, expires);

  const fullUser = db
    .query("SELECT id, workspace_id, email, name, role, created_at FROM users WHERE id = ?")
    .get(userId);
  return c.json({ token, user: fullUser, sso: true, stub: true });
});
