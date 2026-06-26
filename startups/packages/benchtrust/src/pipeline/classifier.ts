/** Narrow/wide test classifier (BENCH-005). */

import type { BenchTask, TaskScope } from "../types.ts";

export interface ClassifierFeatures {
  fileCount: number;
  descriptionLength: number;
  hasRefactorKeyword: boolean;
  hasMultiModuleKeyword: boolean;
  testFileCount: number;
}

export interface ClassificationResult {
  scope: TaskScope;
  confidence: number;
  features: ClassifierFeatures;
}

const REFACTOR_KEYWORDS = /\b(refactor|migrate|rename across|multi-?file|module-wide)\b/i;
const MULTI_KEYWORDS = /\b(across|throughout|all routes|entire|codebase)\b/i;

export function extractFeatures(task: Partial<BenchTask>): ClassifierFeatures {
  const desc = task.description ?? "";
  const files = task.files ?? [];
  const testFileCount = files.filter((f) =>
    /test|spec|_test\./i.test(f)
  ).length;

  return {
    fileCount: files.length,
    descriptionLength: desc.length,
    hasRefactorKeyword: REFACTOR_KEYWORDS.test(desc),
    hasMultiModuleKeyword: MULTI_KEYWORDS.test(desc),
    testFileCount,
  };
}

/**
 * Rule-based classifier v0 — production replaces with trained model.
 * narrow: single-file bugfix; wide: multi-file refactor.
 */
export function classifyTask(task: Partial<BenchTask>): ClassificationResult {
  const features = extractFeatures(task);
  let wideScore = 0;

  if (features.fileCount > 3) wideScore += 0.35;
  if (features.fileCount > 8) wideScore += 0.25;
  if (features.hasRefactorKeyword) wideScore += 0.3;
  if (features.hasMultiModuleKeyword) wideScore += 0.2;
  if (features.descriptionLength > 400) wideScore += 0.1;

  const scope: TaskScope = wideScore >= 0.45 ? "wide" : "narrow";
  const confidence =
    scope === "wide"
      ? Math.min(0.99, 0.5 + wideScore)
      : Math.min(0.99, 0.5 + (1 - wideScore));

  return { scope, confidence, features };
}

export function classifyAndTag(task: Partial<BenchTask>): Partial<BenchTask> {
  const { scope } = classifyTask(task);
  return { ...task, scope };
}
