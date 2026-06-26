#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { runScan } from "./scanner/index.js";
import { resolveUpgradePlan } from "./upgrade/target-resolver.js";
import { evaluatePreflight, getPreflightSummary } from "./preflight/rules-engine.js";
import { generateHtmlReport, generateJsonReport } from "./report/index.js";
import { orchestrateFixes } from "./ai/fix-orchestrator.js";

const program = new Command();

program
  .name("shipkit")
  .description("Expo/React Native release intelligence CLI")
  .version("0.1.0");

program
  .command("scan")
  .description("Full repo scan with JSON/HTML report")
  .argument("[path]", "Project path", ".")
  .option("--json", "Output JSON to stdout")
  .option("--html <file>", "Write HTML report to file")
  .option("--out <dir>", "Output directory for reports", "./shipkit-report")
  .action((path: string, opts: { json?: boolean; html?: string; out?: string }) => {
    const projectPath = resolve(path);
    const result = runScan(projectPath);

    if (opts.json) {
      console.log(generateJsonReport(result));
    } else {
      console.log(`\nShipKit Scan — ${result.graph.root}`);
      console.log(`Health score: ${result.healthScore}/100`);
      console.log(`Expo SDK: ${result.expo.sdkVersion ?? "unknown"}`);
      console.log(`Native modules: ${result.graph.nativeModules.length}`);
      console.log(`16KB issues: ${result.compliance.issues.length}`);
      const pf = getPreflightSummary(result.preflight);
      console.log(`Preflight: ${pf.passed} passed, ${pf.failed} failed (${pf.errors} errors)`);
    }

    const outDir = resolve(opts.out ?? "./shipkit-report");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(`${outDir}/scan.json`, generateJsonReport(result));
    writeFileSync(`${outDir}/scan.html`, generateHtmlReport(result));
    console.log(`\nReports written to ${outDir}/`);

    if (opts.html) {
      writeFileSync(resolve(opts.html), generateHtmlReport(result));
      console.log(`HTML report: ${opts.html}`);
    }
  });

program
  .command("upgrade-plan")
  .description("Recommend target SDK and upgrade steps")
  .argument("[path]", "Project path", ".")
  .option("--json", "Output JSON")
  .action((path: string, opts: { json?: boolean }) => {
    const projectPath = resolve(path);
    const scan = runScan(projectPath);
    const plan = resolveUpgradePlan(scan.expo, scan.graph, scan.compliance.issues);

    if (opts.json) {
      console.log(JSON.stringify(plan, null, 2));
      return;
    }

    console.log(`\nUpgrade Plan: SDK ${plan.currentSdk ?? "?"} → ${plan.targetSdk}`);
    console.log(`Estimated effort: ${plan.estimatedEffort}`);
    console.log(`\nSteps (${plan.steps.length}):`);
    for (const step of plan.steps) {
      const detail = step.to ? ` → ${step.to}` : "";
      console.log(`  [${step.action}] ${step.target}${detail}: ${step.reason}`);
    }
    if (plan.breakingChanges.length > 0) {
      console.log(`\nBreaking changes (${plan.breakingChanges.length}):`);
      for (const bc of plan.breakingChanges.slice(0, 5)) {
        console.log(`  - [${bc.severity}] ${bc.title}`);
      }
      if (plan.breakingChanges.length > 5) {
        console.log(`  ... and ${plan.breakingChanges.length - 5} more`);
      }
    }
  });

program
  .command("preflight")
  .description("Store lint checks (Apple + Google)")
  .argument("[path]", "Project path", ".")
  .option("--json", "Output JSON")
  .action((path: string, opts: { json?: boolean }) => {
    const projectPath = resolve(path);
    const violations = evaluatePreflight(projectPath);
    const summary = getPreflightSummary(violations);

    if (opts.json) {
      console.log(JSON.stringify({ violations, summary }, null, 2));
      return;
    }

    console.log(`\nStore Preflight — ${violations.length} rules evaluated`);
    console.log(`Passed: ${summary.passed} | Failed: ${summary.failed} (${summary.errors} errors, ${summary.warnings} warnings)\n`);

    const failed = violations.filter((v) => !v.passed);
    for (const v of failed) {
      const icon = v.severity === "error" ? "✗" : "⚠";
      console.log(`${icon} [${v.store}] ${v.title} (${v.severity})`);
      console.log(`  ${v.message}`);
    }

    if (failed.length === 0) {
      console.log("All preflight checks passed.");
    }
  });

program
  .command("report")
  .description("Generate report from last scan or fresh scan")
  .argument("[path]", "Project path", ".")
  .option("--html", "Generate HTML report")
  .option("--json", "Generate JSON report")
  .option("-o, --output <file>", "Output file path")
  .action((path: string, opts: { html?: boolean; json?: boolean; output?: string }) => {
    const projectPath = resolve(path);
    const result = runScan(projectPath);
    const fixes = orchestrateFixes(result);

    const format = opts.html ? "html" : "json";
    const content = format === "html" ? generateHtmlReport(result) : generateJsonReport(result);
    const defaultName = format === "html" ? "shipkit-report.html" : "shipkit-report.json";
    const outputPath = resolve(opts.output ?? defaultName);

    writeFileSync(outputPath, content);
    console.log(`Report written to ${outputPath}`);

    if (fixes.length > 0) {
      console.log(`\nTop fix suggestions:`);
      for (const fix of fixes.slice(0, 3)) {
        console.log(`  [${(fix.confidence * 100).toFixed(0)}%] ${fix.description}`);
      }
    }
  });

program.parse();
