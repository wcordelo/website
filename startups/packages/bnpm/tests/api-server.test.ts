import { describe, expect, test } from "bun:test";
import { createControlPlaneApp, createStore } from "../src/api/server.js";

describe("control plane API", () => {
  test("health endpoint returns ok", async () => {
    const app = createControlPlaneApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("bnpm-control-plane");
  });

  test("policy CRUD lifecycle", async () => {
    const store = createStore();
    const app = createControlPlaneApp(store);

    const createRes = await app.request("/api/v1/policies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test policy",
        policy: { blocklist: "warn", telemetry: "off" },
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string };
    expect(created.id).toStartWith("pol_");

    const listRes = await app.request("/api/v1/policies");
    const list = (await listRes.json()) as { policies: Array<{ id: string }> };
    expect(list.policies.some((p) => p.id === created.id)).toBe(true);

    const updateRes = await app.request(`/api/v1/policies/${created.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Updated policy" }),
    });
    expect(updateRes.status).toBe(200);

    const deleteRes = await app.request(`/api/v1/policies/${created.id}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(200);
  });

  test("audit events are recorded", async () => {
    const store = createStore();
    const app = createControlPlaneApp(store);

    const res = await app.request("/api/v1/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        package: "axios",
        version: "1.14.1",
        reason: "compromised",
        severity: "critical",
        action: "block",
        source: "test",
      }),
    });
    expect(res.status).toBe(200);

    const auditRes = await app.request("/api/v1/audit");
    const audit = (await auditRes.json()) as { events: Array<{ type: string }> };
    expect(audit.events.some((e) => e.type === "block")).toBe(true);
  });

  test("API key creation", async () => {
    const app = createControlPlaneApp();
    const res = await app.request("/api/v1/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "CI key" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { prefix: string; secret: string };
    expect(body.prefix).toStartWith("bnpm_");
    expect(body.secret).toContain(body.prefix);
  });
});
