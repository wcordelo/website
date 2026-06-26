/** Bootstrap confidence intervals (BENCH-011). */

export interface BootstrapOptions {
  iterations?: number;
  confidence?: number;
  seed?: number;
}

/** Simple LCG for reproducible bootstrap. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function bootstrapMeanCI(
  samples: number[],
  options: BootstrapOptions = {}
): { lower: number; upper: number; mean: number } {
  const { iterations = 1000, confidence = 0.95, seed = 42 } = options;
  if (samples.length === 0) {
    return { lower: 0, upper: 0, mean: 0 };
  }

  const rng = makeRng(seed);
  const n = samples.length;
  const bootMeans: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(rng() * n);
      sum += samples[idx]!;
    }
    bootMeans.push(sum / n);
  }

  bootMeans.sort((a, b) => a - b);
  const alpha = (1 - confidence) / 2;
  const loIdx = Math.floor(alpha * iterations);
  const hiIdx = Math.floor((1 - alpha) * iterations);
  const mean = samples.reduce((a, b) => a + b, 0) / n;

  return {
    mean,
    lower: bootMeans[loIdx] ?? 0,
    upper: bootMeans[hiIdx] ?? 1,
  };
}
