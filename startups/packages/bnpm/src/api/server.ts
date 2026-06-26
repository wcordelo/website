import { Hono } from "hono";
import { cors } from "hono/cors";
import type { BetterNpmrc } from "../types.js";
import type { BlockMatch } from "../types.js";

export interface PolicyRecord {
  id: string;
  orgId: string;
  name: string;
  policy: BetterNpmrc;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  orgId: string;
  type: "block" | "warn" | "policy_change" | "api_key_created";
  package?: string;
  version?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  prefix: string;
  createdAt: string;
}

const DEFAULT_PORT = 3850;

/** In-memory store for PoC — replace with DB in production. */
export function createStore() {
  const policies = new Map<string, PolicyRecord>();
  const auditEvents: AuditEvent[] = [];
  const apiKeys = new Map<string, ApiKey>();

  policies.set("default", {
    id: "default",
    orgId: "org_default",
    name: "Default strict policy",
    policy: {
      blocklist: "strict",
      lifecycle_scripts: "allowlist",
      allowed_registries: ["https://registry.npmjs.org"],
      telemetry: "off",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { policies, auditEvents, apiKeys };
}

export type ControlPlaneStore = ReturnType<typeof createStore>;

export function createControlPlaneApp(store: ControlPlaneStore = createStore()) {
  const app = new Hono();

  app.use("*", cors());

  app.get("/health", (c) =>
    c.json({ ok: true, service: "bnpm-control-plane", version: "0.1.0" }),
  );

  app.get("/api/v1/policies", (c) => {
    const orgId = c.req.query("orgId") ?? "org_default";
    const list = [...store.policies.values()].filter((p) => p.orgId === orgId);
    return c.json({ policies: list });
  });

  app.get("/api/v1/policies/:id", (c) => {
    const policy = store.policies.get(c.req.param("id"));
    if (!policy) return c.json({ error: "Policy not found" }, 404);
    return c.json(policy);
  });

  app.post("/api/v1/policies", async (c) => {
    const body = (await c.req.json()) as {
      orgId?: string;
      name: string;
      policy: BetterNpmrc;
    };
    const id = `pol_${Date.now()}`;
    const now = new Date().toISOString();
    const record: PolicyRecord = {
      id,
      orgId: body.orgId ?? "org_default",
      name: body.name,
      policy: body.policy,
      createdAt: now,
      updatedAt: now,
    };
    store.policies.set(id, record);
    appendAudit(store, {
      orgId: record.orgId,
      type: "policy_change",
      message: `Created policy "${record.name}"`,
      metadata: { policyId: id },
    });
    return c.json(record, 201);
  });

  app.put("/api/v1/policies/:id", async (c) => {
    const existing = store.policies.get(c.req.param("id"));
    if (!existing) return c.json({ error: "Policy not found" }, 404);

    const body = (await c.req.json()) as { name?: string; policy?: BetterNpmrc };
    const updated: PolicyRecord = {
      ...existing,
      name: body.name ?? existing.name,
      policy: body.policy ?? existing.policy,
      updatedAt: new Date().toISOString(),
    };
    store.policies.set(updated.id, updated);
    appendAudit(store, {
      orgId: updated.orgId,
      type: "policy_change",
      message: `Updated policy "${updated.name}"`,
      metadata: { policyId: updated.id },
    });
    return c.json(updated);
  });

  app.delete("/api/v1/policies/:id", (c) => {
    const id = c.req.param("id");
    const existing = store.policies.get(id);
    if (!existing) return c.json({ error: "Policy not found" }, 404);
    store.policies.delete(id);
    appendAudit(store, {
      orgId: existing.orgId,
      type: "policy_change",
      message: `Deleted policy "${existing.name}"`,
      metadata: { policyId: id },
    });
    return c.json({ ok: true });
  });

  app.get("/api/v1/audit", (c) => {
    const orgId = c.req.query("orgId") ?? "org_default";
    const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
    const events = store.auditEvents
      .filter((e) => e.orgId === orgId)
      .slice(-limit)
      .reverse();
    return c.json({ events });
  });

  app.post("/api/v1/audit", async (c) => {
    const body = (await c.req.json()) as {
      orgId?: string;
      type: AuditEvent["type"];
      package?: string;
      version?: string;
      message: string;
      metadata?: Record<string, unknown>;
    };
    const event = appendAudit(store, {
      orgId: body.orgId ?? "org_default",
      type: body.type,
      package: body.package,
      version: body.version,
      message: body.message,
      metadata: body.metadata,
    });
    return c.json(event, 201);
  });

  app.post("/api/v1/blocks", async (c) => {
    const body = (await c.req.json()) as BlockMatch & { orgId?: string };
    const event = appendAudit(store, {
      orgId: body.orgId ?? "org_default",
      type: body.action === "block" ? "block" : "warn",
      package: body.package,
      version: body.version,
      message: body.reason,
      metadata: { severity: body.severity, source: body.source },
    });
    return c.json({ recorded: true, event });
  });

  app.post("/api/v1/keys", async (c) => {
    const body = (await c.req.json()) as { orgId?: string; name: string };
    const id = `key_${Date.now()}`;
    const prefix = `bnpm_${Math.random().toString(36).slice(2, 10)}`;
    const key: ApiKey = {
      id,
      orgId: body.orgId ?? "org_default",
      name: body.name,
      prefix,
      createdAt: new Date().toISOString(),
    };
    store.apiKeys.set(id, key);
    appendAudit(store, {
      orgId: key.orgId,
      type: "api_key_created",
      message: `API key created: ${key.name}`,
      metadata: { keyId: id, prefix },
    });
    return c.json({ ...key, secret: `${prefix}_${Math.random().toString(36).slice(2)}` }, 201);
  });

  app.get("/api/v1/keys", (c) => {
    const orgId = c.req.query("orgId") ?? "org_default";
    const keys = [...store.apiKeys.values()]
      .filter((k) => k.orgId === orgId)
      .map(({ id, orgId: o, name, prefix, createdAt }) => ({
        id,
        orgId: o,
        name,
        prefix,
        createdAt,
      }));
    return c.json({ keys });
  });

  return app;
}

function appendAudit(
  store: ControlPlaneStore,
  partial: Omit<AuditEvent, "id" | "createdAt">,
): AuditEvent {
  const event: AuditEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...partial,
  };
  store.auditEvents.push(event);
  return event;
}

export function startControlPlaneServer(
  port: number = DEFAULT_PORT,
  store?: ControlPlaneStore,
): ReturnType<typeof Bun.serve> {
  const app = createControlPlaneApp(store);
  return Bun.serve({
    port,
    fetch: app.fetch,
  });
}

if (import.meta.main) {
  const port = parseInt(process.env.BNPM_API_PORT ?? String(DEFAULT_PORT), 10);
  const server = startControlPlaneServer(port);
  console.log(`bnpm control plane listening on http://localhost:${server.port}`);
}
