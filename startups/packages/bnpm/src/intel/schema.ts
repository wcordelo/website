import type { BlockAction, BlockSeverity } from "../types.js";

export interface BlocklistEntry {
  package: string;
  version_range?: string;
  version?: string;
  reason: string;
  severity: BlockSeverity;
  action: BlockAction;
  source: string;
  expires_at?: string | null;
  iocs?: string[];
  remediation?: string;
}

export interface BlocklistBundle {
  version: string;
  updated_at: string;
  entries: BlocklistEntry[];
}

export const BLOCKLIST_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://betternpm.dev/schemas/blocklist-v1.json",
  title: "BetterNpmBlocklist",
  type: "object",
  required: ["version", "updated_at", "entries"],
  properties: {
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    updated_at: { type: "string", format: "date-time" },
    entries: {
      type: "array",
      items: {
        type: "object",
        required: ["package", "reason", "severity", "action", "source"],
        properties: {
          package: { type: "string", minLength: 1 },
          version_range: { type: "string" },
          version: { type: "string" },
          reason: { type: "string" },
          severity: { enum: ["critical", "high", "medium", "low"] },
          action: { enum: ["block", "warn"] },
          source: { type: "string" },
          expires_at: { type: ["string", "null"], format: "date-time" },
          iocs: { type: "array", items: { type: "string" } },
          remediation: { type: "string" },
        },
        anyOf: [{ required: ["version_range"] }, { required: ["version"] }],
      },
    },
  },
} as const;

export function validateBlocklistBundle(data: unknown): data is BlocklistBundle {
  if (!data || typeof data !== "object") return false;
  const bundle = data as Record<string, unknown>;
  if (typeof bundle.version !== "string") return false;
  if (typeof bundle.updated_at !== "string") return false;
  if (!Array.isArray(bundle.entries)) return false;

  return bundle.entries.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const e = entry as Record<string, unknown>;
    return (
      typeof e.package === "string" &&
      typeof e.reason === "string" &&
      typeof e.severity === "string" &&
      typeof e.action === "string" &&
      typeof e.source === "string" &&
      (typeof e.version_range === "string" || typeof e.version === "string")
    );
  });
}
