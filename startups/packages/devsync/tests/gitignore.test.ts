import { describe, expect, test } from "bun:test";
import { parseGitignore, createMatcher } from "../src/ignore/gitignore.ts";

describe("gitignore parser (SYNC-006)", () => {
  test("ignores comments and blank lines", () => {
    const rules = parseGitignore(`
# comment
*.log

# another comment
`);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.pattern).toBe("*.log");
  });

  test("parses negation rules", () => {
    const rules = parseGitignore("*.log\n!important.log");
    expect(rules[1]!.negated).toBe(true);
    expect(rules[1]!.pattern).toBe("important.log");
  });

  test("parses anchored patterns", () => {
    const rules = parseGitignore("/build");
    expect(rules[0]!.anchored).toBe(true);
  });

  test("parses directory-only patterns", () => {
    const rules = parseGitignore("node_modules/");
    expect(rules[0]!.directoryOnly).toBe(true);
    expect(rules[0]!.pattern).toBe("node_modules");
  });

  test("matches wildcard extensions", () => {
    const matcher = createMatcher(parseGitignore("*.log"));
    expect(matcher.isIgnored("debug.log")).toBe(true);
    expect(matcher.isIgnored("src/index.ts")).toBe(false);
  });

  test("matches directory patterns", () => {
    const matcher = createMatcher(parseGitignore("node_modules/"));
    expect(matcher.isIgnored("node_modules", true)).toBe(true);
    expect(matcher.isIgnored("node_modules/pkg")).toBe(true);
    expect(matcher.isIgnored("node_modules/pkg/index.js")).toBe(true);
    expect(matcher.isIgnored("src/node_modules")).toBe(true);
    expect(matcher.isIgnored("src/index.ts")).toBe(false);
  });

  test("anchored patterns match from root only", () => {
    const matcher = createMatcher(parseGitignore("/dist"));
    expect(matcher.isIgnored("dist")).toBe(true);
    expect(matcher.isIgnored("src/dist")).toBe(false);
  });

  test("negation un-ignores files", () => {
    const matcher = createMatcher(parseGitignore("*.log\n!important.log"));
    expect(matcher.isIgnored("debug.log")).toBe(true);
    expect(matcher.isIgnored("important.log")).toBe(false);
  });

  test("last match wins", () => {
    const matcher = createMatcher(parseGitignore("*.ts\n!important.ts"));
    expect(matcher.isIgnored("important.ts")).toBe(false);
    expect(matcher.isIgnored("other.ts")).toBe(true);
  });

  test("double-star glob matches nested paths", () => {
    const matcher = createMatcher(parseGitignore("**/target"));
    expect(matcher.isIgnored("rust/target")).toBe(true);
    expect(matcher.isIgnored("deep/nested/target")).toBe(true);
  });

  test("corpus: typical Node project ignores", () => {
    const content = `
node_modules/
dist/
.env.local
*.log
.DS_Store
`;
    const matcher = createMatcher(parseGitignore(content));
    expect(matcher.isIgnored("node_modules", true)).toBe(true);
    expect(matcher.isIgnored("dist/bundle.js")).toBe(true);
    expect(matcher.isIgnored(".env.local")).toBe(true);
    expect(matcher.isIgnored("app.log")).toBe(true);
    expect(matcher.isIgnored("src/index.ts")).toBe(false);
  });
});
