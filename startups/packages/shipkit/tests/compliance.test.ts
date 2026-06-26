import { describe, expect, test } from "bun:test";
import { checkElfAlignment, is16KbCompliant, parseElfHeader } from "../src/compliance/elf-alignment.js";
import { checkCompliance, loadComplianceRegistry } from "../src/compliance/registry.js";
import { buildDependencyGraph } from "../src/scanner/dep-graph.js";
import { join } from "node:path";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("compliance registry", () => {
  test("loads registry with entries", () => {
    const registry = loadComplianceRegistry();
    expect(registry.version).toBe("0.1.0");
    expect(registry.entries.length).toBeGreaterThan(40);
  });

  test("flags incompatible native modules from fixture", () => {
    const graph = buildDependencyGraph(FIXTURE);
    const result = checkCompliance(graph);
    expect(result.summary.incompatible).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.package === "react-native-reanimated")).toBe(true);
    expect(result.issues.some((i) => i.status === "incompatible")).toBe(true);
  });
});

describe("elf alignment", () => {
  test("detects misaligned stub files", () => {
    const result = checkElfAlignment("/build/libjsc.so");
    expect(result.aligned).toBe(false);
    expect(result.pageSize).toBe(4096);
    expect(result.stub).toBe(true);
  });

  test("passes aligned hermes stub", () => {
    const result = checkElfAlignment("/build/libhermes.so");
    expect(result.aligned).toBe(true);
    expect(result.pageSize).toBe(16384);
  });

  test("is16KbCompliant validates page size", () => {
    expect(is16KbCompliant({ file: "a.so", pageSize: 16384, aligned: true, stub: true })).toBe(true);
    expect(is16KbCompliant({ file: "b.so", pageSize: 4096, aligned: false, stub: true })).toBe(false);
  });

  test("parseElfHeader validates magic bytes", () => {
    const valid = Buffer.from("7f454c46", "hex");
    const padded = Buffer.concat([valid, Buffer.alloc(60)]);
    expect(parseElfHeader(padded)?.pageSize).toBe(16384);
    expect(parseElfHeader(Buffer.from("00000000", "hex"))).toBeNull();
  });
});
