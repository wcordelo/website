import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { auditPipeline, scanWorkflowFile, toSarif } from "../src/audit/pipeline.js";

const RISKY_WORKFLOW = `
name: CI
on:
  pull_request_target:
    types: [opened]
permissions:
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-cache
      - run: npm install
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;

const SAFE_WORKFLOW = `
name: CI
on:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@abc123def456
      - run: npm ci --ignore-scripts
`;

describe("pipeline audit", () => {
  test("detects OIDC, pull_request_target, cache, and npm install risks", () => {
    const findings = scanWorkflowFile(".github/workflows/ci.yml", RISKY_WORKFLOW);
    const rules = findings.map((f) => f.rule);
    expect(rules).toContain("BNPM-OIDC-001");
    expect(rules).toContain("BNPM-PRTARGET-001");
    expect(rules).toContain("BNPM-CACHE-001");
    expect(rules).toContain("BNPM-NPM-001");
    expect(rules).toContain("BNPM-TOKEN-001");
  });

  test("clean workflow has no critical findings", () => {
    const findings = scanWorkflowFile(".github/workflows/safe.yml", SAFE_WORKFLOW);
    const critical = findings.filter((f) => f.severity === "critical");
    expect(critical.length).toBe(0);
  });

  test("auditPipeline scans directory tree", () => {
    const dir = mkdtempSync(join(tmpdir(), "bnpm-audit-"));
    const wfDir = join(dir, ".github", "workflows");
    mkdirSync(wfDir, { recursive: true });
    writeFileSync(join(wfDir, "ci.yml"), RISKY_WORKFLOW);

    const result = auditPipeline(dir);
    expect(result.workflowsScanned).toBe(1);
    expect(result.criticalCount).toBeGreaterThan(0);

    rmSync(dir, { recursive: true, force: true });
  });

  test("toSarif produces valid structure", () => {
    const result = auditPipeline(process.cwd());
    const sarif = toSarif(result, process.cwd()) as {
      runs: Array<{ results: unknown[] }>;
    };
    expect(sarif.runs[0]!.results).toBeDefined();
  });
});
