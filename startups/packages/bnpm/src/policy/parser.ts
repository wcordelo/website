import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BetterNpmrc } from "../types.js";

const DEFAULT_POLICY: BetterNpmrc = {
  blocklist: "strict",
  lifecycle_scripts: "allowlist",
  allowed_registries: ["https://registry.npmjs.org"],
  telemetry: "off",
};

export function parseBetterNpmrc(content: string): BetterNpmrc {
  const policy: BetterNpmrc = { ...DEFAULT_POLICY };
  const lines = content.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();

    switch (key) {
      case "blocklist":
        if (value === "strict" || value === "warn" || value === "off") {
          policy.blocklist = value;
        }
        break;
      case "lifecycle_scripts":
        if (["allow", "allowlist", "block", "warn"].includes(value)) {
          policy.lifecycle_scripts = value as BetterNpmrc["lifecycle_scripts"];
        }
        break;
      case "allowed_registries":
        policy.allowed_registries = value.split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "require_provenance":
        policy.require_provenance = value.split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "telemetry":
        if (value === "opt-in" || value === "off") {
          policy.telemetry = value;
        }
        break;
      case "script_allowlist":
        policy.script_allowlist = value.split(",").map((s) => s.trim()).filter(Boolean);
        break;
    }
  }

  return policy;
}

export function loadBetterNpmrc(cwd: string = process.cwd()): BetterNpmrc {
  const path = join(cwd, ".better-npmrc");
  if (!existsSync(path)) {
    return { ...DEFAULT_POLICY };
  }
  return parseBetterNpmrc(readFileSync(path, "utf-8"));
}

export function mergePolicy(base: BetterNpmrc, override: BetterNpmrc): BetterNpmrc {
  return {
    ...base,
    ...override,
    allowed_registries: override.allowed_registries ?? base.allowed_registries,
    require_provenance: override.require_provenance ?? base.require_provenance,
    script_allowlist: override.script_allowlist ?? base.script_allowlist,
  };
}

export function formatBetterNpmrc(policy: BetterNpmrc): string {
  const lines = [
    "# Better npm policy — https://betternpm.dev/docs/policy",
    `blocklist = ${policy.blocklist ?? "strict"}`,
    `lifecycle_scripts = ${policy.lifecycle_scripts ?? "allowlist"}`,
    `allowed_registries = ${(policy.allowed_registries ?? ["https://registry.npmjs.org"]).join(", ")}`,
    `telemetry = ${policy.telemetry ?? "off"}`,
  ];

  if (policy.script_allowlist?.length) {
    lines.push(`script_allowlist = ${policy.script_allowlist.join(", ")}`);
  }
  if (policy.require_provenance?.length) {
    lines.push(`require_provenance = ${policy.require_provenance.join(", ")}`);
  }

  return lines.join("\n") + "\n";
}

export const STRICT_PRESET: BetterNpmrc = {
  blocklist: "strict",
  lifecycle_scripts: "block",
  allowed_registries: ["https://registry.npmjs.org"],
  telemetry: "off",
  script_allowlist: ["esbuild", "prisma", "@prisma/client"],
};

export const NPMRC_STRICT_PRESET = [
  "ignore-scripts=true",
  "audit=true",
  "fund=false",
  "engine-strict=true",
].join("\n") + "\n";
