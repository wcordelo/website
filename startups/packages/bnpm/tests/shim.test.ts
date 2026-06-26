import { describe, expect, test } from "bun:test";
import {
  detectPackageManager,
  generatePnpmHook,
  generateYarnRcSnippet,
} from "../src/commands/shim.js";
import { checkDependencies, hasBlockingMatch } from "../src/intel/gate.js";

describe("shim command", () => {
  test("detectPackageManager reads user agent", () => {
    const prev = process.env.npm_config_user_agent;
    process.env.npm_config_user_agent = "pnpm/9.0.0 npm/? node/v20";
    expect(detectPackageManager()).toBe("pnpm");
    process.env.npm_config_user_agent = prev;
  });

  test("generatePnpmHook includes bnpm gate", () => {
    const hook = generatePnpmHook();
    expect(hook).toContain(".pnpmfile.cjs");
    expect(hook).toContain("bnpm shim check");
  });

  test("generateYarnRcSnippet references policy file", () => {
    const snippet = generateYarnRcSnippet();
    expect(snippet).toContain(".better-npmrc");
    expect(snippet).toContain("bnpm shim");
  });

  test("shim check logic blocks compromised deps", () => {
    const matches = checkDependencies(
      [{ name: "axios", version: "1.14.1" }],
      { blocklist: "strict" },
    );
    expect(hasBlockingMatch(matches)).toBe(true);
  });
});
