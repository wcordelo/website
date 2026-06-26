import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import { whyLookup } from "../store/provenance.js";

export async function whyCommand(fileSpec: string, options: OutputOptions): Promise<void> {
  if (!fileSpec) emitError("usage: bgit why <file>[:<line>]", options);

  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);

  try {
    const result = whyLookup(bgitRoot, fileSpec);
    if (options.json) {
      emit(result, options);
    } else {
      console.log(result.chain.join("\n  → "));
    }
  } catch (e) {
    emitError(e instanceof Error ? e.message : String(e), options);
  }
}
