import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getSecret, listSecrets } from "../crypto/secrets.js";

export const SECRET_PLACEHOLDER_RE = /bgit-secret:([A-Z0-9_]+)/g;

export interface FilterContext {
  resolveSecret: (name: string) => string;
  listSecrets?: () => string[];
}

/** Clean filter: working tree → git index (replace secrets with placeholders). */
export function cleanFilter(content: string, ctx: FilterContext): string {
  const secrets = buildSecretReverseMap(content, ctx);
  let out = content;
  for (const [value, name] of secrets) {
    out = out.split(value).join(`bgit-secret:${name}`);
  }
  return out;
}

/** Smudge filter: git index → working tree (replace placeholders with secrets). */
export function smudgeFilter(content: string, ctx: FilterContext): string {
  return content.replace(SECRET_PLACEHOLDER_RE, (_match, name: string) => {
    try {
      return ctx.resolveSecret(name);
    } catch {
      return `bgit-secret:${name}`;
    }
  });
}

function buildSecretReverseMap(content: string, ctx: FilterContext): Map<string, string> {
  const map = new Map<string, string>();
  const names = new Set<string>();

  for (const m of content.matchAll(SECRET_PLACEHOLDER_RE)) {
    names.add(m[1]!);
  }
  if (ctx.listSecrets) {
    for (const n of ctx.listSecrets()) names.add(n);
  }

  for (const name of names) {
    try {
      const value = ctx.resolveSecret(name);
      if (value && content.includes(value)) map.set(value, name);
    } catch {
      // secret not available — skip
    }
  }
  return map;
}

export function createBgitFilterContext(bgitRoot: string): FilterContext {
  return {
    resolveSecret: (name: string) => getSecret(bgitRoot, name),
    listSecrets: () => listSecrets(bgitRoot),
  };
}

const FILTER_DRIVER = `#!/bin/sh
# bgit smudge/clean filter driver
mode="$1"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if command -v bgit >/dev/null 2>&1; then
  bgit filter "$mode" --repo "$repo_root"
else
  bun run "$(dirname "$0")/../src/cli.ts" filter "$mode" --repo "$repo_root" 2>/dev/null || cat
fi
`;

export function installGitFilter(repoRoot: string, bgitRoot: string): { installed: boolean; instructions: string[] } {
  const hooksDir = join(bgitRoot, "hooks");
  mkdirSync(hooksDir, { recursive: true });
  const driverPath = join(hooksDir, "bgit-filter");
  writeFileSync(driverPath, FILTER_DRIVER, "utf8");
  chmodSync(driverPath, 0o755);

  const attrsPath = join(repoRoot, ".gitattributes");
  const attrLine = "*.env filter=bgit-secret\n*.env.* filter=bgit-secret\n";
  if (!existsSync(attrsPath) || !readFileSync(attrsPath, "utf8").includes("filter=bgit-secret")) {
    writeFileSync(attrsPath, (existsSync(attrsPath) ? readFileSync(attrsPath, "utf8") : "") + attrLine, "utf8");
  }

  const filterCmd = driverPath;
  spawnSync("git", ["config", "filter.bgit-secret.clean", filterCmd + " clean"], { cwd: repoRoot });
  spawnSync("git", ["config", "filter.bgit-secret.smudge", filterCmd + " smudge"], { cwd: repoRoot });
  spawnSync("git", ["config", "filter.bgit-secret.required", "true"], { cwd: repoRoot });

  const instructions = [
    "Git smudge/clean filter installed for *.env files.",
    "Use bgit-secret:NAME placeholders in committed files; secrets resolve in working tree only.",
    "Manual setup: git config filter.bgit-secret.clean '" + filterCmd + " clean'",
    "            git config filter.bgit-secret.smudge '" + filterCmd + " smudge'",
  ];

  return { installed: true, instructions };
}

export function listResolvableSecrets(bgitRoot: string): string[] {
  return listSecrets(bgitRoot);
}
