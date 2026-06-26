export interface FunctionSpan {
  name: string;
  kind: "function" | "method" | "arrow" | "class";
  startLine: number;
  endLine: number;
  signature: string;
}

export interface SemanticChange {
  name: string;
  kind: FunctionSpan["kind"];
  change: "added" | "removed" | "modified" | "unchanged";
  before?: string;
  after?: string;
}

export interface SemanticDiffResult {
  language: "typescript" | "javascript" | "unknown";
  parser: "regex" | "tree-sitter";
  functions: SemanticChange[];
}

/** Regex-based function detection for TS/JS (v0.1). */
const FN_PATTERNS = [
  /^(export\s+)?(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)/,
  /^(export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s+)?\([^)]*\)\s*=>/,
  /^(export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s+)?function\s*\(/,
  /^(\s*)(async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/,
  /^(export\s+)?class\s+([A-Za-z_$][\w$]*)/,
];

function detectLanguage(path?: string): SemanticDiffResult["language"] {
  if (!path) return "unknown";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx") || path.endsWith(".mjs")) return "javascript";
  return "unknown";
}

function classifyLine(line: string): { kind: FunctionSpan["kind"]; name: string; signature: string } | null {
  for (const re of FN_PATTERNS) {
    const m = line.match(re);
    if (!m) continue;
    if (re.source.includes("class")) {
      return { kind: "class", name: m[2] ?? m[3] ?? "anonymous", signature: line.trim() };
    }
    const name = m[3] ?? m[2] ?? "anonymous";
    const kind: FunctionSpan["kind"] = line.includes("=>") ? "arrow" : line.trim().startsWith(" ") ? "method" : "function";
    return { kind, name, signature: line.trim() };
  }
  return null;
}

/** Extract top-level function/class spans from source using brace counting. */
export function extractFunctions(source: string, path?: string): FunctionSpan[] {
  const lines = source.split("\n");
  const spans: FunctionSpan[] = [];
  let depth = 0;
  let current: FunctionSpan | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNo = i + 1;

    if (!current) {
      const hit = classifyLine(line);
      if (hit) {
        current = { ...hit, startLine: lineNo, endLine: lineNo };
        depth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
        if (depth <= 0 && !line.includes("{")) depth = 1;
        continue;
      }
    }

    if (current) {
      current.endLine = lineNo;
      depth += (line.match(/\{/g) ?? []).length;
      depth -= (line.match(/\}/g) ?? []).length;
      if (depth <= 0) {
        spans.push(current);
        current = null;
        depth = 0;
      }
    }
  }

  if (current) spans.push(current);
  if (spans.length === 0 && detectLanguage(path) !== "unknown") {
    // tree-sitter stub — future parser hook
  }
  return spans;
}

function fnBody(source: string, span: FunctionSpan): string {
  return source.split("\n").slice(span.startLine - 1, span.endLine).join("\n");
}

export function semanticDiff(before: string, after: string, path?: string): SemanticDiffResult {
  const beforeFns = extractFunctions(before, path);
  const afterFns = extractFunctions(after, path);
  const beforeMap = new Map(beforeFns.map((f) => [f.name, f]));
  const afterMap = new Map(afterFns.map((f) => [f.name, f]));
  const names = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const functions: SemanticChange[] = [];

  for (const name of names) {
    const b = beforeMap.get(name);
    const a = afterMap.get(name);
    if (b && a) {
      const beforeBody = fnBody(before, b);
      const afterBody = fnBody(after, a);
      const same = beforeBody === afterBody;
      functions.push({
        name,
        kind: a.kind,
        change: same ? "unchanged" : "modified",
        before: beforeBody,
        after: afterBody,
      });
    } else if (a) {
      functions.push({
        name,
        kind: a.kind,
        change: "added",
        after: after.split("\n").slice(a.startLine - 1, a.endLine).join("\n"),
      });
    } else if (b) {
      functions.push({
        name,
        kind: b.kind,
        change: "removed",
        before: before.split("\n").slice(b.startLine - 1, b.endLine).join("\n"),
      });
    }
  }

  return {
    language: detectLanguage(path),
    parser: "regex",
    functions,
  };
}

/** Tree-sitter parser stub — returns null until native binding is added. */
export function parseWithTreeSitter(_source: string, _language: string): FunctionSpan[] | null {
  return null;
}
