import { describe, expect, test } from "bun:test";
import {
  conflictFileName,
  buildConflictPath,
  isConflictFile,
  parseConflictPath,
} from "../src/conflict/index.ts";

describe("two-way-safe conflict naming (SYNC-013)", () => {
  const TS = 1719400000000;

  test("generates correct conflict filename", () => {
    expect(conflictFileName("app.ts", "macbook", TS)).toBe(
      "app.ts.devsync-conflict-macbook-1719400000000",
    );
  });

  test("sanitizes peer names with special characters", () => {
    expect(conflictFileName("app.ts", "peer@machine!", TS)).toBe(
      "app.ts.devsync-conflict-peer-machine--1719400000000",
    );
  });

  test("buildConflictPath preserves directory structure", () => {
    const result = buildConflictPath("src/components/App.tsx", "desktop", TS);
    expect(result.conflictPath).toBe(
      "src/components/App.tsx.devsync-conflict-desktop-1719400000000",
    );
    expect(result.originalPath).toBe("src/components/App.tsx");
    expect(result.peer).toBe("desktop");
    expect(result.timestamp).toBe(TS);
  });

  test("isConflictFile identifies conflict files", () => {
    expect(isConflictFile("app.ts.devsync-conflict-macbook-123")).toBe(true);
    expect(isConflictFile("src/foo.devsync-conflict-peer-456")).toBe(true);
    expect(isConflictFile("app.ts")).toBe(false);
    expect(isConflictFile("not-a-conflict.devsync-other-peer-1")).toBe(false);
  });

  test("parseConflictPath extracts components", () => {
    const parsed = parseConflictPath(
      "src/index.ts.devsync-conflict-laptop-1719400000000",
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.originalPath).toBe("src/index.ts");
    expect(parsed!.peer).toBe("laptop");
    expect(parsed!.timestamp).toBe(1719400000000);
  });

  test("parseConflictPath returns null for non-conflict files", () => {
    expect(parseConflictPath("regular-file.ts")).toBeNull();
    expect(parseConflictPath("")).toBeNull();
  });

  test("conflict files never collide with original extension", () => {
    const name = conflictFileName("package.json", "remote", TS);
    expect(name).toStartWith("package.json.devsync-conflict-");
    expect(name).not.toBe("package.json");
  });

  test("timestamp is unique per conflict", () => {
    const a = conflictFileName("file.ts", "peer", 1000);
    const b = conflictFileName("file.ts", "peer", 2000);
    expect(a).not.toBe(b);
  });
});
