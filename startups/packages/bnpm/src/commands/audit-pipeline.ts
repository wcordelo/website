import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CliContext } from "../types.js";
import { auditPipeline, toSarif } from "../audit/pipeline.js";
import { emitError, success } from "../utils/json-output.js";

export function runAuditPipeline(ctx: CliContext, passthrough: string[]): number {
  const sarifEq = passthrough.find((a) => a.startsWith("--sarif="));
  const sarifIdx = passthrough.indexOf("--sarif");
  let sarifPath: string | undefined;

  if (sarifEq) {
    sarifPath = sarifEq.split("=")[1];
  } else if (sarifIdx !== -1) {
    const next = passthrough[sarifIdx + 1];
    if (next && !next.startsWith("-")) {
      sarifPath = next;
    }
  }

  const result = auditPipeline(ctx.cwd);
  const failOnCritical = !passthrough.includes("--no-fail");

  if (sarifPath || passthrough.includes("--sarif")) {
    const out = sarifPath ?? join(ctx.cwd, "bnpm-pipeline-audit.sarif");
    writeFileSync(out, JSON.stringify(toSarif(result, ctx.cwd), null, 2));
    if (!ctx.json) {
      console.log(`[bnpm] SARIF written to ${out}`);
    }
  }

  if (!ctx.json) {
    console.log(`Scanned ${result.workflowsScanned} workflow file(s)`);
    if (result.findings.length === 0) {
      console.log("No pipeline risks detected.");
    } else {
      for (const f of result.findings) {
        console.log(`  [${f.severity}] ${f.file}:${f.line} ${f.rule}`);
        console.log(`    ${f.message}`);
      }
    }
  }

  if (failOnCritical && result.criticalCount > 0) {
    emitError(ctx, {
      ok: false,
      command: "audit-pipeline",
      exitCode: 1,
      message: `${result.criticalCount} critical pipeline finding(s)`,
      data: result,
    });
  }

  success(ctx, "audit-pipeline", result);
  return result.highCount > 0 && failOnCritical ? 1 : 0;
}
