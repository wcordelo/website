#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, hasFlag } from "./utils/args.js";
import { runInstall } from "./commands/install.js";
import { runCi } from "./commands/ci.js";
import { runInit } from "./commands/init.js";
import { runEmergency } from "./commands/emergency.js";
import { runAuditPipeline } from "./commands/audit-pipeline.js";
import { runPublish } from "./commands/publish.js";
import { runApprove } from "./commands/approve.js";
import { runShim } from "./commands/shim.js";
import { passthroughNpm } from "./utils/npm.js";
import type { CliContext } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
    ) as { version?: string };
    return pkg.version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}

function printHelp(): void {
  console.log(`bnpm — Better npm v${readVersion()}

Usage:
  bnpm [--json] <command> [args]
  bnpx [--json] <package> [args]

Commands:
  install [args]           Install with blocklist pre-check (passthrough to npm)
  ci [args]                Strict CI install with --ignore-scripts injection
  init [--strict]          Scaffold .better-npmrc, .npmrc, GitHub Action
  emergency deprecate      Dry-run bulk deprecate helper (--execute to run)
  audit-pipeline [--sarif] Scan .github/workflows for supply-chain risks
  publish [args]           Preflight checks before npm publish
  approve [args]           Staged publish approval with CI guidance
  shim <subcommand>        pnpm/yarn policy shim (detect|check|install|init)

Global flags:
  --json                   Machine-readable output
  -h, --help               Show help
  -v, --version            Show version
`);
}

async function main(): Promise<void> {
  const rawArgv = process.argv.slice(2);
  const invokedAsBnpx = process.argv[1]?.includes("bnpx") ?? false;

  if (invokedAsBnpx) {
    const { json, passthrough } = parseArgs(rawArgv);
    if (json) {
      console.log(JSON.stringify({ ok: true, command: "bnpx", passthrough }));
    }
    process.exit(passthroughNpm(["exec", ...rawArgv.filter((a) => a !== "--json")]));
  }

  const parsed = parseArgs(rawArgv);
  const ctx: CliContext = { json: parsed.json, cwd: process.cwd() };

  if (hasFlag(parsed.flags, "help") || parsed.command === "help") {
    printHelp();
    process.exit(0);
  }

  if (hasFlag(parsed.flags, "version") || parsed.command === "--version") {
    const version = readVersion();
    if (ctx.json) {
      console.log(JSON.stringify({ ok: true, command: "version", version }));
    } else {
      console.log(version);
    }
    process.exit(0);
  }

  if (!parsed.command) {
    printHelp();
    process.exit(1);
  }

  let exitCode = 1;

  switch (parsed.command) {
    case "install":
      exitCode = runInstall(ctx, parsed.passthrough);
      break;
    case "ci":
      exitCode = runCi(ctx, parsed.passthrough);
      break;
    case "init":
      exitCode = runInit(ctx, parsed.passthrough);
      break;
    case "emergency":
      exitCode = runEmergency(ctx, parsed.subcommand, parsed.passthrough);
      break;
    case "audit-pipeline":
      exitCode = runAuditPipeline(ctx, parsed.passthrough);
      break;
    case "publish":
      exitCode = await runPublish(ctx, parsed.passthrough);
      break;
    case "approve":
      exitCode = runApprove(ctx, parsed.passthrough);
      break;
    case "shim":
      exitCode = runShim(ctx, parsed.subcommand, parsed.passthrough);
      break;
    default:
      if (ctx.json) {
        console.log(
          JSON.stringify({
            ok: false,
            command: parsed.command,
            exitCode: 1,
            message: `Unknown command: ${parsed.command}`,
          }),
        );
      } else {
        console.error(`bnpm: unknown command "${parsed.command}"`);
        printHelp();
      }
      exitCode = 1;
  }

  process.exit(exitCode);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
