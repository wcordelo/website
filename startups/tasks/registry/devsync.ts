import type { TaskDefinition } from "../types.ts";

const pkg = "devsync";

function t(id: string, title: string, checks: TaskDefinition["checks"]): TaskDefinition {
  return { id, package: pkg, title, checks };
}

export const syncTasks: TaskDefinition[] = [
  t("SYNC-001", "Architecture RFC", [
    { type: "file", path: "spec/architecture-rfc.md" },
    { type: "fileContains", path: "spec/architecture-rfc.md", includes: "git-safe" },
  ]),
  t("SYNC-002", "Rust workspace scaffold", [
    { type: "file", path: "native/Cargo.toml" },
    { type: "dirMinFiles", path: "native/crates", min: 4 },
    { type: "file", path: "native/README.md" },
  ]),
  t("SYNC-003", "SQLite state schema", [
    { type: "file", path: "src/sync/state.ts" },
  ]),
  t("SYNC-004", "Filesystem watcher", [
    { type: "file", path: "src/watcher/index.ts" },
  ]),
  t("SYNC-005", "Content-defined chunking", [
    { type: "file", path: "src/sync/chunking.ts" },
  ]),
  t("SYNC-006", ".gitignore parser", [
    { type: "file", path: "src/ignore/gitignore.ts" },
  ]),
  t("SYNC-007", "Git safety hard-exclude", [
    { type: "file", path: "src/ignore/git-exclude.ts" },
  ]),
  t("SYNC-008", "Built-in ignore profiles", [
    { type: "file", path: "src/ignore/profiles.ts" },
  ]),
  t("SYNC-009", "mDNS peer discovery", [
    { type: "file", path: "src/transport/mdns.ts" },
  ]),
  t("SYNC-010", "QUIC transport layer", [
    { type: "file", path: "src/transport/quic.ts" },
  ]),
  t("SYNC-011", "Pairing flow", [
    { type: "file", path: "src/pairing/code.ts" },
  ]),
  t("SYNC-012", "Sync protocol v0", [
    { type: "file", path: "src/sync/engine.ts" },
    { type: "file", path: "src/transport/local.ts" },
  ]),
  t("SYNC-013", "two-way-safe conflicts", [
    { type: "file", path: "src/conflict/index.ts" },
  ]),
  t("SYNC-014", "Agent daemon", [
    { type: "file", path: "src/daemon/devsyncd.ts" },
  ]),
  t("SYNC-015", "CLI v0", [
    { type: "file", path: "src/cli.ts" },
    { type: "fileContains", path: "src/cli.ts", includes: "devsync add" },
  ]),
  t("SYNC-016", "Git lock awareness", [
    { type: "file", path: "src/sync/git-lock.ts" },
  ]),
  t("SYNC-017", "Crash recovery", [
    { type: "file", path: "src/sync/recovery.ts" },
  ]),
  t("SYNC-018", "10k-file stress test", [
    { type: "file", path: "tests/stress.test.ts" },
  ]),
  t("SYNC-019", "Encrypted relay server", [
    { type: "file", path: "src/relay/server.ts" },
  ]),
  t("SYNC-020", "sync.yaml config", [
    { type: "file", path: "src/config.ts" },
    { type: "fileContains", path: "src/config.ts", includes: "sync.yaml" },
  ]),
  t("SYNC-021", "Multi-root support", [
    { type: "file", path: "tests/multi-root.test.ts" },
  ]),
  t("SYNC-022", "macOS menubar app", [
    { type: "file", path: "menubar/README.md" },
    { type: "fileContains", path: "menubar/README.md", includes: "Tauri" },
  ]),
  t("SYNC-023", "Conflict review TUI", [
    { type: "file", path: "src/tui/conflicts.ts" },
  ]),
  t("SYNC-024", "Landing page + waitlist", [
    { type: "file", path: "content/landing-copy.md" },
  ]),
  t("SYNC-025", "Design partner program", [
    { type: "file", path: "content/design-partners.md" },
  ]),
  t("SYNC-026", "Git safety public doc", [
    { type: "file", path: "docs/git-safety.md" },
    { type: "fileContains", path: "docs/git-safety.md", includes: ".git" },
  ]),
  t("SYNC-027", "Private beta onboarding", [
    { type: "file", path: "gtm/beta-onboarding.md" },
  ]),
  t("SYNC-028", "Telemetry (opt-in)", [
    { type: "file", path: "src/telemetry.ts" },
  ]),
  t("SYNC-029", "node_modules regen profile", [
    { type: "file", path: "src/profiles/regen.ts" },
  ]),
  t("SYNC-030", "Linux FUSE read-only mount", [
    { type: "file", path: "src/fuse/README.md" },
    { type: "fileContains", path: "src/fuse/README.md", includes: "FUSE" },
  ]),
  t("SYNC-031", "Windows alpha port", [
    { type: "file", path: "docs/windows.md" },
  ]),
  t("SYNC-032", "VS Code extension stub", [
    { type: "file", path: "extension/package.json" },
    { type: "file", path: "extension/src/extension.ts" },
  ]),
];
