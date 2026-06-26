/** Core BenchTrust domain types (BENCH-014 temporal tags included). */

export type TaskScope = "narrow" | "wide";

export interface TemporalTag {
  createdAt: string;
  modelCutoff?: string;
  sourceRepo?: string;
  licenseId?: string;
}

export interface BenchTask {
  id: string;
  title: string;
  description: string;
  language: string;
  scope?: TaskScope;
  files: string[];
  testCommand: string;
  temporal: TemporalTag;
  canaryId?: string;
}

export interface TaskRunResult {
  taskId: string;
  runIndex: number;
  passed: boolean;
  durationMs: number;
  failureMode?: string;
  rewardHackFlags?: string[];
}

export interface EvalRun {
  id: string;
  model: string;
  tasksDir: string;
  runsPerTask: number;
  startedAt: string;
  completedAt?: string;
  status: "pending" | "running" | "completed" | "failed";
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

export interface ContaminationReport {
  model: string;
  crsScore: number;
  canaryLeaks: number;
  flaggedTasks: Array<{ taskId: string; similarity: number; source: string }>;
  scannedAt: string;
}

export interface Scorecard {
  runId: string;
  model: string;
  generatedAt: string;
  methodologyVersion: string;
  vaultVersion: string;
  passAtK: PassAtKResult[];
  contamination?: ContaminationReport;
  rewardHackRate: number;
  failureModes: Record<string, number>;
  byScope: Record<TaskScope, { passRate: number; n: number }>;
}
