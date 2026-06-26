import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { CliContext } from "../types.js";
import { loadBetterNpmrc } from "../policy/parser.js";
import { checkPackage } from "../intel/gate.js";
import { verifyProvenance } from "../sigstore/verify.js";
import { runNpm, passthroughNpm } from "../utils/npm.js";
import { emitError, success } from "../utils/json-output.js";
import {
  parseTarball,
  diffTarballs,
  fetchPreviousTarball,
  formatTarballDiffReport,
  type TarballDiffReport,
} from "../publish/tarball-diff.js";

interface PreflightCheck {
  name: string;
  passed: boolean;
  message: string;
}

export async function runPublish(ctx: CliContext, passthrough: string[]): Promise<number> {
  const policy = loadBetterNpmrc(ctx.cwd);
  const pkgPath = join(ctx.cwd, "package.json");

  if (!existsSync(pkgPath)) {
    emitError(ctx, {
      ok: false,
      command: "publish",
      exitCode: 1,
      message: "package.json not found",
    });
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    name?: string;
    version?: string;
    scripts?: Record<string, string>;
  };

  const checks: PreflightCheck[] = [];

  if (!pkg.name || !pkg.version) {
    checks.push({
      name: "package-metadata",
      passed: false,
      message: "package.json must include name and version",
    });
  } else {
    checks.push({
      name: "package-metadata",
      passed: true,
      message: `Publishing ${pkg.name}@${pkg.version}`,
    });

    const block = checkPackage(pkg.name, pkg.version, ctx.cwd);
    if (block?.action === "block") {
      checks.push({
        name: "blocklist",
        passed: false,
        message: `Version blocked: ${block.reason}`,
      });
    } else {
      checks.push({ name: "blocklist", passed: true, message: "Not on threat blocklist" });
    }
  }

  const riskyScripts = Object.keys(pkg.scripts ?? {}).filter((s) =>
    ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly"].includes(s),
  );
  checks.push({
    name: "lifecycle-scripts",
    passed: riskyScripts.length === 0,
    message:
      riskyScripts.length === 0
        ? "No install/publish lifecycle scripts"
        : `Lifecycle scripts present: ${riskyScripts.join(", ")}`,
  });

  if (policy.require_provenance?.length) {
    const prov = await verifyProvenance({
      packageName: pkg.name ?? "unknown",
      version: pkg.version ?? "0.0.0",
      registry: policy.allowed_registries?.[0] ?? "https://registry.npmjs.org",
    });
    checks.push({
      name: "provenance",
      passed: prov.verified,
      message: prov.message,
    });
  }

  let tarballDiff: TarballDiffReport | undefined;
  if (pkg.name && pkg.version && !passthrough.includes("--skip-tarball-diff")) {
    try {
      const { exitCode, stdout } = runNpm(["pack", "--json", "--silent"], { cwd: ctx.cwd });
      if (exitCode === 0) {
        const packResult = JSON.parse(stdout.trim()) as Array<{ filename: string }>;
        const filename = packResult[0]?.filename;
        if (filename) {
          const currentBuffer = readFileSync(join(ctx.cwd, filename));
          const current = parseTarball(currentBuffer);
          const previous = await fetchPreviousTarball(pkg.name, pkg.version);
          const previousSnapshot = previous ? parseTarball(previous.buffer) : null;
          tarballDiff = diffTarballs(current, previousSnapshot, {
            currentVersion: pkg.version,
            previousVersion: previous?.version,
          });
          try {
            unlinkSync(join(ctx.cwd, filename));
          } catch {
            // ignore cleanup errors
          }

          checks.push({
            name: "tarball-diff",
            passed: tarballDiff.risky.length === 0,
            message:
              tarballDiff.risky.length === 0
                ? `Diff vs ${tarballDiff.previousVersion ?? "none"}: no risky changes`
                : `${tarballDiff.risky.length} risky change(s) detected`,
          });
        }
      }
    } catch {
      checks.push({
        name: "tarball-diff",
        passed: true,
        message: "Tarball diff skipped (pack failed or offline)",
      });
    }
  }

  const failed = checks.filter((c) => !c.passed);
  if (failed.length > 0 && !passthrough.includes("--skip-preflight")) {
    emitError(ctx, {
      ok: false,
      command: "publish",
      exitCode: 1,
      message: `Publish preflight failed: ${failed.map((f) => f.name).join(", ")}`,
      data: { checks, failed },
    });
  }

  if (!ctx.json) {
    console.log("[bnpm] publish preflight:");
    for (const c of checks) {
      console.log(`  ${c.passed ? "✓" : "✗"} ${c.name}: ${c.message}`);
    }
    if (tarballDiff) {
      console.log("\n" + formatTarballDiffReport(tarballDiff));
    }
  }

  const exitCode = passthroughNpm(
    ["publish", ...passthrough.filter((a) => a !== "--skip-preflight")],
    ctx.cwd,
  );

  if (exitCode === 0) {
    success(ctx, "publish", {
      checks,
      tarballDiff,
      published: `${pkg.name}@${pkg.version}`,
    });
  }

  return exitCode;
}
