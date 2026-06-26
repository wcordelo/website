import type { BreakingChange, ComplianceIssue, DependencyGraph, ExpoSdkInfo, UpgradePlan, UpgradeStep } from "../types.js";
import { getLatestSdkVersion } from "../scanner/expo-sdk-detector.js";
import { loadComplianceRegistry } from "../compliance/registry.js";
import { getBreakingChangesForUpgrade } from "./breaking-changes.js";

const SDK_PACKAGE_BUMPS: Record<number, { expo: string; reactNative: string }> = {
  50: { expo: "~50.0.0", reactNative: "0.73.6" },
  51: { expo: "~51.0.0", reactNative: "0.74.5" },
  52: { expo: "~52.0.0", reactNative: "0.76.3" },
  53: { expo: "~53.0.0", reactNative: "0.77.0" },
};

function estimateEffort(
  steps: UpgradeStep[],
  breakingChanges: BreakingChange[],
): UpgradePlan["estimatedEffort"] {
  const critical = breakingChanges.filter((c) => c.severity === "critical").length;
  const manual = steps.filter((s) => s.action === "manual").length;
  if (critical > 2 || manual > 5) return "high";
  if (critical > 0 || manual > 2 || steps.length > 8) return "medium";
  return "low";
}

export function resolveUpgradePlan(
  expo: ExpoSdkInfo,
  _graph: DependencyGraph,
  complianceIssues: ComplianceIssue[],
): UpgradePlan {
  const currentSdk = expo.sdkVersion ?? 49;
  const targetSdk = getLatestSdkVersion();
  const steps: UpgradeStep[] = [];

  if (currentSdk < targetSdk) {
    for (let sdk = currentSdk + 1; sdk <= targetSdk; sdk++) {
      const bump = SDK_PACKAGE_BUMPS[sdk];
      if (bump) {
        steps.push({
          action: "bump",
          target: "expo",
          to: bump.expo,
          reason: `Upgrade to Expo SDK ${sdk}`,
        });
        steps.push({
          action: "bump",
          target: "react-native",
          to: bump.reactNative,
          reason: `React Native version required for SDK ${sdk}`,
        });
        steps.push({
          action: "config",
          target: "app.config",
          reason: `Review app.config migrations for SDK ${sdk}`,
        });
      }
    }
  }

  const registry = loadComplianceRegistry();
  for (const issue of complianceIssues) {
    const fix = registry.entries.find(
      (e) => e.package === issue.package && e.status === "compatible",
    );
    if (fix) {
      steps.push({
        action: "bump",
        target: issue.package,
        from: issue.version,
        to: fix.version,
        reason: `Fix 16KB compatibility for ${issue.package}`,
      });
    } else {
      steps.push({
        action: "manual",
        target: issue.package,
        reason: `No known 16KB-compatible version for ${issue.package} — investigate alternatives`,
      });
    }
  }

  const breakingChanges = getBreakingChangesForUpgrade(currentSdk, targetSdk);

  for (const bc of breakingChanges.filter((c) => c.severity === "critical")) {
    steps.push({
      action: "manual",
      target: bc.affectedPackages.join(", "),
      reason: bc.title,
    });
  }

  return {
    currentSdk: expo.sdkVersion,
    targetSdk,
    steps,
    breakingChanges,
    estimatedEffort: estimateEffort(steps, breakingChanges),
  };
}
