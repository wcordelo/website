import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { CliContext } from "../types.js";
import {
  formatBetterNpmrc,
  STRICT_PRESET,
  NPMRC_STRICT_PRESET,
  loadBetterNpmrc,
} from "../policy/parser.js";
import { emitError, success } from "../utils/json-output.js";

const GITHUB_ACTION_STUB = `name: Better npm audit

on:
  pull_request:
    paths:
      - "package.json"
      - "package-lock.json"
      - "pnpm-lock.yaml"
      - "yarn.lock"
      - ".better-npmrc"

jobs:
  bnpm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bunx @theo-startups/bnpm audit-pipeline --sarif results.sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif
`;

export function runInit(ctx: CliContext, passthrough: string[]): number {
  const strict = passthrough.includes("--strict") || passthrough.includes("-s");
  const policyPath = join(ctx.cwd, ".better-npmrc");
  const npmrcPath = join(ctx.cwd, ".npmrc");
  const actionDir = join(ctx.cwd, ".github", "workflows");
  const actionPath = join(actionDir, "better-npm-audit.yml");

  if (existsSync(policyPath) && !passthrough.includes("--force")) {
    emitError(ctx, {
      ok: false,
      command: "init",
      exitCode: 1,
      message: ".better-npmrc already exists (use --force to overwrite)",
    });
  }

  const policy = strict ? STRICT_PRESET : loadBetterNpmrc(ctx.cwd);
  writeFileSync(policyPath, formatBetterNpmrc(policy));

  if (strict || !existsSync(npmrcPath)) {
    writeFileSync(npmrcPath, NPMRC_STRICT_PRESET);
  }

  if (!existsSync(actionPath)) {
    mkdirSync(actionDir, { recursive: true });
    writeFileSync(actionPath, GITHUB_ACTION_STUB);
  }

  const readmeSnippet = [
    "## Supply chain policy",
    "",
    "This project uses [Better npm](https://betternpm.dev) (`bnpm`).",
    "",
    "```bash",
    "bunx @theo-startups/bnpm install",
    "```",
    "",
  ].join("\n");

  success(
    ctx,
    "init",
    {
      strict,
      files: {
        betterNpmrc: policyPath,
        npmrc: npmrcPath,
        workflow: actionPath,
      },
      readmeSnippet,
    },
    strict
      ? "Initialized strict .better-npmrc, .npmrc, and GitHub Action stub"
      : "Initialized .better-npmrc and GitHub Action stub",
  );

  return 0;
}
