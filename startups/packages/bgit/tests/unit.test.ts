import { describe, test, expect } from "bun:test";
import { encrypt, decrypt, wrapKey, unwrapKey, generateDataKey, encryptString, decryptString } from "../src/crypto/aes.js";
import { redact } from "../src/capture/redaction.js";
import { parseClaudeLog } from "../src/capture/claude.js";

describe("crypto", () => {
  test("AES-256-GCM roundtrip", () => {
    const key = generateDataKey();
    const plaintext = Buffer.from("hello secret");
    const blob = encrypt(plaintext, key);
    const recovered = decrypt(blob, key);
    expect(recovered.toString()).toBe("hello secret");
  });

  test("key wrap roundtrip", () => {
    const master = generateDataKey();
    const dataKey = generateDataKey();
    const wrapped = wrapKey(dataKey, master);
    const unwrapped = unwrapKey(wrapped, master);
    expect(unwrapped.equals(dataKey)).toBe(true);
  });

  test("string encrypt roundtrip", () => {
    const key = generateDataKey();
    const blob = encryptString("token123", key);
    expect(decryptString(blob, key)).toBe("token123");
  });
});

describe("redaction", () => {
  test("redacts API keys", () => {
    const input = "key=sk-abcdefghijklmnopqrstuvwxyz12345";
    const out = redact(input);
    expect(out).toContain("[REDACTED:");
    expect(out).not.toContain("sk-abcdefghijklmnopqrstuvwxyz12345");
  });

  test("redacts JWT", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const out = redact(`token ${jwt}`);
    expect(out).toContain("[REDACTED:jwt:");
  });
});

describe("claude log parser", () => {
  test("parses tool_use line", () => {
    const line = JSON.stringify({
      type: "tool_use",
      tool_name: "Read",
      tool_input: { path: "/etc/passwd" },
      timestamp: "2026-06-01T10:00:00Z",
    });
    const events = parseClaudeLog(line);
    expect(events.length).toBe(1);
    expect(events[0]!.type).toBe("tool_call");
  });
});
