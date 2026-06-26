/** pass@k estimator (BENCH-011). */

/**
 * Unbiased pass@k estimator for n samples per problem.
 * @see Chen et al., "Evaluating Large Language Models Trained on Code"
 */
export function passAtK(n: number, c: number, k: number): number {
  if (k > n) return c > 0 ? 1 : 0;
  if (c === 0) return 0;
  if (c >= n) return 1;
  let prod = 1;
  for (let i = 0; i < k; i++) {
    prod *= (n - c - i) / (n - i);
  }
  return 1 - prod;
}

export function aggregatePassAtK(
  perTaskSuccesses: number[],
  runsPerTask: number,
  k: number
): number {
  if (perTaskSuccesses.length === 0) return 0;
  const estimates = perTaskSuccesses.map((c) => passAtK(runsPerTask, c, k));
  return estimates.reduce((a, b) => a + b, 0) / estimates.length;
}
