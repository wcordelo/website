import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { PipelineFinding } from "../types.js";

const RISK_PATTERNS: Array<{
  rule: string;
  severity: PipelineFinding["severity"];
  pattern: RegExp;
  message: string;
}> = [
  {
    rule: "BNPM-OIDC-001",
    severity: "critical",
    pattern: /id-token:\s*write/i,
    message: "Workflow requests id-token:write — verify OIDC trust policy is ref-scoped and minimal",
  },
  {
    rule: "BNPM-PRTARGET-001",
    severity: "critical",
    pattern: /pull_request_target/i,
    message: "pull_request_target runs with base repo secrets; audit checkout and script execution",
  },
  {
    rule: "BNPM-CACHE-001",
    severity: "high",
    pattern: /actions\/cache@v[0-9]/i,
    message: "actions/cache may be poisoned; pin to commit SHA and restrict cache keys",
  },
  {
    rule: "BNPM-CACHE-002",
    severity: "high",
    pattern: /cache:\s*['"]?npm['"]?/i,
    message: "npm cache in CI — use immutable cache keys tied to lockfile hash",
  },
  {
    rule: "BNPM-ACTION-001",
    severity: "medium",
    pattern: /uses:\s*[^@\n]+@v\d+(?:\.\d+)?\s*$/m,
    message: "Floating action version tag; pin to full commit SHA",
  },
  {
    rule: "BNPM-NPM-001",
    severity: "high",
    pattern: /npm\s+install(?!\s+--ignore-scripts)/i,
    message: "npm install without --ignore-scripts in CI; lifecycle scripts may execute",
  },
  {
    rule: "BNPM-NPX-001",
    severity: "medium",
    pattern: /\bnpx\s+(?!--yes\s+--ignore-scripts)/i,
    message: "npx invocation without ignore-scripts guard",
  },
  {
    rule: "BNPM-TOKEN-001",
    severity: "critical",
    pattern: /NPM_TOKEN|NODE_AUTH_TOKEN/i,
    message: "npm token referenced in workflow — ensure narrow publish scope and OIDC preferred",
  },
];

function walkWorkflows(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...walkWorkflows(full));
    } else if (/\.(ya?ml)$/i.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

export function scanWorkflowFile(filePath: string, content?: string): PipelineFinding[] {
  const text = content ?? readFileSync(filePath, "utf-8");
  const findings: PipelineFinding[] = [];

  for (const rule of RISK_PATTERNS) {
    const matches = text.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags + "g"));
    for (const match of matches) {
      const index = match.index ?? 0;
      const line = text.slice(0, index).split("\n").length;
      findings.push({
        file: filePath,
        line,
        rule: rule.rule,
        severity: rule.severity,
        message: rule.message,
      });
    }
  }

  // Deduplicate same rule per line
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.file}:${f.line}:${f.rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface PipelineAuditResult {
  workflowsScanned: number;
  findings: PipelineFinding[];
  criticalCount: number;
  highCount: number;
}

export function auditPipeline(cwd: string = process.cwd()): PipelineAuditResult {
  const workflowDir = join(cwd, ".github", "workflows");
  const files = walkWorkflows(workflowDir);
  const findings: PipelineFinding[] = [];

  for (const file of files) {
    findings.push(...scanWorkflowFile(file));
  }

  return {
    workflowsScanned: files.length,
    findings,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    highCount: findings.filter((f) => f.severity === "high").length,
  };
}

export function toSarif(result: PipelineAuditResult, cwd: string): object {
  return {
    version: "2.1.0",
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "bnpm-audit-pipeline",
            version: "0.1.0",
            informationUri: "https://betternpm.dev",
            rules: [...new Set(result.findings.map((f) => f.rule))].map((id) => ({
              id,
              shortDescription: { text: id },
            })),
          },
        },
        results: result.findings.map((f) => ({
          ruleId: f.rule,
          level: f.severity === "critical" || f.severity === "high" ? "error" : "warning",
          message: { text: f.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.file.replace(cwd + "/", "") },
                region: { startLine: f.line },
              },
            },
          ],
        })),
      },
    ],
  };
}
