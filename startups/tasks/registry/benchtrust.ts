import type { TaskDefinition } from "../types.ts";

const pkg = "benchtrust";

function t(id: string, title: string, checks: TaskDefinition["checks"]): TaskDefinition {
  return { id, package: pkg, title, checks };
}

export const benchTasks: TaskDefinition[] = [
  t("BENCH-001", "Competitive intelligence dossier", [
    { type: "file", path: "research/competitive-dossier.md" },
    { type: "fileContains", path: "research/competitive-dossier.md", includes: "benchmark" },
  ]),
  t("BENCH-002", "Methodology manifesto draft", [
    { type: "file", path: "research/methodology-manifesto.md" },
    { type: "fileContains", path: "research/methodology-manifesto.md", includes: "holdout" },
  ]),
  t("BENCH-003", "Task extraction pipeline v0", [
    { type: "file", path: "src/pipeline/extractor.ts" },
    { type: "fileContains", path: "src/pipeline/extractor.ts", includes: "extract" },
  ]),
  t("BENCH-004", "Auto task validator", [
    { type: "file", path: "src/pipeline/validator.ts" },
  ]),
  t("BENCH-005", "Narrow/wide test classifier", [
    { type: "file", path: "src/pipeline/classifier.ts" },
  ]),
  t("BENCH-006", "Human QA workflow", [
    { type: "file", path: "src/qa/workflow.ts" },
  ]),
  t("BENCH-007", "Private holdout vault", [
    { type: "file", path: "src/vault/holdout-vault.ts" },
  ]),
  t("BENCH-008", "Canary string system", [
    { type: "file", path: "src/contamination/canary.ts" },
    { type: "fileContains", path: "src/contamination/canary.ts", includes: "canary" },
  ]),
  t("BENCH-009", "Sealed Docker runtime", [
    { type: "file", path: "src/runtime/sealed-spec.ts" },
    { type: "fileContains", path: "src/runtime/sealed-spec.ts", includes: "Docker" },
  ]),
  t("BENCH-010", "Multi-run orchestrator", [
    { type: "file", path: "src/orchestrator.ts" },
    { type: "fileContains", path: "src/orchestrator.ts", includes: "orchestrat" },
  ]),
  t("BENCH-011", "pass@k statistics engine", [
    { type: "file", path: "src/stats/pass-at-k.ts" },
  ]),
  t("BENCH-012", "Scorecard report generator", [
    { type: "file", path: "src/report/scorecard.ts" },
    { type: "fileContains", path: "src/report/scorecard.ts", includes: "scorecard" },
  ]),
  t("BENCH-013", "Contamination audit agent", [
    { type: "file", path: "src/contamination/audit-agent.ts" },
    { type: "fileContains", path: "src/contamination/audit-agent.ts", includes: "audit" },
  ]),
  t("BENCH-014", "Temporal decontamination tags", [
    { type: "file", path: "src/pipeline/temporal.ts" },
    { type: "fileContains", path: "src/pipeline/temporal.ts", includes: "temporal" },
  ]),
  t("BENCH-015", "Reference agent scaffold", [
    { type: "file", path: "src/scaffold/reference-agent.ts" },
    { type: "fileContains", path: "src/scaffold/reference-agent.ts", includes: "agent" },
  ]),
  t("BENCH-016", "Scaffold adapter SDK", [
    { type: "file", path: "src/scaffold/adapter-sdk.ts" },
    { type: "fileContains", path: "src/scaffold/adapter-sdk.ts", includes: "adapter" },
  ]),
  t("BENCH-017", "Reward-hacking trajectory classifier", [
    { type: "file", path: "src/contamination/reward-hack.ts" },
    { type: "fileContains", path: "src/contamination/reward-hack.ts", includes: "reward" },
  ]),
  t("BENCH-018", "Design partner outreach", [
    { type: "file", path: "gtm/design-partner-outreach.md" },
    { type: "fileContains", path: "gtm/design-partner-outreach.md", includes: "partner" },
  ]),
  t("BENCH-019", "First partner eval", [
    { type: "file", path: "data/sample-reports/partner-acme-scorecard.json" },
  ]),
  t("BENCH-020", "API v0", [
    { type: "file", path: "src/api/server.ts" },
    { type: "fileContains", path: "src/api/server.ts", includes: "api" },
  ]),
  t("BENCH-021", "Dashboard v0", [
    { type: "file", path: "dashboard/index.html" },
    { type: "file", path: "dashboard/api.ts" },
  ]),
  t("BENCH-022", "Weekly task drop pipeline", [
    { type: "file", path: "src/pipeline/weekly-drop.ts" },
  ]),
  t("BENCH-023", "Pricing & packaging", [
    { type: "file", path: "docs/pricing.md" },
    { type: "fileContains", path: "docs/pricing.md", includes: "Pricing" },
  ]),
  t("BENCH-024", "SOC2 readiness assessment", [
    { type: "file", path: "docs/soc2-readiness.md" },
    { type: "fileContains", path: "docs/soc2-readiness.md", includes: "SOC" },
  ]),
  t("BENCH-025", "Enterprise vertical scoping", [
    { type: "file", path: "gtm/enterprise-vertical-fintech.md" },
    { type: "fileContains", path: "gtm/enterprise-vertical-fintech.md", includes: "fintech" },
  ]),
  t("BENCH-026", "Whitepaper publication", [
    { type: "file", path: "content/whitepaper.md" },
    { type: "fileContains", path: "content/whitepaper.md", includes: "BenchTrust" },
  ]),
  t("BENCH-027", "W&B / Braintrust integration", [
    { type: "file", path: "src/integrations/wandb.ts" },
  ]),
  t("BENCH-028", "Second language expansion", [
    { type: "dirMinFiles", path: "data/sample-tasks", min: 10 },
    { type: "file", path: "data/sample-tasks/ts-001.json" },
  ]),
  t("BENCH-029", "Benchmark Trust Summit", [
    { type: "file", path: "gtm/summit-plan.md" },
    { type: "fileContains", path: "gtm/summit-plan.md", includes: "summit" },
  ]),
  t("BENCH-030", "Certification program design", [
    { type: "file", path: "docs/certification.md" },
    { type: "fileContains", path: "docs/certification.md", includes: "certif" },
  ]),
  t("BENCH-031", "Failure mode taxonomy", [
    { type: "file", path: "src/taxonomy.ts" },
    { type: "fileContains", path: "src/taxonomy.ts", includes: "Failure mode" },
  ]),
  t("BENCH-032", "Procurement compliance pack", [
    { type: "file", path: "docs/procurement-pack.md" },
    { type: "fileContains", path: "docs/procurement-pack.md", includes: "Procurement" },
  ]),
];
