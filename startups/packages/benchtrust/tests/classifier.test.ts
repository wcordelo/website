import { describe, expect, test } from "bun:test";
import { classifyTask, extractFeatures } from "../src/pipeline/classifier.ts";
import type { BenchTask } from "../src/types.ts";

const narrowTask: Partial<BenchTask> = {
  title: "Fix typo in logger",
  description: "Correct misspelled log level in debug output.",
  files: ["src/logger.py"],
  testCommand: "pytest",
};

const wideTask: Partial<BenchTask> = {
  title: "Refactor auth across codebase",
  description:
    "Migrate JWT validation throughout all route modules across the entire API surface. Multi-file refactor required.",
  files: [
    "src/auth/a.py",
    "src/auth/b.py",
    "src/routes/c.py",
    "src/routes/d.py",
    "src/routes/e.py",
    "src/middleware/f.py",
    "src/middleware/g.py",
    "src/middleware/h.py",
    "src/middleware/i.py",
  ],
  testCommand: "pytest",
};

describe("narrow/wide classifier", () => {
  test("classifies single-file bugfix as narrow", () => {
    const result = classifyTask(narrowTask);
    expect(result.scope).toBe("narrow");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test("classifies multi-file refactor as wide", () => {
    const result = classifyTask(wideTask);
    expect(result.scope).toBe("wide");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test("extractFeatures counts files and keywords", () => {
    const features = extractFeatures(wideTask);
    expect(features.fileCount).toBe(9);
    expect(features.hasRefactorKeyword).toBe(true);
    expect(features.hasMultiModuleKeyword).toBe(true);
  });

  test("narrow task has low file count", () => {
    const features = extractFeatures(narrowTask);
    expect(features.fileCount).toBe(1);
    expect(features.hasRefactorKeyword).toBe(false);
  });
});
