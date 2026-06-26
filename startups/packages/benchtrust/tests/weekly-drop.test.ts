import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  executeWeeklyDrop,
  getDropSchedule,
  WeeklyDropScheduler,
  listDropManifests,
  DEFAULT_DROP_SIZE,
  DROP_CRON_EXPRESSION,
} from "../src/pipeline/weekly-drop.ts";

describe("weekly drop", () => {
  test("getDropSchedule returns Monday cron", () => {
    const schedule = getDropSchedule();
    expect(schedule.cronExpression).toBe(DROP_CRON_EXPRESSION);
    expect(schedule.enabled).toBe(true);
    expect(new Date(schedule.nextRunAt).getUTCDay()).toBe(1);
  });

  test("executeWeeklyDrop stores tasks in vault and drop dir", async () => {
    const base = await mkdtemp(join(tmpdir(), "benchtrust-drop-"));
    const vaultDir = join(base, "vault");
    const dropDir = join(base, "drops");

    try {
      const result = await executeWeeklyDrop({
        tasksPerDrop: 3,
        vaultDir,
        dropDir,
        licenseId: "test-license",
        sourceRepo: "https://github.com/test/repo",
      });

      expect(result.tasksDropped).toBe(3);
      expect(result.taskIds).toHaveLength(3);
      expect(result.status).toBe("completed");
      expect(result.vaultVersion).toContain("holdout-vault");

      const manifests = await listDropManifests(dropDir);
      expect(manifests).toHaveLength(1);

      const manifest = JSON.parse(
        await readFile(join(dropDir, manifests[0]!), "utf8")
      );
      expect(manifest.tasksDropped).toBe(3);
    } finally {
      await rm(base, { recursive: true, force: true });
    }
  });

  test("WeeklyDropScheduler arms without throwing", () => {
    const scheduler = new WeeklyDropScheduler(
      {
        vaultDir: "/tmp/vault",
        dropDir: "/tmp/drops",
        licenseId: "test",
        sourceRepo: "test/repo",
      },
      false
    );
    const schedule = scheduler.arm(() => {});
    expect(schedule.enabled).toBe(false);
    scheduler.stop();
  });

  test("DEFAULT_DROP_SIZE is 25", () => {
    expect(DEFAULT_DROP_SIZE).toBe(25);
  });
});
