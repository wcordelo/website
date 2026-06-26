/** Failure mode taxonomy (BENCH-031). */

export const FAILURE_MODES = {
  WRONG_APPROACH: "wrong_approach",
  PARTIAL_FIX: "partial_fix",
  TEST_HACK: "test_hack",
  TIMEOUT: "timeout",
  TOOL_MISUSE: "tool_misuse",
  HALLUCINATED_API: "hallucinated_api",
} as const;

export type FailureMode = (typeof FAILURE_MODES)[keyof typeof FAILURE_MODES];

export const FAILURE_MODE_LABELS: Record<FailureMode, string> = {
  wrong_approach: "Wrong approach — logic does not address root cause",
  partial_fix: "Partial fix — passes some cases, misses edge conditions",
  test_hack: "Test hack — modified assertions or grader",
  timeout: "Timeout — exceeded sealed runtime limit",
  tool_misuse: "Tool misuse — invalid commands or destructive ops",
  hallucinated_api: "Hallucinated API — invented functions or imports",
};

export function inferFailureMode(
  passed: boolean,
  durationMs: number,
  timeoutMs: number,
  rewardHackFlags: string[] = []
): FailureMode | undefined {
  if (passed) return undefined;
  if (rewardHackFlags.some((f) => f.includes("test") || f.includes("grader"))) {
    return FAILURE_MODES.TEST_HACK;
  }
  if (durationMs >= timeoutMs) return FAILURE_MODES.TIMEOUT;
  if (rewardHackFlags.includes("infinite_loop")) return FAILURE_MODES.TIMEOUT;
  return FAILURE_MODES.PARTIAL_FIX;
}

export function aggregateFailureModes(
  modes: Array<FailureMode | undefined>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of modes) {
    if (!m) continue;
    counts[m] = (counts[m] ?? 0) + 1;
  }
  return counts;
}
