import { describe, expect, test, beforeEach } from "bun:test";
import { join } from "node:path";
import { createApp } from "../src/api/server.js";
import { resetOrchestrator } from "../src/api/orchestrator.js";
import { resetFeedback } from "../src/feedback.js";
import { buildAgencyPortfolio } from "../src/api/agency.js";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("API server (MOB-016)", () => {
  beforeEach(() => {
    resetOrchestrator();
    resetFeedback();
  });

  test("GET /health returns ok", async () => {
    const app = createApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("shipkit-api");
  });

  test("POST /scans enqueues and completes scan", async () => {
    const app = createApp();
    const res = await app.request("/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectPath: FIXTURE }),
    });
    expect(res.status).toBe(202);
    const job = await res.json();
    expect(job.id).toBeDefined();
    expect(job.status).toBe("completed");
    expect(job.result.healthScore).toBeGreaterThanOrEqual(0);
  });

  test("GET /scans/:id/fixes returns suggestions", async () => {
    const app = createApp();
    const createRes = await app.request("/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectPath: FIXTURE }),
    });
    const job = await createRes.json();
    const res = await app.request(`/scans/${job.id}/fixes`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fixes.length).toBeGreaterThan(0);
  });

  test("POST /feedback creates submission", async () => {
    const app = createApp();
    const res = await app.request("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        findingId: "16kb-react-native-reanimated",
        projectPath: FIXTURE,
        reason: "False positive — we verified 16KB alignment",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("pending");
  });
});

describe("scan orchestrator (MOB-017)", () => {
  beforeEach(() => resetOrchestrator());

  test("processes multiple jobs in queue order", async () => {
    const app = createApp();
    const paths = [FIXTURE, FIXTURE];
    const jobs = [];
    for (const p of paths) {
      const res = await app.request("/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: p }),
      });
      jobs.push(await res.json());
    }
    expect(jobs.every((j) => j.status === "completed")).toBe(true);
  });
});

describe("agency portfolio (MOB-033)", () => {
  test("builds portfolio from multiple paths", () => {
    const portfolio = buildAgencyPortfolio([FIXTURE, FIXTURE]);
    expect(portfolio.apps.length).toBe(2);
    expect(portfolio.aggregateHealthScore).toBeGreaterThanOrEqual(0);
    expect(portfolio.apps[0]!.name).toBe("sample-expo-app");
  });
});
