import { describe, expect, test } from "bun:test";
import {
  buildWandBPayload,
  exportRunToWandB,
  wandbOfflineBundle,
} from "../src/integrations/wandb.ts";
import type { EvalRun, Scorecard } from "../src/types.ts";

const mockEvalRun: EvalRun = {
  id: "run-test-wandb",
  model: "test-model-v1",
  tasksDir: "/data/tasks",
  runsPerTask: 16,
  startedAt: "2026-06-01T00:00:00Z",
  completedAt: "2026-06-01T01:00:00Z",
  status: "completed",
  vaultVersion: "holdout-vault-0.1.0",
  results: [
    { taskId: "t1", runIndex: 0, passed: true, durationMs: 100 },
    { taskId: "t1", runIndex: 1, passed: false, durationMs: 200 },
    { taskId: "t2", runIndex: 0, passed: true, durationMs: 150 },
    { taskId: "t2", runIndex: 1, passed: true, durationMs: 120 },
  ],
};

const mockScorecard: Scorecard = {
  runId: "run-test-wandb",
  model: "test-model-v1",
  generatedAt: "2026-06-01T01:00:00Z",
  methodologyVersion: "manifesto-v0.1-draft",
  vaultVersion: "holdout-vault-0.1.0",
  passAtK: [
    {
      k: 1,
      estimate: 0.75,
      wilsonLower: 0.5,
      wilsonUpper: 0.9,
      bootstrapLower: 0.6,
      bootstrapUpper: 0.85,
      nTasks: 2,
      nRuns: 4,
    },
  ],
  rewardHackRate: 0,
  failureModes: {},
  byScope: {
    narrow: { passRate: 0.75, n: 2 },
    wide: { passRate: 0, n: 0 },
  },
};

describe("W&B integration", () => {
  test("buildWandBPayload includes pass@k metrics", () => {
    const payload = buildWandBPayload(mockEvalRun, mockScorecard, {
      project: "benchtrust-evals",
      entity: "acme",
    });

    expect(payload.name).toBe("benchtrust-run-test-wandb");
    expect(payload.project).toBe("benchtrust-evals");
    expect(payload.summary.pass_at_1).toBe(0.75);
    expect(payload.summary.n_tasks).toBe(2);
    expect(payload.tags).toContain("benchtrust");
  });

  test("exportRunToWandB dry-run does not require API key", async () => {
    const result = await exportRunToWandB(mockEvalRun, {
      project: "benchtrust-evals",
    }, { dryRun: true });

    expect(result.runId).toBe("run-test-wandb");
    expect(result.wandbRunName).toContain("benchtrust");
    expect(result.apiEndpoint).toContain("wandb");
  });

  test("wandbOfflineBundle serializes payload", async () => {
    const result = await exportRunToWandB(mockEvalRun, {
      project: "benchtrust-evals",
    }, { dryRun: true });

    const bundle = wandbOfflineBundle(result);
    const parsed = JSON.parse(bundle);
    expect(parsed.source).toBe("benchtrust");
    expect(parsed.run.project).toBe("benchtrust-evals");
  });
});
