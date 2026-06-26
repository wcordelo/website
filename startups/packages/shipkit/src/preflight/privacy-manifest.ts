import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PrivacyManifestIssue, PrivacyManifestResult } from "../types.js";

const REQUIRED_REASONS = [
  "NSPrivacyAccessedAPICategoryUserDefaults",
  "NSPrivacyAccessedAPICategoryFileTimestamp",
  "NSPrivacyAccessedAPICategorySystemBootTime",
  "NSPrivacyAccessedAPICategoryDiskSpace",
  "NSPrivacyAccessedAPICategoryActiveKeyboards",
];

/**
 * Privacy manifest validator (MOB-023).
 * Validates PrivacyInfo.xcprivacy for Apple store requirements.
 */
export function findPrivacyManifest(projectPath: string): string | null {
  const candidates = [
    join(projectPath, "ios", "PrivacyInfo.xcprivacy"),
    join(projectPath, "PrivacyInfo.xcprivacy"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export function validatePrivacyManifest(projectPath: string): PrivacyManifestResult {
  const manifestPath = findPrivacyManifest(projectPath);

  if (!manifestPath) {
    return {
      path: join(projectPath, "ios", "PrivacyInfo.xcprivacy"),
      exists: false,
      issues: [
        {
          path: join(projectPath, "ios", "PrivacyInfo.xcprivacy"),
          rule: "privacy-manifest-required",
          severity: "error",
          message: "PrivacyInfo.xcprivacy is missing (required for App Store since Spring 2024)",
          passed: false,
        },
      ],
      valid: false,
    };
  }

  const content = readFileSync(manifestPath, "utf-8");
  const issues = runPrivacyChecks(manifestPath, content);
  const valid = issues.every((i) => i.passed);

  return {
    path: manifestPath,
    exists: true,
    issues,
    valid,
  };
}

function runPrivacyChecks(path: string, content: string): PrivacyManifestIssue[] {
  const issues: PrivacyManifestIssue[] = [];

  issues.push({
    path,
    rule: "has-privacy-manifest-file",
    severity: "info",
    message: "PrivacyInfo.xcprivacy found",
    passed: true,
  });

  const hasAccessedApiTypes = content.includes("NSPrivacyAccessedAPITypes");
  issues.push({
    path,
    rule: "has-accessed-api-types",
    severity: "warning",
    message: hasAccessedApiTypes
      ? "NSPrivacyAccessedAPITypes declared"
      : "NSPrivacyAccessedAPITypes section missing — declare required reason APIs",
    passed: hasAccessedApiTypes,
  });

  for (const reason of REQUIRED_REASONS) {
    const declared = content.includes(reason);
    if (!declared && content.includes("NSPrivacyAccessedAPITypes")) {
      issues.push({
        path,
        rule: `reason-${reason}`,
        severity: "info",
        message: `${reason} not declared (may be OK if API not used)`,
        passed: true,
      });
    }
  }

  const hasTracking = content.includes("NSPrivacyTracking");
  issues.push({
    path,
    rule: "tracking-declaration",
    severity: "warning",
    message: hasTracking
      ? "NSPrivacyTracking key present"
      : "NSPrivacyTracking key missing — add if app tracks users",
    passed: hasTracking || !content.includes("NSPrivacyCollectedDataTypes"),
  });

  const hasCollectedData = content.includes("NSPrivacyCollectedDataTypes");
  issues.push({
    path,
    rule: "collected-data-types",
    severity: "info",
    message: hasCollectedData
      ? "NSPrivacyCollectedDataTypes declared"
      : "No collected data types declared",
    passed: true,
  });

  return issues;
}

export function parsePrivacyManifestContent(content: string): Record<string, unknown> {
  // Minimal plist-ish parser for test fixtures
  const keys: Record<string, unknown> = {};
  const keyMatches = content.matchAll(/<key>([^<]+)<\/key>/g);
  for (const match of keyMatches) {
    keys[match[1]!] = true;
  }
  return keys;
}
