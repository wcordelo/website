import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { orchestrateFixes } from "../src/ai/fix-orchestrator.js";
import { runScan } from "../src/scanner/index.js";

interface GoldenDataset {
  description: string;
  fixturePath: string;
  expectations: {
    minSuggestions: number;
    mustIncludeIssueIds: string[];
    topSuggestionMinConfidence: number;
    sortedByConfidence: boolean;
    strategies: string[];
  };
  sampleSuggestions: Array<{
    issueId?: string;
    issueIdPrefix?: string;
    descriptionContains?: string;
    minConfidence: number;
    strategy: string;
    automated: boolean;
  }>;
}

const GOLDEN: GoldenDataset = JSON.parse(
  readFileSync(join(import.meta.dir, "fixtures", "golden-fixes.json"), "utf-8"),
);

const FIXTURE = join(import.meta.dir, GOLDEN.fixturePath.replace("tests/", ""));

describe("AI eval harness (MOB-015)", () => {
  test("golden dataset loads", () => {
    expect(GOLDEN.expectations.minSuggestions).toBeGreaterThan(0);
    expect(GOLDEN.sampleSuggestions.length).toBeGreaterThan(0);
  });

  test("orchestrateFixes meets golden expectations", () => {
    const result = runScan(FIXTURE);
    const suggestions = orchestrateFixes(result);

    expect(suggestions.length).toBeGreaterThanOrEqual(GOLDEN.expectations.minSuggestions);

    for (const requiredId of GOLDEN.expectations.mustIncludeIssueIds) {
      expect(suggestions.some((s) => s.issueId === requiredId)).toBe(true);
    }

    if (GOLDEN.expectations.sortedByConfidence) {
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1]!.confidence).toBeGreaterThanOrEqual(suggestions[i]!.confidence);
      }
    }

    expect(suggestions[0]!.confidence).toBeGreaterThanOrEqual(
      GOLDEN.expectations.topSuggestionMinConfidence,
    );

    for (const sample of GOLDEN.sampleSuggestions) {
      const match = suggestions.find((s) => {
        if (sample.issueId) return s.issueId === sample.issueId;
        if (sample.issueIdPrefix) return s.issueId.startsWith(sample.issueIdPrefix);
        return false;
      });
      expect(match).toBeDefined();
      expect(match!.confidence).toBeGreaterThanOrEqual(sample.minConfidence);
      expect(match!.strategy).toBe(sample.strategy);
      expect(match!.automated).toBe(sample.automated);
      if (sample.descriptionContains) {
        expect(match!.description.toLowerCase()).toContain(sample.descriptionContains);
      }
    }
  });

  test("confidence scores stay in valid range", () => {
    const result = runScan(FIXTURE);
    const suggestions = orchestrateFixes(result);
    for (const s of suggestions) {
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
      expect(GOLDEN.expectations.strategies).toContain(s.strategy);
    }
  });
});
