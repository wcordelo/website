import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ComplianceEntry, ComplianceIssue, ComplianceStatus, DependencyGraph } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ComplianceRegistry {
  version: string;
  updatedAt: string;
  entries: ComplianceEntry[];
}

let cachedRegistry: ComplianceRegistry | null = null;

export function getDataDir(): string {
  return join(__dirname, "..", "..", "data");
}

export function loadComplianceRegistry(): ComplianceRegistry {
  if (cachedRegistry) return cachedRegistry;
  const path = join(getDataDir(), "compliance-registry.json");
  cachedRegistry = JSON.parse(readFileSync(path, "utf-8")) as ComplianceRegistry;
  return cachedRegistry;
}

function lookupStatus(
  registry: ComplianceRegistry,
  pkgName: string,
  version: string,
): ComplianceEntry | null {
  const exact = registry.entries.find(
    (e) => e.package === pkgName && e.version === version,
  );
  if (exact) return exact;

  const major = version.split(".")[0];
  const majorMatch = registry.entries.find(
    (e) => e.package === pkgName && e.version.startsWith(`${major}.`),
  );
  if (majorMatch) return majorMatch;

  const pkgMatch = registry.entries.find((e) => e.package === pkgName && e.version === "*");
  return pkgMatch ?? null;
}

export function checkCompliance(graph: DependencyGraph): {
  issues: ComplianceIssue[];
  summary: { compatible: number; incompatible: number; unknown: number };
} {
  const registry = loadComplianceRegistry();
  const issues: ComplianceIssue[] = [];
  const summary = { compatible: 0, incompatible: 0, unknown: 0 };

  for (const nativeName of graph.nativeModules) {
    const node = graph.nodes[nativeName];
    if (!node) continue;

    const entry = lookupStatus(registry, nativeName, node.version);
    const status: ComplianceStatus = entry?.status ?? "unknown";
    summary[status]++;

    if (status !== "compatible") {
      issues.push({
        package: nativeName,
        version: node.version,
        status,
        message:
          status === "incompatible"
            ? `${nativeName}@${node.version} is not 16KB page-size compatible`
            : `${nativeName}@${node.version} has unknown 16KB compatibility — verify before release`,
      });
    }
  }

  return { issues, summary };
}
