import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadPreflightRules, evaluatePreflight, getPreflightSummary } from "../src/preflight/rules-engine.js";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("preflight rules engine", () => {
  test("loads 40+ rules per store", () => {
    const rules = loadPreflightRules();
    const apple = rules.filter((r) => r.store === "apple");
    const google = rules.filter((r) => r.store === "google");
    expect(apple.length).toBeGreaterThanOrEqual(40);
    expect(google.length).toBeGreaterThanOrEqual(40);
    expect(rules.length).toBeGreaterThanOrEqual(80);
  });

  test("evaluates rules against fixture project", () => {
    const violations = evaluatePreflight(FIXTURE);
    expect(violations.length).toBeGreaterThan(80);
    expect(violations.every((v) => v.ruleId && v.store && typeof v.passed === "boolean")).toBe(true);
  });

  test("flags missing privacy manifest for Expo app", () => {
    const violations = evaluatePreflight(FIXTURE);
    const privacy = violations.find((v) => v.ruleId === "APP-003");
    expect(privacy).toBeDefined();
    expect(privacy!.passed).toBe(false);
    expect(privacy!.severity).toBe("error");
  });

  test("summary counts pass and fail", () => {
    const violations = evaluatePreflight(FIXTURE);
    const summary = getPreflightSummary(violations);
    expect(summary.passed + summary.failed).toBe(violations.length);
    expect(summary.failed).toBeGreaterThan(0);
  });

  test("managed workflow rules pass for Expo fixture", () => {
    const violations = evaluatePreflight(FIXTURE);
    const appConfig = violations.find((v) => v.ruleId === "APP-002");
    expect(appConfig?.passed).toBe(true);
  });
});
