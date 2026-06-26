/** Task extraction pipeline stub (BENCH-003). */

import type { BenchTask } from "../types.ts";

export interface ExtractionSource {
  repoUrl: string;
  licenseId: string;
  since?: string;
}

export interface ExtractedCandidate {
  issueId: string;
  title: string;
  description: string;
  hasTests: boolean;
  fileCount: number;
  language: string;
}

/**
 * Stub extractor — scans licensed partner repos for closed issues with tests.
 * Production: clone repo, parse issues/PRs, extract patches.
 */
export async function extractTasksFromRepo(
  source: ExtractionSource
): Promise<ExtractedCandidate[]> {
  // Stub: return synthetic candidates for pipeline integration tests
  return [
    {
      issueId: `${source.repoUrl}#42`,
      title: "Fix pagination offset in user service",
      description: "Users report duplicate pages when offset > limit.",
      hasTests: true,
      fileCount: 2,
      language: "python",
    },
    {
      issueId: `${source.repoUrl}#87`,
      title: "Refactor auth middleware across API surface",
      description: "Unify JWT validation; update 12 route handlers.",
      hasTests: true,
      fileCount: 14,
      language: "typescript",
    },
  ];
}

export function candidateToTask(
  candidate: ExtractedCandidate,
  temporal: { createdAt: string; licenseId: string }
): Partial<BenchTask> {
  return {
    title: candidate.title,
    description: candidate.description,
    language: candidate.language,
    files: Array.from({ length: candidate.fileCount }, (_, i) => `src/file${i}.py`),
    testCommand: "pytest -q",
    temporal: {
      createdAt: temporal.createdAt,
      licenseId: temporal.licenseId,
      sourceRepo: candidate.issueId.split("#")[0],
    },
  };
}
