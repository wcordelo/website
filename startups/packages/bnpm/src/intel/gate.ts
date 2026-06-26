import semver from "semver";
import { loadBlocklist } from "./loader.js";
import type { BlocklistEntry } from "./schema.js";
import type { BlockMatch } from "../types.js";
import type { BetterNpmrc } from "../types.js";

export interface DependencyRef {
  name: string;
  version: string;
}

export function versionMatches(entry: BlocklistEntry, version: string): boolean {
  const clean = version.replace(/^[\^~>=<]*/, "").split(" ")[0] ?? version;

  if (entry.version) {
    return semver.eq(clean, entry.version);
  }
  if (entry.version_range) {
    if (entry.version_range === "*") return true;
    return semver.satisfies(clean, entry.version_range, { includePrerelease: true });
  }
  return false;
}

export function checkPackage(
  name: string,
  version: string,
  cwd?: string,
): BlockMatch | null {
  const bundle = loadBlocklist(cwd);
  const now = Date.now();

  for (const entry of bundle.entries) {
    if (entry.expires_at && new Date(entry.expires_at).getTime() < now) {
      continue;
    }
    if (entry.package !== name && !name.startsWith(`${entry.package}/`)) {
      continue;
    }
    if (!versionMatches(entry, version)) {
      continue;
    }
    return {
      package: name,
      version,
      reason: entry.reason,
      severity: entry.severity,
      action: entry.action,
      source: entry.source,
      remediation: entry.remediation,
    };
  }

  return null;
}

export function checkDependencies(
  deps: DependencyRef[],
  policy: BetterNpmrc,
  cwd?: string,
): BlockMatch[] {
  if (policy.blocklist === "off") return [];

  const matches: BlockMatch[] = [];
  for (const dep of deps) {
    const match = checkPackage(dep.name, dep.version, cwd);
    if (!match) continue;
    if (policy.blocklist === "warn" && match.action === "block") {
      matches.push({ ...match, action: "warn" });
    } else {
      matches.push(match);
    }
  }
  return matches;
}

export function hasBlockingMatch(matches: BlockMatch[]): boolean {
  return matches.some((m) => m.action === "block");
}

export function formatBlockError(matches: BlockMatch[]): string {
  const lines = ["Install blocked by Better npm threat intelligence:", ""];
  for (const m of matches.filter((x) => x.action === "block")) {
    lines.push(`  ✗ ${m.package}@${m.version}`);
    lines.push(`    ${m.reason}`);
    if (m.remediation) lines.push(`    → ${m.remediation}`);
    lines.push("");
  }
  lines.push("See https://betternpm.dev/blocks for details.");
  return lines.join("\n");
}
