import { existsSync, mkdirSync } from "node:fs";
import type { OutputOptions } from "../output.js";
import { emit } from "../output.js";
import { requireGitRoot, bgitDir } from "../workspace.js";
import { ensureLayout, writeConfig, readConfig } from "../store/layout.js";
import { createMasterKey } from "../crypto/secrets.js";
import { installHooks } from "../git/hooks.js";
import { installGitFilter } from "../git/filters.js";

export async function initCommand(options: OutputOptions): Promise<void> {
  const repoRoot = requireGitRoot();
  const dir = bgitDir(repoRoot);

  if (existsSync(dir)) {
    const config = readConfig(dir);
    if (options.json) {
      emit({ initialized: false, bgit_dir: dir, config }, options);
    } else {
      console.log(`bgit already initialized at ${dir} (v${config.version})`);
    }
    return;
  }

  mkdirSync(dir, { recursive: true });
  ensureLayout(dir);
  const config = writeConfig(dir, repoRoot);
  createMasterKey(dir);
  const hooks = installHooks(repoRoot, dir);
  const filter = installGitFilter(repoRoot, dir);

  const result = {
    initialized: true,
    bgit_dir: dir,
    config,
    hooks_installed: hooks,
    filter_installed: filter.installed,
    filter_instructions: filter.instructions,
  };

  const human = [
    `bgit initialized at ${dir}`,
    `hooks: ${hooks.join(", ") || "none (already present)"}`,
    ...filter.instructions,
  ].join("\n");

  emit(result, options, human);
}
