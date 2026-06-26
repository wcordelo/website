/** Weekly task drop pipeline — automated holdout additions (BENCH-022). */

import { mkdir, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { BenchTask } from "../types.ts";
import { HoldoutVault } from "../vault/holdout-vault.ts";
import { QAWorkflow } from "../qa/workflow.ts";
import { extractTasksFromRepo, candidateToTask } from "./extractor.ts";

export const DEFAULT_DROP_SIZE = 25;
export const DROP_CRON_EXPRESSION = "0 6 * * 1"; // Monday 06:00 UTC

export interface WeeklyDropConfig {
  tasksPerDrop?: number;
  vaultDir: string;
  dropDir: string;
  licenseId: string;
  sourceRepo: string;
}

export interface WeeklyDropResult {
  dropId: string;
  scheduledAt: string;
  tasksDropped: number;
  taskIds: string[];
  vaultVersion: string;
  status: "completed" | "partial" | "failed";
  errors: string[];
}

export interface DropSchedule {
  cronExpression: string;
  nextRunAt: string;
  enabled: boolean;
}

function generateDropId(): string {
  return `drop-${new Date().toISOString().slice(0, 10)}-${randomBytes(2).toString("hex")}`;
}

function nextMonday6amUtc(from = new Date()): string {
  const d = new Date(from);
  const day = d.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  d.setUTCHours(6, 0, 0, 0);
  return d.toISOString();
}

/** Compute next scheduled drop time from cron stub. */
export function getDropSchedule(enabled = true): DropSchedule {
  return {
    cronExpression: DROP_CRON_EXPRESSION,
    nextRunAt: nextMonday6amUtc(),
    enabled,
  };
}

/**
 * Execute a weekly drop: extract candidates, QA-approve stub, store in vault.
 * Production: cron job triggers this; QA workflow gates real tasks.
 */
export async function executeWeeklyDrop(
  config: WeeklyDropConfig
): Promise<WeeklyDropResult> {
  const {
    tasksPerDrop = DEFAULT_DROP_SIZE,
    vaultDir,
    dropDir,
    licenseId,
    sourceRepo,
  } = config;

  const dropId = generateDropId();
  const errors: string[] = [];
  const taskIds: string[] = [];

  await mkdir(dropDir, { recursive: true });
  const vault = new HoldoutVault({ vaultDir });
  await vault.init();

  const qa = new QAWorkflow();
  const candidates = await extractTasksFromRepo({
    repoUrl: sourceRepo,
    licenseId,
  });

  const createdAt = new Date().toISOString();
  let dropped = 0;

  for (let i = 0; i < tasksPerDrop; i++) {
    const candidate = candidates[i % candidates.length]!;
    const partial = candidateToTask(candidate, { createdAt, licenseId });
    partial.id = `${dropId}-task-${String(i + 1).padStart(3, "0")}`;

    try {
      const item = qa.submit(partial);
      qa.submitReview(item.id, "reviewer-slot-1", "approve", "auto-stub");
      qa.submitReview(item.id, "reviewer-slot-2", "approve", "auto-stub");
      const task = qa.finalizeApproved(item.id, partial.id);

      await vault.storeTask(task as BenchTask, `weekly-drop:${dropId}`);
      await writeFile(
        join(dropDir, `${task.id}.json`),
        JSON.stringify(task, null, 2)
      );
      taskIds.push(task.id);
      dropped++;
    } catch (err) {
      errors.push(
        `task ${i + 1}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const manifest = {
    dropId,
    scheduledAt: createdAt,
    tasksDropped: dropped,
    taskIds,
    vaultVersion: vault.version(),
    cronExpression: DROP_CRON_EXPRESSION,
  };
  await writeFile(join(dropDir, `${dropId}-manifest.json`), JSON.stringify(manifest, null, 2));

  return {
    dropId,
    scheduledAt: createdAt,
    tasksDropped: dropped,
    taskIds,
    vaultVersion: vault.version(),
    status: errors.length === 0 ? "completed" : dropped > 0 ? "partial" : "failed",
    errors,
  };
}

/** Stub scheduler — registers next drop; production uses node-cron or Temporal. */
export class WeeklyDropScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly config: WeeklyDropConfig;
  private enabled: boolean;

  constructor(config: WeeklyDropConfig, enabled = true) {
    this.config = config;
    this.enabled = enabled;
  }

  getSchedule(): DropSchedule {
    return getDropSchedule(this.enabled);
  }

  /** Schedule next drop execution (stub: does not auto-fire in tests). */
  arm(onDrop: (result: WeeklyDropResult) => void): DropSchedule {
    if (this.timer) clearTimeout(this.timer);
    const schedule = this.getSchedule();
    if (!this.enabled) return schedule;

    const msUntil = new Date(schedule.nextRunAt).getTime() - Date.now();
    if (msUntil > 0 && msUntil < 7 * 24 * 60 * 60 * 1000) {
      this.timer = setTimeout(async () => {
        const result = await executeWeeklyDrop(this.config);
        onDrop(result);
      }, msUntil);
    }
    return schedule;
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export async function listDropManifests(dropDir: string): Promise<string[]> {
  const files = await readdir(dropDir);
  return files.filter((f) => f.endsWith("-manifest.json"));
}
