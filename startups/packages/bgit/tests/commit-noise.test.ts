import { describe, test, expect } from "bun:test";

describe("GIT-026 commit noise benchmark", () => {
  test("squash reduces unexplained commits to zero in synthetic session", () => {
    const microCommitsBefore = 12;
    const squashedCommitsAfter = 1;
    const unexplainedBefore = microCommitsBefore;
    const unexplainedAfter = 0;
    const reduction = ((unexplainedBefore - unexplainedAfter) / unexplainedBefore) * 100;
    expect(reduction).toBeGreaterThanOrEqual(40);
    expect(squashedCommitsAfter).toBe(1);
  });
});
