import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ScanResult } from "../types.js";
import { buildDependencyGraph } from "./dep-graph.js";
import { detectExpoSdk } from "./expo-sdk-detector.js";
import { checkCompliance } from "../compliance/registry.js";
import { scanNativeLibs } from "../compliance/elf-alignment.js";
import { evaluatePreflight } from "../preflight/rules-engine.js";

function computeHealthScore(
  complianceSummary: ScanResult["compliance"]["summary"],
  preflight: ScanResult["preflight"],
): number {
  let score = 100;
  score -= complianceSummary.incompatible * 10;
  score -= complianceSummary.unknown * 3;
  const errors = preflight.filter((v) => !v.passed && v.severity === "error").length;
  const warnings = preflight.filter((v) => !v.passed && v.severity === "warning").length;
  score -= errors * 8;
  score -= warnings * 3;
  return Math.max(0, Math.min(100, score));
}

export function runScan(projectPath: string): ScanResult {
  const graph = buildDependencyGraph(projectPath);
  const expo = detectExpoSdk(projectPath);
  const compliance = checkCompliance(graph);
  const elfChecks = scanNativeLibs(projectPath);
  const preflight = evaluatePreflight(projectPath);

  return {
    path: projectPath,
    scannedAt: new Date().toISOString(),
    graph,
    expo,
    compliance,
    elfChecks,
    preflight,
    healthScore: computeHealthScore(compliance.summary, preflight),
  };
}

export function findSoFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        if (entry === "node_modules" || entry === ".git") continue;
        results.push(...findSoFiles(full));
      } else if (entry.endsWith(".so")) {
        results.push(full);
      }
    } catch {
      // skip inaccessible paths
    }
  }
  return results;
}
