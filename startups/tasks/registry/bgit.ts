import type { TaskDefinition } from "../types.ts";

const pkg = "bgit";

function t(id: string, title: string, checks: TaskDefinition["checks"]): TaskDefinition {
  return { id, package: pkg, title, checks };
}

export const gitTasks: TaskDefinition[] = [
  t("GIT-001", "Intent schema RFC", [
    { type: "file", path: "spec/intent-rfc.md" },
    { type: "file", path: "src/schema/intent.schema.json" },
  ]),
  t("GIT-002", ".bgit/ directory layout", [
    { type: "file", path: "spec/layout.md" },
    { type: "file", path: "src/store/layout.ts" },
  ]),
  t("GIT-003", "Monorepo bootstrap", [
    { type: "file", path: "package.json" },
    { type: "fileContains", path: "package.json", includes: "@theo-startups/bgit" },
  ]),
  t("GIT-004", "bgit init command", [
    { type: "file", path: "src/commands/init.ts" },
  ]),
  t("GIT-005", "Git refs integration", [
    { type: "file", path: "src/git/refs.ts" },
    { type: "file", path: "src/git/notes.ts" },
  ]),
  t("GIT-006", "bgit session start", [
    { type: "file", path: "src/commands/session.ts" },
  ]),
  t("GIT-007", "bgit session end", [
    { type: "fileContains", path: "src/commands/session.ts", includes: "end" },
  ]),
  t("GIT-008", "Claude Code log parser", [
    { type: "file", path: "src/capture/claude.ts" },
  ]),
  t("GIT-009", "Redaction engine", [
    { type: "file", path: "src/capture/redaction.ts" },
  ]),
  t("GIT-010", "bgit checkpoint", [
    { type: "file", path: "src/commands/checkpoint.ts" },
  ]),
  t("GIT-011", "bgit why reverse lookup", [
    { type: "file", path: "src/commands/why.ts" },
  ]),
  t("GIT-012", "bgit trace forward lookup", [
    { type: "file", path: "src/commands/trace.ts" },
  ]),
  t("GIT-013", "JSON output mode", [
    { type: "file", path: "src/output.ts" },
    { type: "fileContains", path: "src/output.ts", includes: "json" },
  ]),
  t("GIT-014", "MCP server scaffold", [
    { type: "file", path: "src/mcp/server.ts" },
  ]),
  t("GIT-015", "MCP core tools (10)", [
    { type: "fileContains", path: "src/mcp/server.ts", includes: "session_start" },
  ]),
  t("GIT-016", "Secrets crypto module", [
    { type: "file", path: "src/crypto/aes.ts" },
    { type: "file", path: "src/crypto/keywrap.ts" },
  ]),
  t("GIT-017", "bgit secret set/get", [
    { type: "file", path: "src/commands/secret.ts" },
  ]),
  t("GIT-018", "OS keychain integration", [
    { type: "file", path: "src/crypto/keychain.ts" },
  ]),
  t("GIT-019", "Git smudge/clean filter", [
    { type: "file", path: "src/git/filters.ts" },
  ]),
  t("GIT-020", "Auto-checkpoint hook", [
    { type: "file", path: "src/git/hooks.ts" },
    { type: "fileContains", path: "src/git/hooks.ts", includes: "checkpoint" },
  ]),
  t("GIT-021", "Session squash", [
    { type: "fileContains", path: "src/commands/session.ts", includes: "squash" },
  ]),
  t("GIT-022", "Cursor log adapter", [
    { type: "file", path: "src/capture/cursor.ts" },
  ]),
  t("GIT-023", "Docs site", [
    { type: "file", path: "docs/getting-started.md" },
    { type: "fileContains", path: "docs/getting-started.md", includes: "bgit init" },
  ]),
  t("GIT-024", "Homebrew formula", [
    { type: "file", path: "formula/bgit.rb" },
    { type: "fileContains", path: "formula/bgit.rb", includes: "bgit" },
  ]),
  t("GIT-025", "Design partner program", [
    { type: "file", path: "gtm/design-partner-program.md" },
  ]),
  t("GIT-026", "Benchmark: commit noise", [
    { type: "file", path: "research/commit-noise-benchmark.md" },
  ]),
  t("GIT-027", "bgit export git-compat verify", [
    { type: "file", path: "src/commands/export.ts" },
  ]),
  t("GIT-028", "Policy engine spec", [
    { type: "file", path: "spec/policy-rfc.md" },
  ]),
  t("GIT-029", "jj workspace spike", [
    { type: "file", path: "src/commands/workspace.ts" },
  ]),
  t("GIT-030", "Semantic diff spike", [
    { type: "file", path: "src/diff/semantic.ts" },
  ]),
  t("GIT-031", "Threat model document", [
    { type: "file", path: "docs/SECURITY.md" },
    { type: "fileContains", path: "docs/SECURITY.md", includes: "Threat Model" },
  ]),
  t("GIT-032", "Launch blog post", [
    { type: "file", path: "content/launch-blog.md" },
  ]),
];
