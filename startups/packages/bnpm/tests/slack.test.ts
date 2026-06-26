import { describe, expect, test } from "bun:test";
import { formatBlockSlackMessage } from "../src/integrations/slack.js";

describe("slack integration", () => {
  test("formatBlockSlackMessage includes package and reason", () => {
    const msg = formatBlockSlackMessage({
      event: "block",
      match: {
        package: "axios",
        version: "1.14.1",
        reason: "Compromised version",
        severity: "critical",
        action: "block",
        source: "bnpm-intel",
        remediation: "Upgrade to 1.14.2",
      },
      orgId: "org_acme",
      project: "web-app",
    });

    expect(msg.text).toContain("axios@1.14.1");
    expect(msg.text).toContain("Compromised version");
    expect(msg.blocks?.length).toBeGreaterThan(2);
  });

  test("formatBlockSlackMessage handles warn events", () => {
    const msg = formatBlockSlackMessage({
      event: "warn",
      match: {
        package: "eslint-config-prettierr",
        version: "1.0.0",
        reason: "Typosquat",
        severity: "high",
        action: "warn",
        source: "bnpm-intel",
      },
    });
    expect(msg.text).toContain("warn");
  });
});
