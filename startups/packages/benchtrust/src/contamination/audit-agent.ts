/** Contamination audit agent (BENCH-013). */

import type { BenchTask, ContaminationReport } from "../types.ts";
import { detectCanaryLeak, type CanaryRecord } from "./canary.ts";
import { computeCRS, jaccardSimilarity } from "./crs.ts";

export interface AuditOptions {
  model: string;
  tasks?: BenchTask[];
  canaries?: CanaryRecord[];
  publicCorpus?: Array<{ source: string; text: string }>;
}

/** Stub public corpus for regurgitation probes. */
const DEFAULT_CORPUS = [
  {
    source: "github:sample/repo#issue-42",
    text: "Fix pagination offset in user service when offset exceeds limit",
  },
  {
    source: "stackoverflow:12345",
    text: "How to implement JWT middleware validation in Express",
  },
  {
    source: "common-crawl:abc123",
    text: "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
  },
];

/**
 * Regurgitation probe stub — simulates embedding search against public corpora.
 */
export async function auditContamination(
  options: AuditOptions
): Promise<ContaminationReport> {
  const { model, tasks = [], canaries = [], publicCorpus = DEFAULT_CORPUS } = options;

  const taskTexts = tasks.map((t) => `${t.title}\n${t.description}`);
  const { crsScore, matches } = computeCRS(taskTexts, publicCorpus);

  const flaggedTasks = matches.map((m) => ({
    taskId: tasks[m.taskIndex]?.id ?? `task-${m.taskIndex}`,
    similarity: m.similarity,
    source: m.source,
  }));

  // Probe model regurgitation: check if model output contains task-like content
  const modelProbeText = `[${model}] benchmark training data recall probe`;
  let canaryLeaks = 0;
  for (const canary of canaries) {
    const corpusWithCanary = publicCorpus.map((c) => c.text).join("\n");
    if (detectCanaryLeak(corpusWithCanary, [canary]).length > 0) {
      canaryLeaks++;
    }
  }

  // Stub: flag high similarity between model name hash and corpus
  const modelSim = publicCorpus.some(
    (c) => jaccardSimilarity(modelProbeText, c.text) > 0.5
  );

  return {
    model,
    crsScore: modelSim ? Math.max(crsScore, 0.1) : crsScore,
    canaryLeaks,
    flaggedTasks,
    scannedAt: new Date().toISOString(),
  };
}

export async function scanContamination(model: string): Promise<ContaminationReport> {
  return auditContamination({ model });
}
