import { describe, expect, test } from "bun:test";
import { blake3Hash, chunkFileContent } from "../src/sync/chunking.ts";
import { profileMatcher, PROFILE_PATTERNS } from "../src/ignore/profiles.ts";
import {
  wordsToCode,
  parseCode,
  isValidCodeFormat,
  generateWords,
} from "../src/pairing/code.ts";

describe("chunking (SYNC-005)", () => {
  test("blake3Hash produces hex digest", () => {
    const hash = blake3Hash("hello");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(blake3Hash("hello")).toBe(hash);
  });

  test("chunkFileContent returns chunks and file hash", () => {
    const content = "x".repeat(100_000);
    const result = chunkFileContent(content);
    expect(result.totalSize).toBe(100_000);
    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.fileHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("profiles (SYNC-008)", () => {
  test("default profile ignores node_modules", () => {
    const matcher = profileMatcher("default");
    expect(matcher.isIgnored("node_modules", true)).toBe(true);
    expect(matcher.isIgnored("src/index.ts")).toBe(false);
  });

  test("minimal profile ignores binaries", () => {
    const matcher = profileMatcher("minimal");
    expect(matcher.isIgnored("image.png")).toBe(true);
    expect(matcher.isIgnored("src/main.ts")).toBe(false);
  });

  test("node_regen profile ignores node_modules but not lockfiles", () => {
    const matcher = profileMatcher("node_regen");
    expect(matcher.isIgnored("node_modules", true)).toBe(true);
    expect(matcher.isIgnored("package-lock.json")).toBe(false);
    expect(matcher.isIgnored("pnpm-lock.yaml")).toBe(false);
  });

  test("all profiles defined", () => {
    expect(Object.keys(PROFILE_PATTERNS)).toEqual(
      expect.arrayContaining(["default", "minimal", "node_regen"]),
    );
  });
});

describe("pairing (SYNC-011)", () => {
  test("generates 6 words", () => {
    const words = generateWords(6);
    expect(words).toHaveLength(6);
  });

  test("wordsToCode and parseCode roundtrip", () => {
    const words = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];
    const code = wordsToCode(words);
    expect(code).toBe("alpha-bravo-charlie-delta-echo-foxtrot");
    expect(parseCode(code)).toEqual(words);
  });

  test("isValidCodeFormat validates 6-word codes", () => {
    expect(isValidCodeFormat("alpha-bravo-charlie-delta-echo-foxtrot")).toBe(true);
    expect(isValidCodeFormat("alpha-bravo")).toBe(false);
    expect(isValidCodeFormat("foo-bar-baz-qux-quux-corge")).toBe(false);
  });
});
