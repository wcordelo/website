/** Multi-run eval orchestrator (BENCH-010). */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { BenchTask, EvalRun, Scorecard, TaskRunResult, TaskScope } from "./types.ts";
import { classifyTask } from "./pipeline/classifier.ts";
import { validateTask } from "./pipeline/validator.ts";
import { generateSealedRuntimeSpec } from "./runtime/sealed-spec.ts";
import { runReferenceAgent } from "./scaffold/reference-agent.ts";
import { classifyTrajectory } from "./contamination/reward-hack.ts";
import type { AgentAction } from "./scaffold/reference-agent.ts";
import { computePassAtKReport } from "./stats/index.ts";
import { inferFailureMode, aggregateFailureModes, type FailureMode } from "./taxonomy.ts";
import { buildScorecard, writeScorecardReports } from "./report/scorecard.ts";
import { HoldoutVault } from "./vault/holdout-vault.ts";

export interface EvalOptions {
  tasksDir: string;
  runsPerTask?: number;
  model?: string;
  outputDir?: string;
  vaultDir?: string;
}

function generateRunId(): string {
  return `run-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

export async function loadTasksFromDir(tasksDir: string): Promise<BenchTask[]> {
  const files = await readdir(tasksDir);
  const tasks: BenchTask[] = [];
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const raw = await readFile(join(tasksDir, file), "utf8");
    const task = JSON.parse(raw) as BenchTask;
    const validation = validateTask(task);
    if (!validation.valid) {
      console.warn(`Skipping invalid task ${file}: ${validation.errors.join(", ")}`);
      continue;
    }
    if (!task.scope) {
      const { scope } = classifyTask(task);
      task.scope = scope;
    }
    tasks.push(task);
  }
  return tasks;
}

async function simulateRun(
  task: BenchTask,
  runIndex: number,
  timeoutMs: number
): Promise<TaskRunResult> {
  const spec = generateSealedRuntimeSpec({
    taskId: task.id,
    workspaceDir: `/tmp/benchtrust-${task.id}`,
    timeoutSeconds: timeoutMs / 1000,
  });

  const start = Date.now();
  const agentResult = await runReferenceAgent(task, { seed: runIndex });
  const durationMs = Date.now() - start;

  const trajectory = agentResult.actions.map((a: AgentAction, i: number) => ({
    type: a.type,
    path: a.path,
    command: a.command,
    timestamp: start + i * 100,
  }));
  const hack = classifyTrajectory(trajectory);

  const passed = agentResult.success && !hack.rewardHack && spec.networkMode === "none";

  return {
    taskId: task.id,
    runIndex,
    passed,
    durationMs,
    failureMode: inferFailureMode(passed, durationMs, timeoutMs, hack.flags),
    rewardHackFlags: hack.flags,
  };
}

export async function runEval(options: EvalOptions): Promise<EvalRun> {
  const {
    tasksDir,
    runsPerTask = 16,
    model = "reference-agent",
    outputDir = join(tasksDir, "..", ".benchtrust-runs"),
    vaultDir = join(outputDir, "vault"),
  } = options;

  const runId = generateRunId();
  const tasks = await loadTasksFromDir(tasksDir);
  const vault = new HoldoutVault({ vaultDir });
  await vault.init();

  for (const task of tasks) {
    await vault.storeTask(task, `eval:${runId}`);
  }

  const evalRun: EvalRun = {
    id: runId,
    model,
    tasksDir,
    runsPerTask,
    startedAt: new Date().toISOString(),
    status: "running",
    results: [],
    vaultVersion: vault.version(),
  };

  await mkdir(outputDir, { recursive: true });
  const timeoutMs = 600_000;

  for (const task of tasks) {
    for (let i = 0; i < runsPerTask; i++) {
      const result = await simulateRun(task, i, timeoutMs);
      evalRun.results.push(result);
    }
  }

  evalRun.status = "completed";
  evalRun.completedAt = new Date().toISOString();

  await writeFile(
    join(outputDir, `${runId}.json`),
    JSON.stringify(evalRun, null, 2)
  );

  return evalRun;
}

export async function loadEvalRun(
  outputDir: string,
  runId: string
): Promise<EvalRun> {
  const raw = await readFile(join(outputDir, `${runId}.json`), "utf8");
  return JSON.parse(raw) as EvalRun;
}

export function evalRunToScorecard(evalRun: EvalRun): Scorecard {
  const passAtK = computePassAtKReport(evalRun.results, evalRun.runsPerTask, [1, 5, 10]);

  const failureModes = aggregateFailureModes(
    evalRun.results.map((r) => r.failureMode as FailureMode | undefined)
  );

  const hackCount = evalRun.results.filter(
    (r) => r.rewardHackFlags && r.rewardHackFlags.length > 0
  ).length;

  const byScope: Record<TaskScope, { passRate: number; n: number }> = {
    narrow: { passRate: 0, n: 0 },
    wide: { passRate: 0, n: 0 },
  };

  // Approximate scope breakdown from task IDs in results
  const taskScopes = new Map<string, TaskScope>();
  for (const r of evalRun.results) {
    if (!taskScopes.has(r.taskId)) {
      taskScopes.set(r.taskId, r.taskId.includes("wide") ? "wide" : "narrow");
    }
  }

  for (const scope of ["narrow", "wide"] as TaskScope[]) {
    const scoped = evalRun.results.filter(
      (r: TaskRunResult) => taskScopes.get(r.taskId) === scope
    );
    const entry = byScope[scope];
    entry.n = new Set(scoped.map((r: TaskRunResult) => r.taskId)).size;
    entry.passRate =
      scoped.length === 0
        ? 0
        : scoped.filter((r: TaskRunResult) => r.passed).length / scoped.length;
  }

  return buildScorecard(evalRun.id, evalRun.model, {
    vaultVersion: evalRun.vaultVersion,
    passAtK,
    rewardHackRate: evalRun.results.length
      ? hackCount / evalRun.results.length
      : 0,
    failureModes,
    byScope,
  });
}

export async function generateReport(
  runId: string,
  options: { runsDir?: string; reportDir?: string } = {}
): Promise<Scorecard> {
  const runsDir =
    options.runsDir ??
    join(import.meta.dirname, "../data/.benchtrust-runs");
  const reportDir =
    options.reportDir ?? join(runsDir, "reports");

  const evalRun = await loadEvalRun(runsDir, runId);
  const scorecard = evalRunToScorecard(evalRun);
  await writeScorecardReports(scorecard, reportDir);
  return scorecard;
}
