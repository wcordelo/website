import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  fetchEasBuilds,
  validateEasToken,
} from "../src/integrations/eas.js";
import { createFixBranchSpec, formatGitHubPrComment } from "../src/integrations/github-fix.js";
import { buildSlackMessage, formatSlackBlocks, sendSlackAlert } from "../src/integrations/slack.js";
import { runScan } from "../src/scanner/index.js";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("EAS OAuth (MOB-018)", () => {
  const config = {
    clientId: "test-client",
    redirectUri: "http://localhost:3000/callback",
    scopes: ["build:read", "project:read"],
  };

  test("buildAuthorizationUrl includes required params", () => {
    const url = buildAuthorizationUrl(config, "csrf-token");
    expect(url).toContain("expo.dev/oauth/authorize");
    expect(url).toContain("client_id=test-client");
    expect(url).toContain("state=csrf-token");
  });

  test("exchangeAuthorizationCode returns token", async () => {
    const token = await exchangeAuthorizationCode(config, "authcode12345678");
    expect(token.accessToken).toStartWith("eas_stub_");
    expect(validateEasToken(token)).toBe(true);
  });

  test("fetchEasBuilds returns stub builds", async () => {
    const token = await exchangeAuthorizationCode(config, "authcode12345678");
    const builds = await fetchEasBuilds(token, "proj-abc");
    expect(builds.length).toBe(1);
    expect(builds[0]!.artifactUrl).toContain(".aab");
  });
});

describe("GitHub fix branch (MOB-021)", () => {
  test("createFixBranchSpec generates PR payload", () => {
    const result = runScan(FIXTURE);
    const spec = createFixBranchSpec(result);
    expect(spec.branchName).toContain("shipkit/fix-");
    expect(spec.title).toContain("fix(shipkit)");
    expect(spec.files.length).toBeGreaterThan(0);
    expect(spec.pullRequestUrl).toContain("compare");
  });

  test("formatGitHubPrComment includes health score", () => {
    const result = runScan(FIXTURE);
    const comment = formatGitHubPrComment(result);
    expect(comment).toContain("Health score");
    expect(comment).toContain(`${result.healthScore}/100`);
  });
});

describe("Slack alerts (MOB-034)", () => {
  test("buildSlackMessage formats payload", () => {
    const result = runScan(FIXTURE);
    const payload = buildSlackMessage(result, "https://shipkit.dev/report/1");
    expect(payload.projectName).toBe("sample-expo-app");
    expect(payload.scanUrl).toBeDefined();
  });

  test("formatSlackBlocks produces valid structure", () => {
    const result = runScan(FIXTURE);
    const payload = buildSlackMessage(result);
    const blocks = formatSlackBlocks(payload);
    expect(blocks.attachments).toBeDefined();
  });

  test("sendSlackAlert returns stub when no webhook", async () => {
    const result = runScan(FIXTURE);
    const res = await sendSlackAlert(result);
    expect(res.stub).toBe(true);
    expect(res.sent).toBe(false);
  });
});
