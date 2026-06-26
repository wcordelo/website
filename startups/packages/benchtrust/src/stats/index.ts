/** pass@k statistics engine (BENCH-011). */

import type { PassAtKResult, TaskRunResult } from "../types.ts";
import { aggregatePassAtK, passAtK } from "./pass-at-k.ts";
import { bootstrapMeanCI } from "./bootstrap.ts";
import { wilsonCI } from "./wilson.ts";

export { passAtK, aggregatePassAtK } from "./pass-at-k.ts";
export { wilsonCI } from "./wilson.ts";
export { bootstrapMeanCI } from "./bootstrap.ts";

export function computePassAtKReport(
  results: TaskRunResult[],
  runsPerTask: number,
  kValues: number[] = [1, 5, 10]
): PassAtKResult[] {
  const byTask = new Map<string, number>();
  for (const r of results) {
    if (!byTask.has(r.taskId)) byTask.set(r.taskId, 0);
    if (r.passed) byTask.set(r.taskId, byTask.get(r.taskId)! + 1);
  }

  const perTaskSuccesses = [...byTask.values()];
  const nTasks = perTaskSuccesses.length;

  return kValues.map((k) => {
    const estimate = aggregatePassAtK(perTaskSuccesses, runsPerTask, k);
    const perTaskEstimates = perTaskSuccesses.map((c) =>
      passAtK(runsPerTask, c, k)
    );
    const boot = bootstrapMeanCI(perTaskEstimates, { seed: k * 1000 + 7 });
    const wilson = wilsonCI(
      Math.round(estimate * nTasks),
      nTasks,
      1.96
    );

    return {
      k,
      estimate,
      wilsonLower: wilson.lower,
      wilsonUpper: wilson.upper,
      bootstrapLower: boot.lower,
      bootstrapUpper: boot.upper,
      nTasks,
      nRuns: nTasks * runsPerTask,
    };
  });
}

export function demoStats(): string {
  const results: TaskRunResult[] = [];
  const tasks = ["t1", "t2", "t3", "t4", "t5"];
  const runs = 16;
  for (const taskId of tasks) {
    for (let i = 0; i < runs; i++) {
      const passed = Math.random() > 0.4;
      results.push({ taskId, runIndex: i, passed, durationMs: 1200 + i * 10 });
    }
  }
  const report = computePassAtKReport(results, runs, [1, 5, 10]);
  const lines = report.map(
    (r) =>
      `pass@${r.k}: ${(r.estimate * 100).toFixed(1)}% ` +
      `[Wilson ${(r.wilsonLower * 100).toFixed(1)}–${(r.wilsonUpper * 100).toFixed(1)}%] ` +
      `[Bootstrap ${(r.bootstrapLower * 100).toFixed(1)}–${(r.bootstrapUpper * 100).toFixed(1)}%]`
  );
  return lines.join("\n");
}
