/** Temporal decontamination tags (BENCH-014). */

import type { BenchTask, TemporalTag } from "../types.ts";

export function createTemporalTag(
  createdAt: string,
  opts: Partial<Omit<TemporalTag, "createdAt">> = {}
): TemporalTag {
  return { createdAt, ...opts };
}

/** Exclude tasks created before model training cutoff for fair eval. */
export function isFairForCutoff(task: BenchTask, modelCutoff: string): boolean {
  const taskDate = new Date(task.temporal.createdAt).getTime();
  const cutoff = new Date(modelCutoff).getTime();
  return taskDate >= cutoff;
}

export function filterFairTasks(
  tasks: BenchTask[],
  modelCutoff: string
): { fair: BenchTask[]; excluded: BenchTask[] } {
  const fair: BenchTask[] = [];
  const excluded: BenchTask[] = [];
  for (const t of tasks) {
    if (isFairForCutoff(t, modelCutoff)) fair.push(t);
    else excluded.push(t);
  }
  return { fair, excluded };
}

export function tagSchemaVersion(): string {
  return "temporal-v1";
}
