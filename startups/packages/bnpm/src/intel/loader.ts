import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EMBEDDED_BLOCKLIST } from "./known-iocs.js";
import { validateBlocklistBundle, type BlocklistBundle } from "./schema.js";

let cached: BlocklistBundle | null = null;

export function loadBlocklist(cwd: string = process.cwd()): BlocklistBundle {
  if (cached) return cached;

  const localPath = join(cwd, ".bnpm-blocklist.json");
  if (existsSync(localPath)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(localPath, "utf-8"));
      if (validateBlocklistBundle(parsed)) {
        cached = parsed;
        return parsed;
      }
    } catch {
      // fall through to embedded
    }
  }

  cached = EMBEDDED_BLOCKLIST;
  return EMBEDDED_BLOCKLIST;
}

export function resetBlocklistCache(): void {
  cached = null;
}

export function getBlocklistEntryCount(cwd?: string): number {
  return loadBlocklist(cwd).entries.length;
}
