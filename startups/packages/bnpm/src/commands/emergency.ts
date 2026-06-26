import type { CliContext } from "../types.js";
import { generateAdvisory } from "../advisory/generator.js";
import { emitError, success } from "../utils/json-output.js";
import { runNpm } from "../utils/npm.js";

export interface DeprecateTarget {
  package: string;
  version: string;
  message: string;
}

const SAMPLE_TARGETS: DeprecateTarget[] = [
  {
    package: "axios",
    version: "1.14.1",
    message: "SECURITY: compromised version — do not use (bnpm emergency)",
  },
  {
    package: "axios",
    version: "0.30.4",
    message: "SECURITY: compromised version — do not use (bnpm emergency)",
  },
  {
    package: "@tanstack/react-query",
    version: "5.77.1",
    message: "SECURITY: malicious publish May 2026 — rotate credentials",
  },
];

export function runEmergency(ctx: CliContext, subcommand: string | null, passthrough: string[]): number {
  if (subcommand !== "deprecate") {
    emitError(ctx, {
      ok: false,
      command: "emergency",
      exitCode: 1,
      message: "Usage: bnpm emergency deprecate [--dry-run] [--package name@version]",
    });
  }

  const dryRun = !passthrough.includes("--execute");
  const custom = passthrough.find((a) => a.startsWith("--package="));
  let targets = SAMPLE_TARGETS;

  if (custom) {
    const spec = custom.slice("--package=".length);
    const at = spec.lastIndexOf("@");
    targets = [
      {
        package: at > 0 ? spec.slice(0, at) : spec,
        version: at > 0 ? spec.slice(at + 1) : "*",
        message: "bnpm emergency deprecation",
      },
    ];
  }

  const npmCommands = targets.map(
    (t) => `npm deprecate ${t.package}@${t.version} "${t.message}"`,
  );

  const advisory = generateAdvisory({
    packageName: targets[0]!.package,
    affectedVersions: targets.map((t) => t.version).join(", "),
    summary: `Emergency bulk deprecate for ${targets.length} compromised version(s)`,
    description:
      "Maintainer-initiated emergency deprecation via bnpm. This is a dry-run unless --execute is passed.",
    severity: "critical",
    iocs: targets.map((t) => `${t.package}@${t.version}`),
  });

  if (dryRun) {
    success(
      ctx,
      "emergency deprecate",
      {
        dryRun: true,
        targets,
        npmCommands,
        advisory: advisory.json,
      },
      [
        "Emergency deprecate (DRY RUN — pass --execute to run npm deprecate):",
        ...npmCommands.map((c) => `  ${c}`),
        "",
        "Advisory draft written to stdout JSON when --json is set.",
      ].join("\n"),
    );
    if (!ctx.json) {
      console.log("\n--- Advisory draft (markdown) ---\n");
      console.log(advisory.markdown);
    }
    return 0;
  }

  const results: Array<{ command: string; exitCode: number }> = [];

  for (const t of targets) {
    const { exitCode } = runNpm(
      ["deprecate", `${t.package}@${t.version}`, t.message],
      { cwd: ctx.cwd },
    );
    results.push({
      command: `npm deprecate ${t.package}@${t.version}`,
      exitCode,
    });
  }

  const failed = results.some((r) => r.exitCode !== 0);
  success(ctx, "emergency deprecate", { dryRun: false, results, advisory: advisory.json });
  return failed ? 1 : 0;
}
