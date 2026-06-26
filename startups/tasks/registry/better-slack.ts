import type { TaskDefinition } from "../types.ts";

const pkg = "better-slack";

function t(id: string, title: string, checks: TaskDefinition["checks"]): TaskDefinition {
  return { id, package: pkg, title, checks };
}

export const slackTasks: TaskDefinition[] = [
  t("COMM-001", "Thread data model schema", [
    { type: "file", path: "src/db/schema.ts" },
  ]),
  t("COMM-002", "Forum-first channel UI", [
    { type: "file", path: "web/App.tsx" },
    { type: "fileContains", path: "web/App.tsx", includes: "thread" },
  ]),
  t("COMM-003", "Thread composer", [
    { type: "file", path: "src/routes/threads.ts" },
  ]),
  t("COMM-004", "Sub-thread creation", [
    { type: "fileContains", path: "src/routes/threads.ts", includes: "parent" },
  ]),
  t("COMM-005", "Thread status workflow", [
    { type: "fileContains", path: "src/routes/threads.ts", includes: "status" },
  ]),
  t("COMM-006", "Thread subscriptions", [
    { type: "fileContains", path: "src/routes/threads.ts", includes: "subscri" },
  ]),
  t("COMM-007", "Cross-thread references", [
    { type: "file", path: "src/utils/thread-refs.ts" },
  ]),
  t("COMM-008", "Post primitive schema", [
    { type: "file", path: "src/routes/posts.ts" },
  ]),
  t("COMM-009", "Post editor UI", [
    { type: "file", path: "web/App.tsx" },
    { type: "fileContains", path: "web/App.tsx", includes: "COMM-009" },
  ]),
  t("COMM-010", "Post version diff", [
    { type: "fileContains", path: "src/routes/posts.ts", includes: "version" },
  ]),
  t("COMM-011", "Post templates", [
    { type: "file", path: "src/posts/templates.ts" },
  ]),
  t("COMM-012", "Real-time WebSocket layer", [
    { type: "file", path: "src/ws/pubsub.ts" },
  ]),
  t("COMM-013", "Workspace auth", [
    { type: "file", path: "src/routes/auth.ts" },
  ]),
  t("COMM-014", "Channel permissions (human)", [
    { type: "fileContains", path: "src/routes/channels.ts", includes: "permission" },
    { type: "file", path: "src/routes/channels.ts" },
  ]),
  t("COMM-015", "Agent registry service", [
    { type: "file", path: "src/agents/registry.ts" },
    { type: "fileContains", path: "src/agents/registry.ts", includes: "COMM-015" },
  ]),
  t("COMM-016", "Capability permission engine", [
    { type: "file", path: "src/permissions/engine.ts" },
  ]),
  t("COMM-017", "Agent audit log", [
    { type: "fileContains", path: "src/routes/agents.ts", includes: "audit" },
  ]),
  t("COMM-018", "Agent proposal flow for Posts", [
    { type: "fileContains", path: "src/routes/posts.ts", includes: "propos" },
  ]),
  t("COMM-019", "CI Reporter agent", [
    { type: "file", path: "src/agents/ci-reporter.ts" },
  ]),
  t("COMM-020", "GitHub integration", [
    { type: "file", path: "src/routes/webhooks.ts" },
  ]),
  t("COMM-021", "Linear integration", [
    { type: "file", path: "src/integrations/linear.ts" },
  ]),
  t("COMM-022", "Full-text search", [
    { type: "file", path: "src/search/index.ts" },
  ]),
  t("COMM-023", "Agent SDK (TypeScript)", [
    { type: "file", path: "src/sdk/index.ts" },
    { type: "fileContains", path: "src/sdk/index.ts", includes: "BetterSlack" },
  ]),
  t("COMM-024", "MCP server (OSS)", [
    { type: "file", path: "src/mcp/server.ts" },
    { type: "fileContains", path: "src/mcp/server.ts", includes: "tool" },
  ]),
  t("COMM-025", "Design partner program", [
    { type: "file", path: "gtm/design-partners.md" },
    { type: "fileContains", path: "gtm/design-partners.md", includes: "partner" },
  ]),
  t("COMM-026", "Landing page + waitlist", [
    { type: "file", path: "content/landing-copy.md" },
    { type: "fileContains", path: "content/landing-copy.md", includes: "waitlist" },
  ]),
  t("COMM-027", "Slack bridge bot (read-only)", [
    { type: "file", path: "src/bridge/slack.ts" },
  ]),
  t("COMM-028", "Stripe billing integration", [
    { type: "file", path: "src/billing/stripe.ts" },
  ]),
  t("COMM-029", "SAML SSO", [
    { type: "file", path: "src/auth/saml.ts" },
  ]),
  t("COMM-030", "Thread resolution ritual", [
    { type: "fileContains", path: "src/routes/threads.ts", includes: "summary" },
  ]),
  t("COMM-031", "Notification digest", [
    { type: "file", path: "src/jobs/digest.ts" },
  ]),
  t("COMM-032", "Security review: agent permissions", [
    { type: "file", path: "docs/agent-permissions-review.md" },
    { type: "fileContains", path: "docs/agent-permissions-review.md", includes: "Permissions" },
  ]),
  t("COMM-033", "SOC 2 Type I prep", [
    { type: "file", path: "docs/soc2-readiness.md" },
    { type: "fileContains", path: "docs/soc2-readiness.md", includes: "SOC" },
  ]),
  t("COMM-034", "Demo video production", [
    { type: "file", path: "content/demo-script.md" },
    { type: "fileContains", path: "content/demo-script.md", includes: "Demo Script" },
  ]),
  t("COMM-035", "Slack history import (basic)", [
    { type: "file", path: "src/import/slack.ts" },
  ]),
];
