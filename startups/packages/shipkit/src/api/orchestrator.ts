import { randomUUID } from "node:crypto";
import type { ScanJob, ScanJobStatus } from "../types.js";
import { runScan } from "../scanner/index.js";

/**
 * Queue-based cloud scan orchestrator (MOB-017).
 * In-memory queue for v0.1; swap for Redis/SQS in production.
 */
export class ScanOrchestrator {
  private jobs = new Map<string, ScanJob>();
  private queue: string[] = [];
  private processing = false;

  enqueue(projectPath: string): ScanJob {
    const job: ScanJob = {
      id: randomUUID(),
      projectPath,
      status: "queued",
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    this.queue.push(job.id);
    void this.processQueue();
    return job;
  }

  getJob(id: string): ScanJob | undefined {
    return this.jobs.get(id);
  }

  listJobs(status?: ScanJobStatus): ScanJob[] {
    const all = [...this.jobs.values()];
    return status ? all.filter((j) => j.status === status) : all;
  }

  getQueueDepth(): number {
    return this.queue.length;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const id = this.queue.shift();
      if (!id) break;

      const job = this.jobs.get(id);
      if (!job || job.status !== "queued") continue;

      job.status = "running";
      try {
        const result = runScan(job.projectPath);
        job.result = result;
        job.status = "completed";
        job.completedAt = new Date().toISOString();
      } catch (err) {
        job.status = "failed";
        job.error = err instanceof Error ? err.message : String(err);
        job.completedAt = new Date().toISOString();
      }
    }

    this.processing = false;
  }
}

let defaultOrchestrator: ScanOrchestrator | null = null;

export function getOrchestrator(): ScanOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new ScanOrchestrator();
  }
  return defaultOrchestrator;
}

export function resetOrchestrator(): void {
  defaultOrchestrator = new ScanOrchestrator();
}
