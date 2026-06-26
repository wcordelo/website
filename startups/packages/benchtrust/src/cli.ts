#!/usr/bin/env bun
/** BenchTrust CLI v0.1 */

import { demoStats } from "./stats/index.ts";
import { scanContamination } from "./contamination/audit-agent.ts";
import { runEval, generateReport } from "./orchestrator.ts";
import type { TaskRunResult } from "./types.ts";

const args = process.argv.slice(2);
const command = args[0];

function usage(): void {
  console.log(`BenchTrust v0.1 — AI benchmark trust infrastructure

Usage:
  benchtrust scan-contamination <model>     Regurgitation probe stub
  benchtrust eval --tasks <dir> --runs N  Run eval orchestrator
  benchtrust report <run-id>              Generate scorecard
  benchtrust stats                        Demo statistical functions
  benchtrust api                          Start REST API on port 3848
`);
}

function parseFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

async function main(): Promise<void> {
  if (!command || command === "--help" || command === "-h") {
    usage();
    process.exit(command ? 0 : 1);
  }

  switch (command) {
    case "scan-contamination": {
      const model = args[1];
      if (!model) {
        console.error("Error: model name required");
        usage();
        process.exit(1);
      }
      console.log(`Scanning contamination for model: ${model}`);
      const report = await scanContamination(model);
      console.log(JSON.stringify(report, null, 2));
      break;
    }

    case "eval": {
      const tasksDir = parseFlag("--tasks");
      const runsStr = parseFlag("--runs") ?? "16";
      if (!tasksDir) {
        console.error("Error: --tasks <dir> required");
        process.exit(1);
      }
      const runsPerTask = parseInt(runsStr, 10);
      const model = parseFlag("--model") ?? "reference-agent";
      console.log(`Starting eval: ${tasksDir}, ${runsPerTask} runs/task`);
      const evalRun = await runEval({ tasksDir, runsPerTask, model });
      console.log(`Eval complete: ${evalRun.id}`);
      console.log(`  Tasks: ${new Set(evalRun.results.map((r: TaskRunResult) => r.taskId)).size}`);
      console.log(`  Total runs: ${evalRun.results.length}`);
      console.log(`  Pass rate: ${(
        (evalRun.results.filter((r: TaskRunResult) => r.passed).length / evalRun.results.length) *
        100
      ).toFixed(1)}%`);
      break;
    }

    case "report": {
      const runId = args[1];
      if (!runId) {
        console.error("Error: run-id required");
        process.exit(1);
      }
      const scorecard = await generateReport(runId);
      console.log(`Scorecard generated for ${runId}`);
      console.log(`  pass@1: ${((scorecard.passAtK[0]?.estimate ?? 0) * 100).toFixed(1)}%`);
      console.log(`  Reports: data/.benchtrust-runs/reports/${runId}.{json,html,md}`);
      break;
    }

    case "stats": {
      console.log("BenchTrust stats demo (pass@k, Wilson CI, bootstrap):\n");
      console.log(demoStats());
      break;
    }

    case "api": {
      const { startServer, API_PORT } = await import("./api/server.ts");
      console.log(`Starting API on port ${API_PORT}...`);
      startServer(API_PORT);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      usage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
