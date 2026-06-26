import type { CliContext } from "../types.js";
import { loadBetterNpmrc } from "../policy/parser.js";
import {
  checkDependencies,
  formatBlockError,
  hasBlockingMatch,
} from "../intel/gate.js";
import { collectInstallTargets } from "../utils/deps.js";
import { passthroughNpm } from "../utils/npm.js";
import { success } from "../utils/json-output.js";

export function runInstall(ctx: CliContext, passthrough: string[]): number {
  const policy = loadBetterNpmrc(ctx.cwd);
  const extraPackages = passthrough.filter((a) => !a.startsWith("-"));
  const targets = collectInstallTargets(ctx.cwd, extraPackages);
  const matches = checkDependencies(targets, policy, ctx.cwd);

  if (hasBlockingMatch(matches)) {
    const result = {
      ok: false,
      command: "install",
      exitCode: 1,
      message: formatBlockError(matches),
      data: { blocked: matches.filter((m) => m.action === "block") },
    };
    if (ctx.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`bnpm: ${result.message}`);
    }
    process.exit(1);
  }

  if (matches.length > 0 && !ctx.json) {
    for (const m of matches.filter((x) => x.action === "warn")) {
      console.warn(`[bnpm warn] ${m.package}@${m.version}: ${m.reason}`);
    }
  }

  const exitCode = passthroughNpm(["install", ...passthrough], ctx.cwd);

  if (exitCode === 0) {
    success(ctx, "install", {
      blocked: false,
      warnings: matches.filter((m) => m.action === "warn"),
      passthrough,
    });
  }

  return exitCode;
}
