import { describe, expect, test } from "bun:test";
import {
  parseBetterNpmrc,
  formatBetterNpmrc,
  mergePolicy,
  STRICT_PRESET,
} from "../src/policy/parser.js";

describe("policy parser", () => {
  test("parses blocklist and lifecycle settings", () => {
    const policy = parseBetterNpmrc(`
# comment
blocklist = warn
lifecycle_scripts = block
allowed_registries = https://registry.npmjs.org, https://npm.pkg.github.com
telemetry = opt-in
script_allowlist = esbuild, prisma
`);
    expect(policy.blocklist).toBe("warn");
    expect(policy.lifecycle_scripts).toBe("block");
    expect(policy.allowed_registries).toEqual([
      "https://registry.npmjs.org",
      "https://npm.pkg.github.com",
    ]);
    expect(policy.telemetry).toBe("opt-in");
    expect(policy.script_allowlist).toEqual(["esbuild", "prisma"]);
  });

  test("round-trips through formatBetterNpmrc", () => {
    const formatted = formatBetterNpmrc(STRICT_PRESET);
    const parsed = parseBetterNpmrc(formatted);
    expect(parsed.blocklist).toBe("strict");
    expect(parsed.lifecycle_scripts).toBe("block");
  });

  test("mergePolicy preserves arrays from override", () => {
    const merged = mergePolicy(STRICT_PRESET, { blocklist: "warn" });
    expect(merged.blocklist).toBe("warn");
    expect(merged.lifecycle_scripts).toBe("block");
  });
});
