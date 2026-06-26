import type { AgencyApp, AgencyPortfolio } from "../types.js";
import { runScan } from "../scanner/index.js";
import { randomUUID } from "node:crypto";

/**
 * Agency multi-app portfolio view (MOB-033).
 */
export function buildAgencyPortfolio(projectPaths: string[]): AgencyPortfolio {
  const apps: AgencyApp[] = projectPaths.map((path) => {
    const result = runScan(path);
    return {
      id: randomUUID(),
      name: result.graph.root,
      path,
      healthScore: result.healthScore,
      lastScannedAt: result.scannedAt,
      sdkVersion: result.expo.sdkVersion,
    };
  });

  const aggregateHealthScore =
    apps.length > 0
      ? Math.round(apps.reduce((sum, a) => sum + a.healthScore, 0) / apps.length)
      : 0;

  return {
    apps,
    aggregateHealthScore,
    scannedAt: new Date().toISOString(),
  };
}

export function sortAppsByHealth(apps: AgencyApp[]): AgencyApp[] {
  return [...apps].sort((a, b) => a.healthScore - b.healthScore);
}

export function filterAppsBelowThreshold(apps: AgencyApp[], threshold: number): AgencyApp[] {
  return apps.filter((a) => a.healthScore < threshold);
}
