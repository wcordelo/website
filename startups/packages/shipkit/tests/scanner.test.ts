import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { parsePackageJson } from "../src/scanner/package-json-parser.js";
import { buildDependencyGraph } from "../src/scanner/dep-graph.js";
import { detectExpoSdk } from "../src/scanner/expo-sdk-detector.js";
import { runScan } from "../src/scanner/index.js";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("package-json-parser", () => {
  test("parses dependencies from fixture", () => {
    const pkg = parsePackageJson(FIXTURE);
    expect(pkg).not.toBeNull();
    expect(pkg!.name).toBe("sample-expo-app");
    expect(pkg!.allDependencies.expo).toBe("~51.0.0");
    expect(pkg!.allDependencies["react-native"]).toBe("0.74.5");
  });

  test("returns null for missing package.json", () => {
    expect(parsePackageJson("/nonexistent/path")).toBeNull();
  });
});

describe("dep-graph", () => {
  test("identifies native modules", () => {
    const graph = buildDependencyGraph(FIXTURE);
    expect(graph.root).toBe("sample-expo-app");
    expect(graph.nativeModules).toContain("expo");
    expect(graph.nativeModules).toContain("react-native");
    expect(graph.nativeModules).toContain("react-native-reanimated");
    expect(graph.nativeModules.length).toBeGreaterThan(5);
  });

  test("marks native modules correctly", () => {
    const graph = buildDependencyGraph(FIXTURE);
    expect(graph.nodes["react-native"]?.isNative).toBe(true);
    expect(graph.nodes["react"]?.isNative).toBe(false);
  });
});

describe("expo-sdk-detector", () => {
  test("detects SDK from package.json and app.json", () => {
    const sdk = detectExpoSdk(FIXTURE);
    expect(sdk.expoVersion).toBe("~51.0.0");
    expect(sdk.sdkVersion).toBe(51);
    expect(sdk.reactNativeVersion).toBe("0.74.5");
  });
});

describe("scanner", () => {
  test("runScan produces complete result", () => {
    const result = runScan(FIXTURE);
    expect(result.path).toBe(FIXTURE);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(result.compliance.issues.length).toBeGreaterThan(0);
    expect(result.preflight.length).toBeGreaterThan(80);
  });
});
