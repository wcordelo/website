import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CliContext } from "../types.js";
import { loadBetterNpmrc } from "../policy/parser.js";
import {
  checkDependencies,
  formatBlockError,
  hasBlockingMatch,
} from "../intel/gate.js";
import { collectInstallTargets } from "../utils/deps.js";
import { emitError, success } from "../utils/json-output.js";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm/")) return "pnpm";
  if (ua.startsWith("yarn/")) return "yarn";
  if (ua.startsWith("bun/")) return "bun";
  if (ua.startsWith("npm/")) return "npm";

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun";

  return "npm";
}

export function generatePnpmHook(): string {
  return `// .pnpmfile.cjs — Better npm policy gate (auto-generated)
const { execSync } = require("node:child_process");

function runBnpmGate(deps) {
  try {
    const input = JSON.stringify({ deps });
    execSync("bunx @theo-startups/bnpm shim check --json", {
      input,
      stdio: ["pipe", "pipe", "inherit"],
    });
  } catch (e) {
    throw new Error("bnpm policy gate blocked install");
  }
}

module.exports = {
  hooks: {
    readPackage(pkg) {
      const deps = Object.entries(pkg.dependencies ?? {}).map(([name, version]) => ({
        name,
        version: String(version),
      }));
      if (deps.length) runBnpmGate(deps);
      return pkg;
    },
  },
};
`;
}

export function generateYarnRcSnippet(): string {
  return `# .yarnrc.yml — Better npm policy gate
# Run before install: bunx @theo-startups/bnpm shim install

bnpm:
  policyFile: .better-npmrc
  gateCommand: bunx @theo-startups/bnpm shim check
`;
}

export function runShim(ctx: CliContext, subcommand: string | null, passthrough: string[]): number {
  const pm = detectPackageManager(ctx.cwd);

  switch (subcommand) {
    case "detect":
      success(ctx, "shim detect", { packageManager: pm });
      return 0;

    case "check": {
      const policy = loadBetterNpmrc(ctx.cwd);
      let targets = collectInstallTargets(ctx.cwd, []);

      if (passthrough.includes("--stdin")) {
        try {
          const raw = readFileSync(0, "utf-8");
          const parsed = JSON.parse(raw) as { deps?: Array<{ name: string; version: string }> };
          if (parsed.deps) targets = parsed.deps;
        } catch {
          emitError(ctx, {
            ok: false,
            command: "shim check",
            exitCode: 1,
            message: "Invalid JSON on stdin; expected { deps: [{ name, version }] }",
          });
        }
      }

      const matches = checkDependencies(targets, policy, ctx.cwd);
      if (hasBlockingMatch(matches)) {
        emitError(ctx, {
          ok: false,
          command: "shim check",
          exitCode: 1,
          message: formatBlockError(matches),
          data: { packageManager: pm, blocked: matches },
        });
      }

      success(ctx, "shim check", {
        packageManager: pm,
        checked: targets.length,
        warnings: matches.filter((m) => m.action === "warn"),
      });
      return 0;
    }

    case "install": {
      const policy = loadBetterNpmrc(ctx.cwd);
      const extraPackages = passthrough.filter((a) => !a.startsWith("-"));
      const targets = collectInstallTargets(ctx.cwd, extraPackages);
      const matches = checkDependencies(targets, policy, ctx.cwd);

      if (hasBlockingMatch(matches)) {
        emitError(ctx, {
          ok: false,
          command: "shim install",
          exitCode: 1,
          message: formatBlockError(matches),
          data: { packageManager: pm, blocked: matches },
        });
      }

      const cmd = buildPassthroughCommand(pm, passthrough);
      success(ctx, "shim install", {
        packageManager: pm,
        command: cmd,
        warnings: matches.filter((m) => m.action === "warn"),
      });

      if (!ctx.json) {
        console.log(`[bnpm shim] Detected ${pm}. Run: ${cmd}`);
      }
      return 0;
    }

    case "init": {
      const files: string[] = [];
      const pnpmPath = join(ctx.cwd, ".pnpmfile.cjs");
      if (!existsSync(pnpmPath) || passthrough.includes("--force")) {
        writeFileSync(pnpmPath, generatePnpmHook());
        files.push(pnpmPath);
      }

      const yarnPath = join(ctx.cwd, ".yarnrc.yml");
      if (!existsSync(yarnPath) || passthrough.includes("--force")) {
        const existing = existsSync(yarnPath) ? readFileSync(yarnPath, "utf-8") : "";
        if (!existing.includes("bnpm:")) {
          writeFileSync(yarnPath, existing + "\n" + generateYarnRcSnippet());
          files.push(yarnPath);
        }
      }

      success(ctx, "shim init", { packageManager: pm, files });
      return 0;
    }

    default:
      emitError(ctx, {
        ok: false,
        command: "shim",
        exitCode: 1,
        message: "Usage: bnpm shim <detect|check|install|init> [args]",
      });
  }
}

function buildPassthroughCommand(pm: PackageManager, args: string[]): string {
  const joined = args.join(" ");
  switch (pm) {
    case "pnpm":
      return `pnpm install ${joined}`.trim();
    case "yarn":
      return `yarn install ${joined}`.trim();
    case "bun":
      return `bun install ${joined}`.trim();
    default:
      return `npm install ${joined}`.trim();
  }
}
