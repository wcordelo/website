import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateTask } from "../src/pipeline/validator.ts";
import { loadTasksFromDir } from "../src/orchestrator.ts";

const tasksDir = join(import.meta.dirname, "../data/sample-tasks");

describe("TypeScript tasks (BENCH-028)", () => {
  test("5 TypeScript task files exist", async () => {
    const files = await readdir(tasksDir);
    const tsTasks = files.filter((f) => f.startsWith("ts-") && f.endsWith(".json"));
    expect(tsTasks.length).toBeGreaterThanOrEqual(5);
  });

  test("all TypeScript tasks pass validation", async () => {
    const files = (await readdir(tasksDir)).filter(
      (f) => f.startsWith("ts-") && f.endsWith(".json")
    );
    for (const file of files) {
      const raw = await readFile(join(tasksDir, file), "utf8");
      const task = JSON.parse(raw);
      expect(task.language).toBe("typescript");
      const result = validateTask(task);
      expect(result.valid).toBe(true);
    }
  });

  test("TypeScript tasks load via orchestrator", async () => {
    const tasks = await loadTasksFromDir(tasksDir);
    const tsTasks = tasks.filter((t) => t.language === "typescript");
    expect(tsTasks.length).toBeGreaterThanOrEqual(5);
  });
});

describe("sample partner scorecard (BENCH-019)", () => {
  test("partner scorecard exists with pass@k data", async () => {
    const raw = await readFile(
      join(import.meta.dirname, "../data/sample-reports/partner-acme-scorecard.json"),
      "utf8"
    );
    const scorecard = JSON.parse(raw);
    expect(scorecard.runId).toBe("run-partner-acme-2026q2");
    expect(scorecard.passAtK).toHaveLength(3);
    expect(scorecard.contamination.crsScore).toBeLessThan(0.1);
  });
});
