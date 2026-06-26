import type { CliContext } from "../types.js";
import { emitError, success } from "../utils/json-output.js";

export interface ApproveConfig {
  packageName: string;
  version: string;
  stagingUrl?: string;
  approver?: string;
  token?: string;
}

const STAGING_BASE = "https://staging.betternpm.dev/publish";

export function buildStagingUrl(config: ApproveConfig): string {
  const params = new URLSearchParams({
    package: config.packageName,
    version: config.version,
  });
  if (config.approver) params.set("approver", config.approver);
  return config.stagingUrl ?? `${STAGING_BASE}?${params.toString()}`;
}

export function runApprove(ctx: CliContext, passthrough: string[]): number {
  const pkgFlag = passthrough.find((a) => a.startsWith("--package="));
  const versionFlag = passthrough.find((a) => a.startsWith("--version="));
  const approverFlag = passthrough.find((a) => a.startsWith("--approver="));
  const tokenFlag = passthrough.find((a) => a.startsWith("--token="));
  const stagingFlag = passthrough.find((a) => a.startsWith("--staging-url="));

  if (!pkgFlag || !versionFlag) {
    emitError(ctx, {
      ok: false,
      command: "approve",
      exitCode: 1,
      message:
        "Usage: bnpm approve --package=<name> --version=<ver> [--approver=email] [--token=CI_TOKEN]",
    });
  }

  const config: ApproveConfig = {
    packageName: pkgFlag.slice("--package=".length),
    version: versionFlag.slice("--version=".length),
    approver: approverFlag?.slice("--approver=".length),
    token: tokenFlag?.slice("--token=".length) ?? process.env.BNPM_APPROVE_TOKEN,
  };

  if (stagingFlag) {
    config.stagingUrl = stagingFlag.slice("--staging-url=".length);
  }

  const stagingUrl = buildStagingUrl(config);
  const ciSnippet = generateCiSnippet(config, stagingUrl);

  const guidance = [
    "Staged publish approval",
    "",
    `Package: ${config.packageName}@${config.version}`,
    "",
    "1. Open the staging review URL in a browser:",
    `   ${stagingUrl}`,
    "",
    "2. A second maintainer must approve before CI publishes.",
    "",
    "3. Set BNPM_APPROVE_TOKEN in GitHub Actions secrets.",
    "",
    "4. Use the workflow snippet below in your publish job.",
    "",
    ciSnippet,
  ].join("\n");

  success(
    ctx,
    "approve",
    {
      package: config.packageName,
      version: config.version,
      stagingUrl,
      ciSnippet,
      approved: passthrough.includes("--confirm"),
    },
    ctx.json ? undefined : guidance,
  );

  return 0;
}

function generateCiSnippet(config: ApproveConfig, stagingUrl: string): string {
  return `# .github/workflows/publish-approve.yml
name: Publish with staged approval

on:
  workflow_dispatch:
    inputs:
      version:
        description: Version to publish
        required: true

jobs:
  approve:
    runs-on: ubuntu-latest
    environment: npm-publish-approval
    steps:
      - name: Request maintainer approval
        run: |
          echo "Review: ${stagingUrl}"
          echo "Package: ${config.packageName}@\${{ inputs.version }}"

  publish:
    needs: approve
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bunx @theo-startups/bnpm publish --skip-preflight
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
          BNPM_APPROVE_TOKEN: \${{ secrets.BNPM_APPROVE_TOKEN }}`;
}
