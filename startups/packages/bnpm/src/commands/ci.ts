import type { CliContext } from "../types.js";
import { loadBetterNpmrc } from "../policy/parser.js";
import {
  checkDependencies,
  formatBlockError,
  hasBlockingMatch,
} from "../intel/gate.js";
import { readLockfileDeps } from "../utils/deps.js";
import { shouldIgnoreScripts } from "../policy/lifecycle.js";
import { passthroughNpm } from "../utils/npm.js";
import { emitError, success } from "../utils/json-output.js";

export function runCi(ctx: CliContext, passthrough: string[]): number {
  const policy = loadBetterNpmrc(ctx.cwd);
  const { dependencies } = readLockfileDeps(ctx.cwd);
  const matches = checkDependencies(dependencies, policy, ctx.cwd);

  if (hasBlockingMatch(matches)) {
    emitError(ctx, {
      ok: false,
      command: "ci",
      exitCode: 1,
      message: formatBlockError(matches),
      data: { blocked: matches.filter((m) => m.action === "block"), strict: true },
    });
  }

  const npmArgs = ["ci"];
  const hasIgnoreScripts = passthrough.some(
    (a) => a === "--ignore-scripts" || a.startsWith("--ignore-scripts="),
  );

  if (!hasIgnoreScripts && shouldIgnoreScripts(policy, true)) {
    npmArgs.push("--ignore-scripts");
    if (!ctx.json) {
      console.log("[bnpm] strict ci: injecting --ignore-scripts");
    }
  }

  npmArgs.push(...passthrough);

  const exitCode = passthroughNpm(npmArgs, ctx.cwd);

  if (exitCode === 0) {
    success(ctx, "ci", {
      strict: true,
      ignoreScriptsInjected: !hasIgnoreScripts,
      dependenciesChecked: dependencies.length,
    });
  }

  return exitCode;
}
