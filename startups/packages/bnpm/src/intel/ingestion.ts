import type { BlocklistBundle, BlocklistEntry } from "./schema.js";
import { validateBlocklistBundle } from "./schema.js";

/** Raw feed row before normalization (NPM-007 ingestion worker input). */
export interface RawFeedEntry {
  ecosystem?: string;
  package: string;
  version?: string;
  version_range?: string;
  summary: string;
  severity?: string;
  source: string;
  url?: string;
}

export function normalizeFeedEntry(raw: RawFeedEntry): BlocklistEntry | null {
  if (raw.ecosystem && raw.ecosystem !== "npm") return null;
  if (!raw.package || !raw.summary) return null;

  const severity = (raw.severity ?? "high") as BlocklistEntry["severity"];
  if (!["critical", "high", "medium", "low"].includes(severity)) return null;

  return {
    package: raw.package,
    version: raw.version,
    version_range: raw.version_range ?? (raw.version ? undefined : "*"),
    reason: raw.summary,
    severity,
    action: severity === "critical" ? "block" : "warn",
    source: raw.source,
    remediation: raw.url,
  };
}

export function buildBundle(
  entries: RawFeedEntry[],
  version = "1.0.0",
): BlocklistBundle {
  const normalized = entries
    .map(normalizeFeedEntry)
    .filter((e): e is BlocklistEntry => e !== null);

  const bundle: BlocklistBundle = {
    version,
    updated_at: new Date().toISOString(),
    entries: normalized,
  };

  if (!validateBlocklistBundle(bundle)) {
    throw new Error("Failed to build valid blocklist bundle");
  }

  return bundle;
}
