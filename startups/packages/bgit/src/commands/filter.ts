import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { cleanFilter, smudgeFilter, createBgitFilterContext } from "../git/filters.js";
import { bgitDir } from "../workspace.js";

export async function filterCommand(mode: string, repoRoot?: string): Promise<void> {
  const root = repoRoot ?? process.cwd();
  const bgitRoot = bgitDir(root);
  const input = readFileSync(0, "utf8");
  const ctx = createBgitFilterContext(bgitRoot);
  const out = mode === "clean" ? cleanFilter(input, ctx) : smudgeFilter(input, ctx);
  process.stdout.write(out);
}

export function parseFilterArgs(argv: string[]): { mode: string; repo?: string } {
  const { values } = parseArgs({
    args: argv,
    options: { repo: { type: "string" } },
    allowPositionals: true,
  });
  const mode = argv.find((a) => a === "clean" || a === "smudge") ?? "smudge";
  return { mode, repo: values.repo };
}
