const API_BASE = "";

export interface EvalRunSummary {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  model: string;
  startedAt: string;
}

export interface TaskRunResult {
  taskId: string;
  runIndex: number;
  passed: boolean;
  durationMs: number;
  failureMode?: string;
}

export interface EvalRun extends EvalRunSummary {
  tasksDir: string;
  runsPerTask: number;
  completedAt?: string;
  results: TaskRunResult[];
  vaultVersion: string;
}

export interface PassAtKResult {
  k: number;
  estimate: number;
  wilsonLower: number;
  wilsonUpper: number;
  bootstrapLower: number;
  bootstrapUpper: number;
  nTasks: number;
  nRuns: number;
}

export interface Scorecard {
  runId: string;
  model: string;
  generatedAt: string;
  methodologyVersion: string;
  vaultVersion: string;
  passAtK: PassAtKResult[];
  rewardHackRate: number;
  failureModes: Record<string, number>;
  byScope: Record<string, { passRate: number; n: number }>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; service: string; version: string }>("/health"),
  listRuns: () => request<{ runs: EvalRunSummary[] }>("/v1/runs"),
  getRun: (runId: string) => request<EvalRun>(`/v1/runs/${runId}`),
  getReport: (runId: string) => request<Scorecard>(`/v1/runs/${runId}/report`),
  createRun: (body: { model?: string; runsPerTask?: number }) =>
    request<{ runId: string; status: string }>("/v1/runs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateReport: (runId: string) =>
    request<{ runId: string; reportDir: string; formats: string[] }>(
      `/v1/runs/${runId}/report`,
      { method: "POST" }
    ),
};
