export interface CliContext {
  json: boolean;
  cwd: string;
}

export interface CommandResult {
  ok: boolean;
  command: string;
  exitCode: number;
  message?: string;
  data?: unknown;
}

export interface BlockMatch {
  package: string;
  version: string;
  reason: string;
  severity: BlockSeverity;
  action: BlockAction;
  source: string;
  remediation?: string;
}

export type BlockSeverity = "critical" | "high" | "medium" | "low";
export type BlockAction = "block" | "warn";

export interface BetterNpmrc {
  blocklist?: "strict" | "warn" | "off";
  lifecycle_scripts?: "allow" | "allowlist" | "block" | "warn";
  allowed_registries?: string[];
  require_provenance?: string[];
  telemetry?: "opt-in" | "off";
  script_allowlist?: string[];
}

export interface PipelineFinding {
  file: string;
  line: number;
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}
