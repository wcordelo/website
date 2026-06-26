import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { PreflightRule, PreflightViolation } from "../types.js";
import { getDataDir } from "../compliance/registry.js";
import { parsePackageJson } from "../scanner/package-json-parser.js";

interface PreflightRulesFile {
  version: string;
  rules: PreflightRule[];
}

let cachedRules: PreflightRule[] | null = null;

export function loadPreflightRules(): PreflightRule[] {
  if (cachedRules) return cachedRules;
  const path = join(getDataDir(), "preflight-rules.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as PreflightRulesFile;
  cachedRules = data.rules;
  return cachedRules;
}

type CheckContext = {
  projectPath: string;
  hasAppJson: boolean;
  hasPrivacyManifest: boolean;
  hasAndroidManifest: boolean;
  hasExpo: boolean;
  sdkVersion: number | null;
  appName: string;
};

function buildContext(projectPath: string): CheckContext {
  const pkg = parsePackageJson(projectPath);
  const hasAppJson = existsSync(join(projectPath, "app.json")) ||
    existsSync(join(projectPath, "app.config.js")) ||
    existsSync(join(projectPath, "app.config.json"));
  const hasPrivacyManifest = existsSync(
    join(projectPath, "ios", "PrivacyInfo.xcprivacy"),
  ) || existsSync(join(projectPath, "PrivacyInfo.xcprivacy"));
  const hasAndroidManifest = existsSync(
    join(projectPath, "android", "app", "src", "main", "AndroidManifest.xml"),
  );

  let sdkVersion: number | null = null;
  const appJsonPath = join(projectPath, "app.json");
  if (existsSync(appJsonPath)) {
    try {
      const app = JSON.parse(readFileSync(appJsonPath, "utf-8")) as {
        expo?: { sdkVersion?: number; name?: string };
      };
      sdkVersion = app.expo?.sdkVersion ?? null;
    } catch {
      // ignore
    }
  }

  return {
    projectPath,
    hasAppJson,
    hasPrivacyManifest,
    hasAndroidManifest,
    hasExpo: Boolean(pkg?.allDependencies.expo),
    sdkVersion,
    appName: pkg?.name ?? "unknown",
  };
}

const CHECK_HANDLERS: Record<string, (ctx: CheckContext) => boolean> = {
  "has-app-config": (ctx) => ctx.hasAppJson,
  "has-privacy-manifest": (ctx) => ctx.hasPrivacyManifest || !ctx.hasExpo,
  "has-android-manifest": (ctx) => ctx.hasAndroidManifest || !ctx.hasExpo,
  "has-expo-sdk": (ctx) => ctx.sdkVersion !== null || ctx.hasExpo,
  "sdk-min-49": (ctx) => (ctx.sdkVersion ?? 0) >= 49,
  "sdk-min-50": (ctx) => (ctx.sdkVersion ?? 0) >= 50,
  "has-app-name": (ctx) => ctx.appName !== "unknown",
  "ios-privacy-required": (ctx) => ctx.hasPrivacyManifest || !ctx.hasExpo,
  "android-target-sdk": (ctx) => ctx.hasAndroidManifest || !ctx.hasExpo,
  "expo-managed-workflow": (ctx) => ctx.hasExpo,
};

function evaluateCheck(check: string, ctx: CheckContext): boolean {
  if (CHECK_HANDLERS[check]) {
    return CHECK_HANDLERS[check](ctx);
  }
  // Default pass for informational rules without automated checks in v0.1
  return true;
}

export function evaluatePreflight(projectPath: string): PreflightViolation[] {
  const rules = loadPreflightRules();
  const ctx = buildContext(projectPath);

  return rules.map((rule) => {
    const passed = evaluateCheck(rule.check, ctx);
    return {
      ruleId: rule.id,
      store: rule.store,
      title: rule.title,
      severity: rule.severity,
      message: passed ? `Passed: ${rule.title}` : `Failed: ${rule.description}`,
      passed,
    };
  });
}

export function getPreflightSummary(violations: PreflightViolation[]): {
  passed: number;
  failed: number;
  errors: number;
  warnings: number;
} {
  const failed = violations.filter((v) => !v.passed);
  return {
    passed: violations.filter((v) => v.passed).length,
    failed: failed.length,
    errors: failed.filter((v) => v.severity === "error").length,
    warnings: failed.filter((v) => v.severity === "warning").length,
  };
}
