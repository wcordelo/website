import type { TaskDefinition } from "../types.ts";

const pkg = "bnpm";

function t(id: string, title: string, checks: TaskDefinition["checks"]): TaskDefinition {
  return { id, package: pkg, title, checks };
}

export const npmTasks: TaskDefinition[] = [
  t("NPM-001", "Competitive intel dossier", [
    { type: "file", path: "research/competitive-intel.md" },
    { type: "fileContains", path: "research/competitive-intel.md", includes: "Socket" },
  ]),
  t("NPM-002", "Threat feed inventory", [
    { type: "file", path: "research/threat-feed-inventory.md" },
    { type: "fileContains", path: "research/threat-feed-inventory.md", includes: "OSV" },
  ]),
  t("NPM-003", "npm CLI fork study", [
    { type: "file", path: "research/cli-fork-study.md" },
    { type: "fileContains", path: "research/cli-fork-study.md", includes: "arborist" },
  ]),
  t("NPM-004", "Monorepo bootstrap", [
    { type: "file", path: "package.json" },
    { type: "fileContains", path: "package.json", includes: "@theo-startups/bnpm" },
  ]),
  t("NPM-005", "CLI scaffold", [
    { type: "file", path: "src/cli.ts" },
    { type: "fileContains", path: "src/cli.ts", includes: "install" },
  ]),
  t("NPM-006", "Blocklist schema", [
    { type: "file", path: "src/intel/schema.ts" },
  ]),
  t("NPM-007", "Intel ingestion worker", [
    { type: "file", path: "src/intel/ingestion.ts" },
    { type: "fileContains", path: "src/intel/ingestion.ts", includes: "normalize" },
  ]),
  t("NPM-008", "Install-time block gate", [
    { type: "file", path: "src/intel/gate.ts" },
  ]),
  t("NPM-009", "Lifecycle script policy", [
    { type: "file", path: "src/policy/lifecycle.ts" },
    { type: "file", path: "src/commands/ci.ts" },
  ]),
  t("NPM-010", ".better-npmrc parser", [
    { type: "file", path: "src/policy/parser.ts" },
  ]),
  t("NPM-011", "bnpm init command", [
    { type: "file", path: "src/commands/init.ts" },
    { type: "fileContains", path: "src/commands/init.ts", includes: "strict" },
  ]),
  t("NPM-012", "Emergency deprecate TUI", [
    { type: "file", path: "src/commands/emergency.ts" },
    { type: "fileContains", path: "src/commands/emergency.ts", includes: "dry" },
  ]),
  t("NPM-013", "Advisory generator", [
    { type: "file", path: "src/advisory/generator.ts" },
  ]),
  t("NPM-014", "Pipeline audit command", [
    { type: "file", path: "src/commands/audit-pipeline.ts" },
  ]),
  t("NPM-015", "GitHub Action v1", [
    { type: "file", path: "action/action.yml" },
    { type: "fileContains", path: "action/action.yml", includes: "bnpm" },
  ]),
  t("NPM-016", "Docs site", [
    { type: "file", path: "docs/site/index.html" },
    { type: "fileContains", path: "docs/site/index.html", includes: "bnpm install" },
  ]),
  t("NPM-017", "Brand + domain", [
    { type: "file", path: "docs/brand.md" },
    { type: "fileContains", path: "docs/brand.md", includes: "bnpm" },
  ]),
  t("NPM-018", "Telemetry (opt-in)", [
    { type: "file", path: "docs/telemetry-policy.md" },
    { type: "fileContains", path: "docs/telemetry-policy.md", includes: "opt-in" },
  ]),
  t("NPM-019", "Publish wizard v1", [
    { type: "file", path: "src/commands/publish.ts" },
    { type: "fileContains", path: "src/commands/publish.ts", includes: "preflight" },
  ]),
  t("NPM-020", "Tarball diff engine", [
    { type: "file", path: "src/publish/tarball-diff.ts" },
  ]),
  t("NPM-021", "Staged approve helper", [
    { type: "file", path: "src/commands/approve.ts" },
  ]),
  t("NPM-022", "pnpm/yarn shim", [
    { type: "file", path: "src/commands/shim.ts" },
  ]),
  t("NPM-023", "Control plane API", [
    { type: "file", path: "src/api/server.ts" },
  ]),
  t("NPM-024", "Dashboard MVP", [
    { type: "file", path: "dashboard/src/App.tsx" },
    { type: "file", path: "dashboard/src/PolicyEditor.tsx" },
  ]),
  t("NPM-025", "Registry proxy PoC", [
    { type: "file", path: "src/proxy/worker.ts" },
  ]),
  t("NPM-026", "Stripe billing", [
    { type: "file", path: "src/billing/stripe.ts" },
    { type: "file", path: "docs/billing.md" },
  ]),
  t("NPM-027", "Slack webhook integration", [
    { type: "file", path: "src/integrations/slack.ts" },
  ]),
  t("NPM-028", "Maintainer outreach campaign", [
    { type: "file", path: "gtm/outreach-templates.md" },
    { type: "fileContains", path: "gtm/outreach-templates.md", includes: "maintainer" },
  ]),
  t("NPM-029", "Launch content pack", [
    { type: "dirMinFiles", path: "docs/launch", min: 3 },
  ]),
  t("NPM-030", "Third-party pen test", [
    { type: "file", path: "docs/pen-test-checklist.md" },
    { type: "fileContains", path: "docs/pen-test-checklist.md", includes: "pen test" },
  ]),
  t("NPM-031", "SOC 2 readiness", [
    { type: "file", path: "docs/soc2-readiness.md" },
    { type: "fileContains", path: "docs/soc2-readiness.md", includes: "SOC" },
  ]),
  t("NPM-032", "Sigstore verify module", [
    { type: "file", path: "src/sigstore/verify.ts" },
    { type: "fileContains", path: "src/sigstore/verify.ts", includes: "provenance" },
  ]),
];
