import { Hono } from "hono";
import { getOrchestrator } from "./orchestrator.js";
import { buildAgencyPortfolio } from "./agency.js";
import { submitFeedback, listFeedback } from "../feedback.js";
import { orchestrateFixes } from "../ai/fix-orchestrator.js";
import type { ScanJob } from "../types.js";

export const DEFAULT_PORT = 3851;

/**
 * Hono API service with scan orchestration (MOB-016).
 */
export function createApp(): Hono {
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "shipkit-api",
      version: "0.1.0",
      queueDepth: getOrchestrator().getQueueDepth(),
    }),
  );

  app.post("/scans", async (c) => {
    const body = await c.req.json<{ projectPath: string }>();
    if (!body.projectPath) {
      return c.json({ error: "projectPath is required" }, 400);
    }
    const job = getOrchestrator().enqueue(body.projectPath);
    return c.json(job, 202);
  });

  app.get("/scans", (c) => {
    const status = c.req.query("status") as ScanJob["status"] | undefined;
    const jobs = getOrchestrator().listJobs(status);
    return c.json({ jobs });
  });

  app.get("/scans/:id", (c) => {
    const job = getOrchestrator().getJob(c.req.param("id"));
    if (!job) return c.json({ error: "Scan job not found" }, 404);
    return c.json(job);
  });

  app.get("/scans/:id/fixes", (c) => {
    const job = getOrchestrator().getJob(c.req.param("id"));
    if (!job) return c.json({ error: "Scan job not found" }, 404);
    if (!job.result) return c.json({ error: "Scan not completed" }, 409);
    return c.json({ fixes: orchestrateFixes(job.result) });
  });

  app.post("/feedback", async (c) => {
    const body = await c.req.json<{
      findingId: string;
      projectPath: string;
      reason: string;
    }>();
    if (!body.findingId || !body.projectPath || !body.reason) {
      return c.json({ error: "findingId, projectPath, and reason are required" }, 400);
    }
    const submission = submitFeedback(body);
    return c.json(submission, 201);
  });

  app.get("/feedback", (c) => {
    const projectPath = c.req.query("projectPath");
    return c.json({ submissions: listFeedback(projectPath) });
  });

  app.get("/agency/portfolio", async (c) => {
    const paths = c.req.query("paths")?.split(",").filter(Boolean) ?? [];
    if (paths.length === 0) {
      return c.json({ error: "paths query param required (comma-separated)" }, 400);
    }
    const portfolio = buildAgencyPortfolio(paths);
    return c.json(portfolio);
  });

  return app;
}

export function startServer(port = DEFAULT_PORT): { port: number } {
  const app = createApp();
  const server = Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`ShipKit API listening on http://localhost:${port}`);
  return { port: server.port! };
}
