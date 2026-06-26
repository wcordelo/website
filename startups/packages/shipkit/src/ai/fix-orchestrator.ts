import type { FixSuggestion, ScanResult } from "../types.js";
import { getBreakingChangesForUpgrade } from "../upgrade/breaking-changes.js";

/**
 * AI fix orchestrator stub (MOB-014).
 * Returns ranked fix suggestions with confidence scores.
 */
export function orchestrateFixes(result: ScanResult): FixSuggestion[] {
  const suggestions: FixSuggestion[] = [];

  for (const issue of result.compliance.issues) {
    suggestions.push({
      issueId: `16kb-${issue.package}`,
      description: `Upgrade ${issue.package} to a 16KB-compatible version`,
      confidence: issue.status === "incompatible" ? 0.85 : 0.45,
      strategy: issue.status === "incompatible" ? "codemod" : "manual",
      automated: issue.status === "incompatible",
    });
  }

  for (const violation of result.preflight.filter((v) => !v.passed)) {
    suggestions.push({
      issueId: `preflight-${violation.ruleId}`,
      description: violation.message,
      confidence: violation.severity === "error" ? 0.7 : 0.5,
      strategy: violation.ruleId.includes("privacy") ? "manual" : "codemod",
      automated: false,
    });
  }

  if (result.expo.sdkVersion) {
    const breaking = getBreakingChangesForUpgrade(
      result.expo.sdkVersion,
      result.expo.sdkVersion + 1,
    );
    for (const bc of breaking) {
      suggestions.push({
        issueId: bc.id,
        description: bc.title,
        confidence: bc.severity === "critical" ? 0.9 : 0.6,
        strategy: bc.fixHint ? "codemod" : "ai",
        automated: Boolean(bc.fixHint),
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
