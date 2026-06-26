import { describe, expect, test } from "bun:test";
import { analyzeAab, analyzeAabFromBuffer } from "../src/compliance/aab-analyzer.js";

describe("AAB analyzer (MOB-019)", () => {
  test("analyzeAab detects compliant release bundle", () => {
    const result = analyzeAab("/build/com.example.app-v42-release.aab");
    expect(result.bundleId).toBe("com.example.app");
    expect(result.versionCode).toBe(42);
    expect(result.nativeLibs.length).toBeGreaterThan(0);
    expect(result.compliant).toBe(true);
    expect(result.stub).toBe(true);
  });

  test("analyzeAab flags misaligned native libs", () => {
    const result = analyzeAab("/build/com.example.app-old-misaligned.aab");
    expect(result.compliant).toBe(false);
    expect(result.nativeLibs.some((l) => l.includes("libjsc"))).toBe(true);
  });

  test("analyzeAabFromBuffer validates zip magic", () => {
    const zipHeader = Buffer.alloc(4);
    zipHeader.writeUInt32LE(0x04034b50, 0);
    const result = analyzeAabFromBuffer(zipHeader, "app-release.aab");
    expect(result.bundleId).toBe("com.example.app");
  });

  test("rejects non-aab input", () => {
    const result = analyzeAab("/build/output.apk");
    expect(result.compliant).toBe(false);
    expect(result.nativeLibs).toHaveLength(0);
  });
});
