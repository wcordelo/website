import { describe, expect, test, beforeEach } from "bun:test";
import { validateBlocklistBundle } from "../src/intel/schema.js";
import { EMBEDDED_BLOCKLIST } from "../src/intel/known-iocs.js";
import { loadBlocklist, resetBlocklistCache } from "../src/intel/loader.js";
import {
  checkPackage,
  checkDependencies,
  hasBlockingMatch,
  versionMatches,
} from "../src/intel/gate.js";
import type { BlocklistEntry } from "../src/intel/schema.js";

describe("blocklist", () => {
  beforeEach(() => {
    resetBlocklistCache();
  });

  test("embedded bundle validates against schema rules", () => {
    expect(validateBlocklistBundle(EMBEDDED_BLOCKLIST)).toBe(true);
  });

  test("loader returns embedded blocklist by default", () => {
    const bundle = loadBlocklist();
    expect(bundle.entries.length).toBeGreaterThanOrEqual(8);
    expect(bundle.entries.some((e) => e.package === "axios")).toBe(true);
  });

  test("blocks axios 1.14.1", () => {
    const match = checkPackage("axios", "1.14.1");
    expect(match).not.toBeNull();
    expect(match!.action).toBe("block");
    expect(match!.severity).toBe("critical");
  });

  test("blocks axios 0.30.4", () => {
    const match = checkPackage("axios", "0.30.4");
    expect(match).not.toBeNull();
    expect(match!.action).toBe("block");
  });

  test("allows safe axios 1.14.0", () => {
    const match = checkPackage("axios", "1.14.0");
    expect(match).toBeNull();
  });

  test("blocks compromised @tanstack/react-query range", () => {
    const match = checkPackage("@tanstack/react-query", "5.77.1");
    expect(match).not.toBeNull();
    expect(match!.action).toBe("block");
  });

  test("blocks typosquat eslint-config-prettierr", () => {
    const match = checkPackage("eslint-config-prettierr", "1.0.0");
    expect(match).not.toBeNull();
    expect(match!.remediation).toContain("eslint-config-prettier");
  });

  test("versionMatches handles exact and range entries", () => {
    const exact: BlocklistEntry = {
      package: "axios",
      version: "1.14.1",
      reason: "test",
      severity: "critical",
      action: "block",
      source: "test",
    };
    const range: BlocklistEntry = {
      package: "@tanstack/react-query",
      version_range: ">=5.77.0 <=5.77.2",
      reason: "test",
      severity: "critical",
      action: "block",
      source: "test",
    };
    expect(versionMatches(exact, "1.14.1")).toBe(true);
    expect(versionMatches(exact, "1.14.0")).toBe(false);
    expect(versionMatches(range, "5.77.1")).toBe(true);
    expect(versionMatches(range, "5.76.0")).toBe(false);
  });

  test("checkDependencies respects warn policy mode", () => {
    const matches = checkDependencies(
      [{ name: "axios", version: "1.14.1" }],
      { blocklist: "warn" },
    );
    expect(hasBlockingMatch(matches)).toBe(false);
    expect(matches[0]!.action).toBe("warn");
  });

  test("checkDependencies blocks in strict mode", () => {
    const matches = checkDependencies(
      [{ name: "plain-crypto-js", version: "4.2.1" }],
      { blocklist: "strict" },
    );
    expect(hasBlockingMatch(matches)).toBe(true);
  });
});
