import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BreakingChange } from "../types.js";
import { getDataDir } from "../compliance/registry.js";

let cached: BreakingChange[] | null = null;

export function loadBreakingChanges(): BreakingChange[] {
  if (cached) return cached;
  const path = join(getDataDir(), "breaking-changes.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as { changes: BreakingChange[] };
  cached = data.changes;
  return cached;
}

export function getBreakingChangesForUpgrade(
  fromSdk: number,
  toSdk: number,
): BreakingChange[] {
  return loadBreakingChanges().filter(
    (c) => c.fromSdk >= fromSdk && c.toSdk <= toSdk,
  );
}
