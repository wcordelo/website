import { randomUUID } from "node:crypto";
import type { FeedbackSubmission } from "./types.js";

/**
 * False positive feedback loop (MOB-035).
 * Customers can dispute findings to improve the registry.
 */
const submissions = new Map<string, FeedbackSubmission>();

export function submitFeedback(input: {
  findingId: string;
  projectPath: string;
  reason: string;
}): FeedbackSubmission {
  const submission: FeedbackSubmission = {
    id: randomUUID(),
    findingId: input.findingId,
    projectPath: input.projectPath,
    reason: input.reason,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  submissions.set(submission.id, submission);
  return submission;
}

export function getFeedback(id: string): FeedbackSubmission | undefined {
  return submissions.get(id);
}

export function listFeedback(projectPath?: string): FeedbackSubmission[] {
  const all = [...submissions.values()];
  if (!projectPath) return all;
  return all.filter((s) => s.projectPath === projectPath);
}

export function resolveFeedback(
  id: string,
  status: "accepted" | "rejected",
): FeedbackSubmission | undefined {
  const submission = submissions.get(id);
  if (!submission) return undefined;
  submission.status = status;
  return submission;
}

export function resetFeedback(): void {
  submissions.clear();
}
