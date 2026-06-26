/** Auto task validator (BENCH-004). */

import type { BenchTask } from "../types.ts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  /sk-[a-zA-Z0-9]{20,}/,
  /password\s*=\s*['"][^'"]+['"]/i,
];

export function validateTask(task: Partial<BenchTask>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!task.title?.trim()) errors.push("missing title");
  if (!task.description?.trim()) errors.push("missing description");
  if (!task.testCommand?.trim()) errors.push("missing testCommand");
  if (!task.files?.length) errors.push("no files specified");
  if (!task.temporal?.createdAt) errors.push("missing temporal.createdAt (BENCH-014)");

  const text = `${task.title ?? ""} ${task.description ?? ""}`;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      errors.push("potential secret in task text");
      break;
    }
  }

  if (task.files && task.files.length > 20) {
    warnings.push("wide scope: >20 files");
  }
  if (!task.language) warnings.push("language not specified");

  const score =
    errors.length === 0
      ? 1 - warnings.length * 0.05
      : Math.max(0, 0.5 - errors.length * 0.15);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

export function validateTasks(tasks: Partial<BenchTask>[]): ValidationResult[] {
  return tasks.map(validateTask);
}
