import { describe, expect, test, beforeEach } from "bun:test";
import { join } from "node:path";
import {
  submitFeedback,
  getFeedback,
  listFeedback,
  resolveFeedback,
  resetFeedback,
} from "../src/feedback.js";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("false positive feedback (MOB-035)", () => {
  beforeEach(() => resetFeedback());

  test("submitFeedback creates pending submission", () => {
    const sub = submitFeedback({
      findingId: "16kb-expo-modules-core",
      projectPath: FIXTURE,
      reason: "Verified on Pixel 8 with 16KB pages",
    });
    expect(sub.status).toBe("pending");
    expect(sub.id).toBeDefined();
  });

  test("listFeedback filters by project", () => {
    submitFeedback({ findingId: "a", projectPath: FIXTURE, reason: "r1" });
    submitFeedback({ findingId: "b", projectPath: "/other", reason: "r2" });
    expect(listFeedback(FIXTURE).length).toBe(1);
    expect(listFeedback().length).toBe(2);
  });

  test("resolveFeedback updates status", () => {
    const sub = submitFeedback({
      findingId: "16kb-test",
      projectPath: FIXTURE,
      reason: "False positive",
    });
    const resolved = resolveFeedback(sub.id, "accepted");
    expect(resolved?.status).toBe("accepted");
    expect(getFeedback(sub.id)?.status).toBe("accepted");
  });
});
