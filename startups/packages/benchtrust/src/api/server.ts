/** BenchTrust API v0 (BENCH-020) — Hono REST on port 3848. */

import { Hono } from "hono";
import { serve } from "bun";
import { join } from "node:path";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { runEval, loadEvalRun, evalRunToScorecard } from "../orchestrator.ts";
import { writeScorecardReports } from "../report/scorecard.ts";
import { scanContamination } from "../contamination/audit-agent.ts";
import type { EvalRun } from "../types.ts";

export const API_PORT = 3848;

const app = new Hono();

const runsDir = join(import.meta.dirname, "../../data/.benchtrust-runs");
const defaultTasksDir = join(import.meta.dirname, "../../data/sample-tasks");

app.get("/health", (c) =>
  c.json({ status: "ok", service: "benchtrust", version: "0.1.0" })
);

app.post("/v1/runs", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    tasksDir?: string;
    runsPerTask?: number;
    model?: string;
  };

  const evalRun = await runEval({
    tasksDir: body.tasksDir ?? defaultTasksDir,
    runsPerTask: body.runsPerTask ?? 16,
    model: body.model ?? "api-submitted",
    outputDir: runsDir,
  });

  return c.json({ runId: evalRun.id, status: evalRun.status }, 201);
});

app.get("/v1/runs/:runId", async (c) => {
  const runId = c.req.param("runId");
  try {
    const evalRun = await loadEvalRun(runsDir, runId);
    return c.json(evalRun);
  } catch {
    return c.json({ error: "run not found" }, 404);
  }
});

app.get("/v1/runs", async (c) => {
  await mkdir(runsDir, { recursive: true });
  const files = await readdir(runsDir);
  const runs: Pick<EvalRun, "id" | "status" | "model" | "startedAt">[] = [];
  for (const f of files.filter((x) => x.endsWith(".json"))) {
    const raw = await readFile(join(runsDir, f), "utf8");
    const run = JSON.parse(raw) as EvalRun;
    runs.push({
      id: run.id,
      status: run.status,
      model: run.model,
      startedAt: run.startedAt,
    });
  }
  return c.json({ runs });
});

app.get("/v1/runs/:runId/report", async (c) => {
  const runId = c.req.param("runId");
  const format = c.req.query("format") ?? "json";
  try {
    const evalRun = await loadEvalRun(runsDir, runId);
    const scorecard = evalRunToScorecard(evalRun);

    if (format === "html") {
      const { scorecardToHtml } = await import("../report/scorecard.ts");
      return c.html(scorecardToHtml(scorecard));
    }
    if (format === "markdown") {
      const { scorecardToPdfMarkdown } = await import("../report/scorecard.ts");
      return c.text(scorecardToPdfMarkdown(scorecard));
    }
    return c.json(scorecard);
  } catch {
    return c.json({ error: "run not found" }, 404);
  }
});

app.post("/v1/runs/:runId/report", async (c) => {
  const runId = c.req.param("runId");
  try {
    const evalRun = await loadEvalRun(runsDir, runId);
    const scorecard = evalRunToScorecard(evalRun);
    const reportDir = join(runsDir, "reports");
    await writeScorecardReports(scorecard, reportDir);
    return c.json({ runId, reportDir, formats: ["json", "html", "markdown"] });
  } catch {
    return c.json({ error: "run not found" }, 404);
  }
});

app.post("/v1/contamination/scan", async (c) => {
  const body = (await c.req.json()) as { model: string };
  const report = await scanContamination(body.model);
  return c.json(report);
});

export { app };

export function startServer(port = API_PORT): ReturnType<typeof serve> {
  return serve({ fetch: app.fetch, port });
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? API_PORT);
  console.log(`BenchTrust API listening on http://localhost:${port}`);
  startServer(port);
}
