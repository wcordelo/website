/** Wilson score confidence interval (BENCH-011). */

export interface WilsonCI {
  lower: number;
  upper: number;
  center: number;
}

/**
 * Wilson score interval for a binomial proportion.
 * @param successes number of successes
 * @param trials total trials
 * @param z z-score (1.96 for 95% CI)
 */
export function wilsonCI(
  successes: number,
  trials: number,
  z = 1.96
): WilsonCI {
  if (trials === 0) {
    return { lower: 0, upper: 0, center: 0 };
  }
  const p = successes / trials;
  const z2 = z * z;
  const denom = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denom;
  const margin =
    (z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials)) / denom;
  return {
    center,
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
}
