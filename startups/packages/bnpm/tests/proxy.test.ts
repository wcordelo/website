import { describe, expect, test } from "bun:test";
import { handleProxyFetch, listBlockedPackages } from "../src/proxy/worker.js";

describe("registry proxy", () => {
  test("blocks compromised tarball requests", async () => {
    const result = await handleProxyFetch({
      method: "GET",
      url: "https://registry.npmjs.org/axios/-/axios-1.14.1.tgz",
    });

    expect(result.status).toBe(403);
    const body = JSON.parse(result.body) as { error: string; package: string };
    expect(body.error).toBe("blocked_by_bnpm");
    expect(body.package).toBe("axios");
  });

  test("allows non-blocked metadata paths without fetch when no version", async () => {
    const result = await handleProxyFetch({
      method: "GET",
      url: "https://registry.npmjs.org/lodash",
    });
    expect(result.status).not.toBe(403);
  });

  test("listBlockedPackages returns block entries", () => {
    const blocked = listBlockedPackages();
    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked.some((b) => b.package === "axios")).toBe(true);
  });

  test("respects warn policy mode", async () => {
    const result = await handleProxyFetch(
      {
        method: "GET",
        url: "https://registry.npmjs.org/axios/-/axios-1.14.1.tgz",
      },
      { policy: { blocklist: "warn" } },
    );
    expect(result.status).not.toBe(403);
  });
});
