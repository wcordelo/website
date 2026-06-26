/** Weights & Biases / MLOps export integration (BENCH-027). */

import type { EvalRun, Scorecard } from "../types.ts";
import { evalRunToScorecard } from "../orchestrator.ts";

export interface WandBConfig {
  project: string;
  entity?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface WandBRunPayload {
  name: string;
  project: string;
  entity?: string;
  config: Record<string, unknown>;
  summary: Record<string, number | string>;
  tags: string[];
}

export interface WandBExportResult {
  runId: string;
  wandbRunName: string;
  payload: WandBRunPayload;
  exportedAt: string;
  apiEndpoint: string;
}

const DEFAULT_BASE_URL = "https://api.wandb.ai";

/** Build W&B-compatible run payload from BenchTrust eval. */
export function buildWandBPayload(
  evalRun: EvalRun,
  scorecard: Scorecard,
  config: WandBConfig
): WandBRunPayload {
  const summary: Record<string, number | string> = {
    benchtrust_run_id: evalRun.id,
    vault_version: scorecard.vaultVersion,
    methodology_version: scorecard.methodologyVersion,
    reward_hack_rate: scorecard.rewardHackRate,
    n_tasks: new Set(evalRun.results.map((r) => r.taskId)).size,
    n_runs: evalRun.results.length,
  };

  for (const p of scorecard.passAtK) {
    summary[`pass_at_${p.k}`] = p.estimate;
    summary[`pass_at_${p.k}_wilson_lower`] = p.wilsonLower;
    summary[`pass_at_${p.k}_wilson_upper`] = p.wilsonUpper;
  }

  for (const [scope, data] of Object.entries(scorecard.byScope)) {
    summary[`pass_rate_${scope}`] = data.passRate;
    summary[`n_tasks_${scope}`] = data.n;
  }

  if (scorecard.contamination) {
    summary.crs_score = scorecard.contamination.crsScore;
    summary.canary_leaks = scorecard.contamination.canaryLeaks;
  }

  return {
    name: `benchtrust-${evalRun.id}`,
    project: config.project,
    entity: config.entity,
    config: {
      model: evalRun.model,
      runs_per_task: evalRun.runsPerTask,
      tasks_dir: evalRun.tasksDir,
      started_at: evalRun.startedAt,
      completed_at: evalRun.completedAt,
    },
    summary,
    tags: [
      "benchtrust",
      `vault:${scorecard.vaultVersion}`,
      `model:${evalRun.model}`,
    ],
  };
}

/** Export eval run to W&B format (HTTP POST stub — no network in unit tests). */
export async function exportRunToWandB(
  evalRun: EvalRun,
  config: WandBConfig,
  options: { dryRun?: boolean } = {}
): Promise<WandBExportResult> {
  const scorecard = evalRunToScorecard(evalRun);
  const payload = buildWandBPayload(evalRun, scorecard, config);
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const apiEndpoint = `${baseUrl}/graphql`;

  if (!options.dryRun && config.apiKey) {
    await postToWandB(apiEndpoint, config.apiKey, payload);
  }

  return {
    runId: evalRun.id,
    wandbRunName: payload.name,
    payload,
    exportedAt: new Date().toISOString(),
    apiEndpoint,
  };
}

async function postToWandB(
  endpoint: string,
  apiKey: string,
  payload: WandBRunPayload
): Promise<void> {
  const mutation = {
    query: `mutation UpsertBenchTrustRun($input: JSON!) { upsertRun(input: $input) { id } }`,
    variables: { input: payload },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(mutation),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`W&B export failed (${res.status}): ${text}`);
  }
}

/** Serialize payload for offline import via `wandb sync`. */
export function wandbOfflineBundle(result: WandBExportResult): string {
  return JSON.stringify(
    {
      version: 1,
      source: "benchtrust",
      exportedAt: result.exportedAt,
      run: result.payload,
    },
    null,
    2
  );
}
