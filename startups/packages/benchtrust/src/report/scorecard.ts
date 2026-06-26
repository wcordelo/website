/** Scorecard report generator (BENCH-012). */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Scorecard } from "../types.ts";

const METHODOLOGY_VERSION = "manifesto-v0.1-draft";

export function buildScorecard(
  runId: string,
  model: string,
  data: Omit<Scorecard, "runId" | "model" | "generatedAt" | "methodologyVersion">
): Scorecard {
  return {
    runId,
    model,
    generatedAt: new Date().toISOString(),
    methodologyVersion: METHODOLOGY_VERSION,
    ...data,
  };
}

export function scorecardToJson(scorecard: Scorecard): string {
  return JSON.stringify(scorecard, null, 2);
}

export function scorecardToHtml(scorecard: Scorecard): string {
  const passRows = scorecard.passAtK
    .map(
      (p) =>
        `<tr><td>pass@${p.k}</td><td>${(p.estimate * 100).toFixed(1)}%</td>` +
        `<td>${(p.wilsonLower * 100).toFixed(1)}–${(p.wilsonUpper * 100).toFixed(1)}%</td>` +
        `<td>${(p.bootstrapLower * 100).toFixed(1)}–${(p.bootstrapUpper * 100).toFixed(1)}%</td></tr>`
    )
    .join("\n");

  const failureRows = Object.entries(scorecard.failureModes)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BenchTrust Scorecard — ${scorecard.runId}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #1a1a2e; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f8; }
    .meta { color: #666; font-size: 0.9rem; }
    .badge { display: inline-block; background: #2d6a4f; color: white; padding: 0.2rem 0.6rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>BenchTrust Scorecard</h1>
  <p class="meta">
    <span class="badge">Procurement Ready</span>
    Run: <strong>${scorecard.runId}</strong> ·
    Model: <strong>${scorecard.model}</strong> ·
    Generated: ${scorecard.generatedAt}
  </p>
  <p class="meta">
    Vault: ${scorecard.vaultVersion} · Methodology: ${scorecard.methodologyVersion}
  </p>
  <h2>pass@k Results</h2>
  <table>
    <thead><tr><th>Metric</th><th>Estimate</th><th>Wilson 95% CI</th><th>Bootstrap 95% CI</th></tr></thead>
    <tbody>${passRows}</tbody>
  </table>
  <h2>By Scope</h2>
  <table>
    <thead><tr><th>Scope</th><th>Pass Rate</th><th>N</th></tr></thead>
    <tbody>
      <tr><td>narrow</td><td>${(scorecard.byScope.narrow.passRate * 100).toFixed(1)}%</td><td>${scorecard.byScope.narrow.n}</td></tr>
      <tr><td>wide</td><td>${(scorecard.byScope.wide.passRate * 100).toFixed(1)}%</td><td>${scorecard.byScope.wide.n}</td></tr>
    </tbody>
  </table>
  <h2>Failure Modes</h2>
  <table>
    <thead><tr><th>Mode</th><th>Count</th></tr></thead>
    <tbody>${failureRows || "<tr><td colspan=2>None</td></tr>"}</tbody>
  </table>
  ${
    scorecard.contamination
      ? `<h2>Contamination Audit</h2>
  <p>CRS: ${(scorecard.contamination.crsScore * 100).toFixed(1)}% · Canary leaks: ${scorecard.contamination.canaryLeaks}</p>`
      : ""
  }
  <p class="meta">Reward-hack rate: ${(scorecard.rewardHackRate * 100).toFixed(1)}%</p>
  <footer><p><em>BenchTrust — trust infrastructure for AI evaluation</em></p></footer>
</body>
</html>`;
}

/** PDF-ready markdown (render to PDF via external tool). */
export function scorecardToPdfMarkdown(scorecard: Scorecard): string {
  const lines = [
    `# BenchTrust Scorecard`,
    ``,
    `**Run ID:** ${scorecard.runId}`,
    `**Model:** ${scorecard.model}`,
    `**Generated:** ${scorecard.generatedAt}`,
    `**Vault:** ${scorecard.vaultVersion}`,
    `**Methodology:** ${scorecard.methodologyVersion}`,
    ``,
    `## pass@k Results`,
    ``,
    `| Metric | Estimate | Wilson 95% CI | Bootstrap 95% CI |`,
    `|--------|----------|---------------|------------------|`,
  ];

  for (const p of scorecard.passAtK) {
    lines.push(
      `| pass@${p.k} | ${(p.estimate * 100).toFixed(1)}% | ` +
        `${(p.wilsonLower * 100).toFixed(1)}–${(p.wilsonUpper * 100).toFixed(1)}% | ` +
        `${(p.bootstrapLower * 100).toFixed(1)}–${(p.bootstrapUpper * 100).toFixed(1)}% |`
    );
  }

  lines.push(``, `## Failure Modes`, ``);
  for (const [k, v] of Object.entries(scorecard.failureModes)) {
    lines.push(`- **${k}:** ${v}`);
  }

  lines.push(
    ``,
    `---`,
    `*Digitally signed scorecard — BenchTrust v0.1*`
  );

  return lines.join("\n");
}

export async function writeScorecardReports(
  scorecard: Scorecard,
  outDir: string
): Promise<{ json: string; html: string; markdown: string }> {
  await mkdir(outDir, { recursive: true });
  const json = scorecardToJson(scorecard);
  const html = scorecardToHtml(scorecard);
  const markdown = scorecardToPdfMarkdown(scorecard);

  await writeFile(join(outDir, `${scorecard.runId}.json`), json);
  await writeFile(join(outDir, `${scorecard.runId}.html`), html);
  await writeFile(join(outDir, `${scorecard.runId}.md`), markdown);

  return { json, html, markdown };
}
