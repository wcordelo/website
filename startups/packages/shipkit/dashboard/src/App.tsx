import { useEffect, useState } from "react";
import { HealthScore } from "./components/HealthScore";
import { UpgradeWizard } from "./components/UpgradeWizard";

interface ScanData {
  healthScore: number;
  expo: { sdkVersion: number | null };
  compliance: { summary: { incompatible: number } };
  preflight: Array<{ passed: boolean; severity: string }>;
  graph: { nativeModules: string[] };
}

interface UpgradePlan {
  currentSdk: number | null;
  targetSdk: number;
  steps: Array<{ action: string; target: string; to?: string; reason: string }>;
  estimatedEffort: string;
}

const DEMO_SCAN: ScanData = {
  healthScore: 72,
  expo: { sdkVersion: 51 },
  compliance: { summary: { incompatible: 2 } },
  preflight: [
    { passed: false, severity: "error" },
    { passed: false, severity: "warning" },
    { passed: true, severity: "info" },
  ],
  graph: { nativeModules: ["expo", "react-native", "react-native-reanimated"] },
};

const DEMO_PLAN: UpgradePlan = {
  currentSdk: 51,
  targetSdk: 52,
  estimatedEffort: "medium",
  steps: [
    { action: "bump", target: "expo", to: "~52.0.0", reason: "Target SDK 52" },
    { action: "bump", target: "react-native", to: "0.76.x", reason: "RN version for SDK 52" },
    { action: "codemod", target: "app.config.js", reason: "Migrate newArchEnabled default" },
    { action: "manual", target: "react-native-reanimated", reason: "Verify 16KB alignment" },
  ],
};

/**
 * Dashboard MVP (MOB-024) with upgrade wizard (MOB-025).
 */
export function App() {
  const [scan] = useState<ScanData>(DEMO_SCAN);
  const [plan] = useState<UpgradePlan>(DEMO_PLAN);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((health) => {
        if (health?.status === "ok") {
          // API available — in production, fetch latest scan from /api/scans
        }
      })
      .catch(() => {
        // Demo mode when API is offline
      });
  }, []);

  const preflightErrors = scan.preflight.filter((v) => !v.passed && v.severity === "error").length;

  return (
    <div className="app">
      <header>
        <h1>ShipKit Dashboard</h1>
        <p>Release intelligence for Expo / React Native teams</p>
      </header>

      <HealthScore
        score={scan.healthScore}
        incompatible={scan.compliance.summary.incompatible}
        preflightErrors={preflightErrors}
        nativeModules={scan.graph.nativeModules.length}
      />

      <UpgradeWizard
        currentSdk={plan.currentSdk}
        targetSdk={plan.targetSdk}
        steps={plan.steps}
        effort={plan.estimatedEffort}
      />
    </div>
  );
}
