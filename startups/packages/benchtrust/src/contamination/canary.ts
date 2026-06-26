/** Canary string system (BENCH-008). */

import { createHash, randomBytes } from "node:crypto";

export interface CanaryRecord {
  canaryId: string;
  watermark: string;
  partnerId: string;
  taskId: string;
  createdAt: string;
}

export function generateCanary(partnerId: string, taskId: string): CanaryRecord {
  const nonce = randomBytes(8).toString("hex");
  const watermark = `BT-CANARY-${createHash("sha256")
    .update(`${partnerId}:${taskId}:${nonce}`)
    .digest("hex")
    .slice(0, 24)}`;
  return {
    canaryId: `canary-${nonce}`,
    watermark,
    partnerId,
    taskId,
    createdAt: new Date().toISOString(),
  };
}

export function embedCanaryInTask(
  description: string,
  canary: CanaryRecord
): string {
  return `${description}\n\n<!-- ${canary.watermark} -->`;
}

export function detectCanaryLeak(
  corpusText: string,
  canaries: CanaryRecord[]
): CanaryRecord[] {
  return canaries.filter((c) => corpusText.includes(c.watermark));
}
