import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { parseThreadRefs } from "../src/utils/thread-refs.ts";
import { listTemplates, getTemplate } from "../src/posts/templates.ts";
import { search, indexDocument } from "../src/search/index.ts";
import { handleLinearWebhook } from "../src/integrations/linear.ts";
import { parseSlackEvent } from "../src/bridge/slack.ts";
import { createCheckoutSession, getTierLimits, checkLimit } from "../src/billing/stripe.ts";
import { getSamlLoginUrl, handleSamlCallback } from "../src/auth/saml.ts";
import { buildUserDigest } from "../src/jobs/digest.ts";
import { importSlackChannel } from "../src/import/slack.ts";
import { getDb, closeDb } from "../src/db/schema.ts";
import { newId } from "../src/db/seed.ts";
import { join } from "node:path";
import { unlinkSync, existsSync, mkdirSync } from "node:fs";

const TEST_DB = join(import.meta.dir, "../data/features-test.db");

describe("COMM-007: Cross-thread references", () => {
  test("parses >>thread:id references", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const refs = parseThreadRefs(`See >>thread:${id} for context`);
    expect(refs).toHaveLength(1);
    expect(refs[0]!.threadId).toBe(id);
  });

  test("parses shorthand >>id format", () => {
    const id = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
    const refs = parseThreadRefs(`Related: >>${id}`);
    expect(refs).toHaveLength(1);
    expect(refs[0]!.threadId).toBe(id);
  });
});

describe("COMM-011: Post templates", () => {
  test("lists all four templates", () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(4);
    expect(templates.map((t) => t.id).sort()).toEqual(["adr", "incident", "rfc", "runbook"]);
  });

  test("returns runbook template content", () => {
    const tmpl = getTemplate("runbook");
    expect(tmpl).not.toBeNull();
    expect(tmpl!.content).toContain("Runbook");
    expect(tmpl!.content).toContain("Rollback");
  });
});

describe("COMM-022: Full-text search", () => {
  test("indexes and searches documents", () => {
    const wsId = newId();
    const docId = newId();
    indexDocument("thread", docId, wsId, "Authentication refactor", "We need to migrate to OAuth2");
    const results = search({ workspaceId: wsId, query: "OAuth2" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.entityId).toBe(docId);
  });
});

describe("COMM-021: Linear webhook stub", () => {
  test("ignores non-Issue events", () => {
    const result = handleLinearWebhook("ws-1", {
      action: "create",
      type: "Comment",
      data: { id: "c1" },
    });
    expect(result.ok).toBe(true);
    expect(result.action).toBe("ignored");
  });
});

describe("COMM-027: Slack bridge stub", () => {
  test("parses message events", () => {
    const mirrored = parseSlackEvent({
      type: "event_callback",
      event: {
        type: "message",
        channel: "C123",
        user: "U456",
        text: "Hello from Slack",
        ts: "1234.5678",
      },
    });
    expect(mirrored).not.toBeNull();
    expect(mirrored!.body).toBe("Hello from Slack");
  });

  test("ignores url_verification", () => {
    const mirrored = parseSlackEvent({ type: "url_verification", challenge: "abc" });
    expect(mirrored).toBeNull();
  });
});

describe("COMM-028: Stripe billing stubs", () => {
  test("creates checkout session stub", () => {
    const session = createCheckoutSession({
      workspaceId: "ws-1",
      tier: "team",
      billingPeriod: "monthly",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    });
    expect(session.stub).toBe(true);
    expect(session.url).toContain("checkout.stripe.com");
  });

  test("enforces free tier limits", () => {
    const limits = getTierLimits("free");
    const check = checkLimit("free", "maxChannels", limits.maxChannels);
    expect(check.allowed).toBe(false);
  });
});

describe("COMM-029: SAML SSO stub", () => {
  test("returns login URL", () => {
    const result = getSamlLoginUrl("org_test");
    expect(result.url).toBeDefined();
    expect(result.url.length).toBeGreaterThan(0);
  });

  test("handles stub callback", () => {
    const profile = handleSamlCallback("stub");
    expect(profile).not.toBeNull();
    expect(profile!.email).toBe("sso@better-slack.dev");
  });
});

describe("COMM-035: Slack history import", () => {
  beforeAll(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    mkdirSync(join(import.meta.dir, "../data"), { recursive: true });
    process.env.BETTER_SLACK_DB = TEST_DB;
    getDb();
  });

  afterAll(() => {
    closeDb();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test("imports Slack JSON export", () => {
    const db = getDb();
    const wsId = newId();
    const userId = newId();
    db.run("INSERT INTO workspaces (id, name, slug) VALUES (?, ?, ?)", wsId, "Import Test", "import-test");
    db.run(
      "INSERT INTO users (id, workspace_id, email, name, password_hash) VALUES (?, ?, ?, ?, ?)",
      userId,
      wsId,
      "import@test.dev",
      "Importer",
      "stub",
    );

    const result = importSlackChannel(wsId, userId, {
      channel: { id: "C001", name: "general" },
      messages: [
        { type: "message", user: "U1", text: "First message in channel", ts: "1000.0001" },
        { type: "message", user: "U2", text: "Reply in thread", ts: "1000.0002", thread_ts: "1000.0001" },
      ],
    });

    expect(result.channelsCreated).toBe(1);
    expect(result.threadsCreated).toBe(1);
    expect(result.messagesImported).toBe(2);
  });
});

describe("COMM-031: Notification digest", () => {
  test("returns null when no subscriptions", () => {
    const digest = buildUserDigest({ workspaceId: "nonexistent", userId: "nonexistent" });
    expect(digest).toBeNull();
  });
});
