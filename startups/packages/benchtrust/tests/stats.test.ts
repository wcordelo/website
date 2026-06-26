import { describe, expect, test } from "bun:test";
import { passAtK, aggregatePassAtK, computePassAtKReport } from "../src/stats/index.ts";
import { wilsonCI } from "../src/stats/wilson.ts";
import { bootstrapMeanCI } from "../src/stats/bootstrap.ts";
import type { TaskRunResult } from "../src/types.ts";

describe("pass@k", () => {
  test("pass@1 with all successes", () => {
    expect(passAtK(10, 10, 1)).toBe(1);
  });

  test("pass@1 with no successes", () => {
    expect(passAtK(10, 0, 1)).toBe(0);
  });

  test("pass@1 unbiased estimator", () => {
    expect(passAtK(10, 1, 1)).toBeCloseTo(0.1, 5);
  });

  test("pass@k when k > n", () => {
    expect(passAtK(3, 2, 5)).toBe(1);
    expect(passAtK(3, 0, 5)).toBe(0);
  });

  test("aggregatePassAtK averages per-task estimates", () => {
    const result = aggregatePassAtK([10, 0, 5], 10, 1);
    const expected = (1 + 0 + 0.5) / 3;
    expect(result).toBeCloseTo(expected, 5);
  });
});

describe("wilson CI", () => {
  test("returns zero interval for no trials", () => {
    const ci = wilsonCI(0, 0);
    expect(ci.lower).toBe(0);
    expect(ci.upper).toBe(0);
  });

  test("bounds are within [0, 1]", () => {
    const ci = wilsonCI(8, 10);
    expect(ci.lower).toBeGreaterThanOrEqual(0);
    expect(ci.upper).toBeLessThanOrEqual(1);
    expect(ci.lower).toBeLessThanOrEqual(ci.upper);
  });

  test("narrower interval with more trials", () => {
    const small = wilsonCI(5, 10);
    const large = wilsonCI(50, 100);
    expect(large.upper - large.lower).toBeLessThan(small.upper - small.lower);
  });
});

describe("bootstrap CI", () => {
  test("reproducible with same seed", () => {
    const samples = [0.2, 0.4, 0.6, 0.8];
    const a = bootstrapMeanCI(samples, { seed: 123, iterations: 500 });
    const b = bootstrapMeanCI(samples, { seed: 123, iterations: 500 });
    expect(a.lower).toBe(b.lower);
    expect(a.upper).toBe(b.upper);
  });

  test("mean matches sample mean", () => {
    const samples = [0.1, 0.3, 0.5, 0.7, 0.9];
    const result = bootstrapMeanCI(samples, { iterations: 200 });
    expect(result.mean).toBeCloseTo(0.5, 5);
  });
});

describe("computePassAtKReport", () => {
  test("produces report for multiple k values", () => {
    const results: TaskRunResult[] = [];
    for (let i = 0; i < 16; i++) {
      results.push({ taskId: "t1", runIndex: i, passed: i < 8, durationMs: 100 });
      results.push({ taskId: "t2", runIndex: i, passed: i < 4, durationMs: 100 });
    }
    const report = computePassAtKReport(results, 16, [1, 5]);
    expect(report).toHaveLength(2);
    expect(report[0]!.k).toBe(1);
    expect(report[0]!.nTasks).toBe(2);
    expect(report[0]!.estimate).toBeGreaterThan(0);
    expect(report[0]!.wilsonLower).toBeLessThanOrEqual(report[0]!.estimate);
  });
});
