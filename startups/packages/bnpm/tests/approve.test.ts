import { describe, expect, test } from "bun:test";
import { buildStagingUrl } from "../src/commands/approve.js";

describe("approve command", () => {
  test("buildStagingUrl includes package and version", () => {
    const url = buildStagingUrl({
      packageName: "@myorg/pkg",
      version: "2.1.0",
      approver: "alice@example.com",
    });
    expect(url).toContain("package=%40myorg%2Fpkg");
    expect(url).toContain("version=2.1.0");
    expect(url).toContain("approver=alice%40example.com");
  });

  test("buildStagingUrl respects custom staging URL", () => {
    const url = buildStagingUrl({
      packageName: "demo",
      version: "1.0.0",
      stagingUrl: "https://ci.example.com/review/123",
    });
    expect(url).toBe("https://ci.example.com/review/123");
  });
});
