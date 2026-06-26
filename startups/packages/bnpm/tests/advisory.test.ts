import { describe, expect, test } from "bun:test";
import { generateAdvisory } from "../src/advisory/generator.js";

describe("advisory generator", () => {
  test("generates markdown and JSON advisory draft", () => {
    const out = generateAdvisory({
      packageName: "axios",
      affectedVersions: "1.14.1, 0.30.4",
      patchedVersions: "1.14.0, 0.30.3",
      summary: "Malicious versions published via compromised maintainer account",
      description: "Injected plain-crypto-js dependency with postinstall RAT.",
      severity: "critical",
      iocs: ["plain-crypto-js@4.2.1"],
      references: ["https://github.com/advisories/GHSA-fw8c-xr5c-95f9"],
    });

    expect(out.markdown).toContain("axios");
    expect(out.markdown).toContain("plain-crypto-js");
    expect((out.json as { severity: unknown[] }).severity).toBeDefined();
  });
});
