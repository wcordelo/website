import { readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

export interface GitignoreRule {
  pattern: string;
  negated: boolean;
  /** Anchored to directory containing .gitignore */
  anchored: boolean;
  /** Only matches directories */
  directoryOnly: boolean;
}

export interface GitignoreMatcher {
  rules: GitignoreRule[];
  isIgnored(relativePath: string, isDirectory?: boolean): boolean;
}

/**
 * Parse a .gitignore file into rules (gitignore-spec subset).
 * Supports: comments, blank lines, ! negation, / anchoring, ** globs, trailing /.
 */
export function parseGitignore(content: string): GitignoreRule[] {
  const rules: GitignoreRule[] = [];

  for (const rawLine of content.split("\n")) {
    let line = rawLine.trimEnd();
    if (!line || line.startsWith("#")) continue;

    let negated = false;
    if (line.startsWith("!")) {
      negated = true;
      line = line.slice(1);
    }
    if (!line) continue;

    let directoryOnly = false;
    if (line.endsWith("/")) {
      directoryOnly = true;
      line = line.slice(0, -1);
    }
    if (!line) continue;

    const anchored = line.startsWith("/");
    if (anchored) line = line.slice(1);

    rules.push({ pattern: line, negated, anchored, directoryOnly });
  }

  return rules;
}

export function loadGitignoreFile(filePath: string): GitignoreRule[] {
  if (!existsSync(filePath)) return [];
  return parseGitignore(readFileSync(filePath, "utf8"));
}

/**
 * Build a matcher from rules. Last matching rule wins (gitignore semantics).
 */
export function createMatcher(rules: GitignoreRule[]): GitignoreMatcher {
  return {
    rules,
    isIgnored(relativePath: string, isDirectory = false): boolean {
      const normalized = normalizePath(relativePath);
      let ignored = false;

      for (const rule of rules) {
        if (rule.directoryOnly && !isDirectory) {
          // Directory rules also apply to descendants
          if (!isUnderDirectory(normalized, rule.pattern) && !matchesRule(normalized, rule)) {
            continue;
          }
        } else if (rule.directoryOnly && isDirectory) {
          if (!matchesRule(normalized, rule)) continue;
        } else if (!matchesRule(normalized, rule)) {
          continue;
        }
        ignored = !rule.negated;
      }

      return ignored;
    },
  };
}

/**
 * Collect .gitignore rules walking from root to file's directory.
 */
export function loadGitignoreChain(rootDir: string, filePath: string): GitignoreMatcher {
  const rel = relative(rootDir, filePath);
  const parts = rel.split(sep).filter(Boolean);
  const allRules: GitignoreRule[] = [];

  // Root .gitignore
  const rootIgnore = loadGitignoreFile(join(rootDir, ".gitignore"));
  allRules.push(...rootIgnore);

  // Ancestor .gitignore files
  let current = rootDir;
  for (let i = 0; i < parts.length - 1; i++) {
    current = join(current, parts[i]!);
    const ignorePath = join(current, ".gitignore");
    const rules = loadGitignoreFile(ignorePath);
    allRules.push(...rules);
  }

  return createMatcher(allRules);
}

function normalizePath(p: string): string {
  return p.split(sep).join("/");
}

function isUnderDirectory(path: string, dirPattern: string): boolean {
  return path === dirPattern || path.startsWith(`${dirPattern}/`);
}

function matchesRule(path: string, rule: GitignoreRule): boolean {
  const pattern = rule.pattern;

  if (rule.anchored) {
    if (matchGlob(path, pattern)) return true;
    if (matchGlob(path, `${pattern}/*`) || matchGlob(path, `${pattern}/**`)) return true;
    // Anchored: allow matching path prefix (dist/foo but not src/dist/foo)
    if (path.startsWith(`${pattern}/`)) return true;
    return false;
  }

  // Unanchored: match anywhere in path
  const basename = path.split("/").pop() ?? path;
  if (matchGlob(basename, pattern)) return true;
  if (matchGlob(path, pattern)) return true;
  if (matchGlob(path, `**/${pattern}`)) return true;

  // Directory-only: also match all descendants
  if (rule.directoryOnly) {
    if (path === pattern || path.startsWith(`${pattern}/`)) return true;
    if (path.includes(`/${pattern}/`) || path.endsWith(`/${pattern}`)) return true;
  }

  return false;
}

function matchGlob(text: string, pattern: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(text);
}

function globToRegex(glob: string): RegExp {
  let regex = "^";
  let i = 0;

  while (i < glob.length) {
    const ch = glob[i]!;

    if (ch === "*") {
      if (glob[i + 1] === "*") {
        regex += ".*";
        i += 2;
        if (glob[i] === "/") i++;
      } else {
        regex += "[^/]*";
        i++;
      }
    } else if (ch === "?") {
      regex += "[^/]";
      i++;
    } else if (ch === "[") {
      const end = glob.indexOf("]", i);
      if (end !== -1) {
        regex += glob.slice(i, end + 1);
        i = end + 1;
      } else {
        regex += "\\[";
        i++;
      }
    } else if (".+^${}()|[]\\".includes(ch)) {
      regex += `\\${ch}`;
      i++;
    } else {
      regex += ch;
      i++;
    }
  }

  regex += "$";
  return new RegExp(regex);
}
