import { describe, expect, test } from "bun:test";
import { QAWorkflow, reviewProgress } from "../src/qa/workflow.ts";
import type { BenchTask } from "../src/types.ts";

const sampleTask: Partial<BenchTask> = {
  title: "Fix pagination bug",
  description: "Offset equals page size causes duplicates.",
  language: "python",
  files: ["src/service.py"],
  testCommand: "pytest -q",
  temporal: { createdAt: "2025-03-12T00:00:00Z", licenseId: "test" },
};

describe("QAWorkflow", () => {
  test("submit creates 3-reviewer queue item", () => {
    const qa = new QAWorkflow();
    const item = qa.submit(sampleTask);
    expect(item.reviewers).toHaveLength(3);
    expect(item.status).toBe("in_review");
    expect(item.requiredApprovals).toBe(2);
  });

  test("rejects invalid tasks", () => {
    const qa = new QAWorkflow();
    expect(() => qa.submit({ title: "" })).toThrow("auto-validation");
  });

  test("2-of-3 approvals reaches consensus", () => {
    const qa = new QAWorkflow();
    const item = qa.submit(sampleTask);
    qa.submitReview(item.id, "reviewer-slot-1", "approve");
    qa.submitReview(item.id, "reviewer-slot-2", "approve");
    const updated = qa.getItem(item.id)!;
    expect(updated.status).toBe("approved");
    expect(updated.completedAt).toBeDefined();
  });

  test("2 rejections rejects task", () => {
    const qa = new QAWorkflow();
    const item = qa.submit(sampleTask);
    qa.submitReview(item.id, "reviewer-slot-1", "reject", "not solvable");
    qa.submitReview(item.id, "reviewer-slot-2", "reject", "ambiguous");
    expect(qa.getItem(item.id)!.status).toBe("rejected");
  });

  test("finalizeApproved returns vault-ready task", () => {
    const qa = new QAWorkflow();
    const item = qa.submit(sampleTask);
    qa.submitReview(item.id, "reviewer-slot-1", "approve");
    qa.submitReview(item.id, "reviewer-slot-2", "approve");
    const task = qa.finalizeApproved(item.id, "swe-qa-001");
    expect(task.id).toBe("swe-qa-001");
    expect(task.scope).toBeDefined();
  });

  test("listPending returns in-review items", () => {
    const qa = new QAWorkflow();
    qa.submit(sampleTask);
    expect(qa.listPending()).toHaveLength(1);
  });
});

describe("reviewProgress", () => {
  test("tracks reviewer decisions", () => {
    const qa = new QAWorkflow();
    const item = qa.submit(sampleTask);
    qa.submitReview(item.id, "reviewer-slot-1", "approve");
    const progress = reviewProgress(qa.getItem(item.id)!);
    expect(progress.completed).toBe(1);
    expect(progress.approvals).toBe(1);
    expect(progress.total).toBe(3);
  });
});
