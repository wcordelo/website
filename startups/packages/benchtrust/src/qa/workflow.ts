/** Human QA workflow — 3-reviewer consensus (BENCH-006). */

import { randomBytes } from "node:crypto";
import type { BenchTask } from "../types.ts";
import { validateTask } from "../pipeline/validator.ts";
import { classifyTask } from "../pipeline/classifier.ts";

export type ReviewDecision = "approve" | "reject" | "needs_revision";
export type ReviewQueueStatus = "pending" | "in_review" | "approved" | "rejected" | "revision";

export interface ReviewerAssignment {
  reviewerId: string;
  assignedAt: string;
  decision?: ReviewDecision;
  notes?: string;
  decidedAt?: string;
}

export interface QAQueueItem {
  id: string;
  task: Partial<BenchTask>;
  status: ReviewQueueStatus;
  reviewers: ReviewerAssignment[];
  requiredApprovals: number;
  submittedAt: string;
  completedAt?: string;
  validationScore: number;
}

export interface QAWorkflowConfig {
  reviewersPerTask?: number;
  requiredApprovals?: number;
}

const DEFAULT_CONFIG: Required<QAWorkflowConfig> = {
  reviewersPerTask: 3,
  requiredApprovals: 2,
};

function generateQueueId(): string {
  return `qa-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`;
}

/** In-memory review queue — production persists to DB. */
export class QAWorkflow {
  private readonly config: Required<QAWorkflowConfig>;
  private readonly queue = new Map<string, QAQueueItem>();

  constructor(config: QAWorkflowConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  submit(task: Partial<BenchTask>): QAQueueItem {
    const validation = validateTask(task);
    if (!validation.valid) {
      throw new Error(`Task failed auto-validation: ${validation.errors.join(", ")}`);
    }

    const id = generateQueueId();
    const now = new Date().toISOString();
    const reviewers: ReviewerAssignment[] = [];

    for (let i = 0; i < this.config.reviewersPerTask; i++) {
      reviewers.push({
        reviewerId: `reviewer-slot-${i + 1}`,
        assignedAt: now,
      });
    }

    const item: QAQueueItem = {
      id,
      task,
      status: "in_review",
      reviewers,
      requiredApprovals: this.config.requiredApprovals,
      submittedAt: now,
      validationScore: validation.score,
    };

    this.queue.set(id, item);
    return item;
  }

  getItem(id: string): QAQueueItem | undefined {
    return this.queue.get(id);
  }

  listPending(): QAQueueItem[] {
    return [...this.queue.values()].filter(
      (item) => item.status === "in_review" || item.status === "pending"
    );
  }

  listAll(): QAQueueItem[] {
    return [...this.queue.values()];
  }

  submitReview(
    queueId: string,
    reviewerId: string,
    decision: ReviewDecision,
    notes?: string
  ): QAQueueItem {
    const item = this.queue.get(queueId);
    if (!item) throw new Error(`Queue item not found: ${queueId}`);
    if (item.status !== "in_review" && item.status !== "pending") {
      throw new Error(`Item ${queueId} is not open for review (status: ${item.status})`);
    }

    const slot = item.reviewers.find(
      (r) => r.reviewerId === reviewerId && !r.decision
    );
    if (!slot) {
      throw new Error(`No open reviewer slot for ${reviewerId} on ${queueId}`);
    }

    slot.decision = decision;
    slot.notes = notes;
    slot.decidedAt = new Date().toISOString();

    return this.resolveConsensus(item);
  }

  private resolveConsensus(item: QAQueueItem): QAQueueItem {
    const decisions = item.reviewers
      .map((r) => r.decision)
      .filter((d): d is ReviewDecision => d !== undefined);

    const approvals = decisions.filter((d) => d === "approve").length;
    const rejections = decisions.filter((d) => d === "reject").length;
    const revisions = decisions.filter((d) => d === "needs_revision").length;
    const pending = item.reviewers.length - decisions.length;

    if (rejections >= 2) {
      item.status = "rejected";
      item.completedAt = new Date().toISOString();
      return item;
    }

    if (revisions >= 2) {
      item.status = "revision";
      item.completedAt = new Date().toISOString();
      return item;
    }

    if (approvals >= item.requiredApprovals) {
      item.status = "approved";
      item.completedAt = new Date().toISOString();
      return item;
    }

    if (pending === 0 && approvals < item.requiredApprovals) {
      item.status = "rejected";
      item.completedAt = new Date().toISOString();
    }

    return item;
  }

  /** Promote approved task to vault-ready BenchTask with scope classification. */
  finalizeApproved(queueId: string, taskId: string): BenchTask {
    const item = this.queue.get(queueId);
    if (!item) throw new Error(`Queue item not found: ${queueId}`);
    if (item.status !== "approved") {
      throw new Error(`Item ${queueId} is not approved (status: ${item.status})`);
    }

    const task = item.task as BenchTask;
    task.id = taskId;
    if (!task.scope) {
      const { scope } = classifyTask(task);
      task.scope = scope;
    }
    return task;
  }
}

export function reviewProgress(item: QAQueueItem): {
  total: number;
  completed: number;
  approvals: number;
  rejections: number;
  revisions: number;
} {
  const completed = item.reviewers.filter((r) => r.decision).length;
  const approvals = item.reviewers.filter((r) => r.decision === "approve").length;
  const rejections = item.reviewers.filter((r) => r.decision === "reject").length;
  const revisions = item.reviewers.filter((r) => r.decision === "needs_revision").length;
  return {
    total: item.reviewers.length,
    completed,
    approvals,
    rejections,
    revisions,
  };
}
