import type { TaskDefinition } from "../types.ts";

const pkg = "shipkit";

function t(id: string, title: string, checks: TaskDefinition["checks"]): TaskDefinition {
  return { id, package: pkg, title, checks };
}

export const shipkitTasks: TaskDefinition[] = [
  t("MOB-001", "Customer discovery interviews", [
    { type: "file", path: "research/customer-discovery-template.md" },
    { type: "fileContains", path: "research/customer-discovery-template.md", includes: "interview" },
  ]),
  t("MOB-002", "Competitive teardown", [
    { type: "file", path: "research/competitive-teardown.md" },
    { type: "fileContains", path: "research/competitive-teardown.md", includes: "Expo" },
  ]),
  t("MOB-003", "16 KB analyzer spike", [
    { type: "file", path: "src/compliance/elf-alignment.ts" },
    { type: "fileContains", path: "src/compliance/elf-alignment.ts", includes: "16" },
  ]),
  t("MOB-004", "Monorepo scaffold", [
    { type: "file", path: "package.json" },
    { type: "fileContains", path: "package.json", includes: "@theo-startups/shipkit" },
  ]),
  t("MOB-005", "Dependency graph scanner", [
    { type: "file", path: "src/scanner/dep-graph.ts" },
  ]),
  t("MOB-006", "Expo SDK detector", [
    { type: "file", path: "src/scanner/expo-sdk-detector.ts" },
  ]),
  t("MOB-007", "16 KB compatibility registry", [
    { type: "file", path: "data/compliance-registry.json" },
    { type: "file", path: "src/compliance/registry.ts" },
    { type: "jsonMinLength", path: "data/compliance-registry.json", min: 1 },
  ]),
  t("MOB-008", "CLI scan command", [
    { type: "file", path: "src/cli.ts" },
    { type: "fileContains", path: "src/cli.ts", includes: "scan" },
  ]),
  t("MOB-009", "HTML scan report generator", [
    { type: "file", path: "src/report/html.ts" },
  ]),
  t("MOB-010", "Breaking change knowledge base", [
    { type: "file", path: "data/breaking-changes.json" },
    { type: "file", path: "src/upgrade/breaking-changes.ts" },
    { type: "jsonMinLength", path: "data/breaking-changes.json", min: 1 },
  ]),
  t("MOB-011", "Upgrade target resolver", [
    { type: "file", path: "src/upgrade/target-resolver.ts" },
  ]),
  t("MOB-012", "Codemod: package.json bump", [
    { type: "file", path: "src/codemods/package-json-bump.ts" },
  ]),
  t("MOB-013", "Codemod: app.config migrations", [
    { type: "file", path: "src/codemods/app-config-migrate.ts" },
  ]),
  t("MOB-014", "AI fix orchestrator", [
    { type: "file", path: "src/ai/fix-orchestrator.ts" },
    { type: "fileContains", path: "src/ai/fix-orchestrator.ts", includes: "orchestrat" },
  ]),
  t("MOB-015", "AI eval harness", [
    { type: "file", path: "tests/ai-eval.test.ts" },
  ]),
  t("MOB-016", "API service scaffold", [
    { type: "file", path: "src/api/server.ts" },
  ]),
  t("MOB-017", "Cloud scan orchestrator", [
    { type: "file", path: "src/api/orchestrator.ts" },
  ]),
  t("MOB-018", "EAS OAuth integration", [
    { type: "file", path: "src/integrations/eas.ts" },
  ]),
  t("MOB-019", "Post-build AAB analyzer", [
    { type: "file", path: "src/compliance/aab-analyzer.ts" },
  ]),
  t("MOB-020", "GitHub App setup", [
    { type: "file", path: "action/action.yml" },
    { type: "file", path: "action/PR-COMMENT-SPEC.md" },
    { type: "fileContains", path: "action/PR-COMMENT-SPEC.md", includes: "GitHub" },
  ]),
  t("MOB-021", "Auto-fix branch creator", [
    { type: "file", path: "src/integrations/github-fix.ts" },
  ]),
  t("MOB-022", "Store preflight rule engine", [
    { type: "file", path: "data/preflight-rules.json" },
    { type: "file", path: "src/preflight/rules-engine.ts" },
    { type: "jsonMinLength", path: "data/preflight-rules.json", min: 1 },
  ]),
  t("MOB-023", "Privacy manifest validator", [
    { type: "file", path: "src/preflight/privacy-manifest.ts" },
  ]),
  t("MOB-024", "Dashboard MVP", [
    { type: "file", path: "dashboard/index.html" },
    { type: "file", path: "dashboard/src/App.tsx" },
  ]),
  t("MOB-025", "Upgrade wizard UI", [
    { type: "file", path: "dashboard/src/components/UpgradeWizard.tsx" },
    { type: "fileContains", path: "dashboard/src/components/UpgradeWizard.tsx", includes: "UpgradeWizard" },
  ]),
  t("MOB-026", "Billing integration", [
    { type: "file", path: "docs/billing.md" },
    { type: "fileContains", path: "docs/billing.md", includes: "Team" },
  ]),
  t("MOB-027", "GitHub Action publish", [
    { type: "file", path: "action/action.yml" },
    { type: "fileContains", path: "action/action.yml", includes: "shipkit" },
  ]),
  t("MOB-028", "Landing page + docs", [
    { type: "file", path: "docs/landing-page.md" },
    { type: "fileContains", path: "docs/landing-page.md", includes: "ShipKit" },
  ]),
  t("MOB-029", "Design partner case study #1", [
    { type: "file", path: "gtm/case-study-01.md" },
    { type: "fileContains", path: "gtm/case-study-01.md", includes: "Case Study" },
  ]),
  t("MOB-030", "Expo partner application", [
    { type: "file", path: "gtm/expo-partner-application.md" },
    { type: "fileContains", path: "gtm/expo-partner-application.md", includes: "Expo" },
  ]),
  t("MOB-031", "SOC 2 readiness checklist", [
    { type: "file", path: "docs/soc2-checklist.md" },
    { type: "fileContains", path: "docs/soc2-checklist.md", includes: "SOC" },
  ]),
  t("MOB-032", "Launch campaign", [
    { type: "file", path: "gtm/launch-campaign.md" },
    { type: "fileContains", path: "gtm/launch-campaign.md", includes: "launch" },
  ]),
  t("MOB-033", "Agency multi-app view", [
    { type: "file", path: "src/api/agency.ts" },
  ]),
  t("MOB-034", "Slack alert integration", [
    { type: "file", path: "src/integrations/slack.ts" },
  ]),
  t("MOB-035", "False positive feedback loop", [
    { type: "file", path: "src/feedback.ts" },
  ]),
];
