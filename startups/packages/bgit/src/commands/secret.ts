import type { OutputOptions } from "../output.js";
import { emit, emitError } from "../output.js";
import { requireGitRoot, requireBgit } from "../workspace.js";
import { setSecret, getSecret, listSecrets } from "../crypto/secrets.js";

export async function secretSetCommand(name: string, value: string | undefined, options: OutputOptions): Promise<void> {
  if (!name) emitError("usage: bgit secret set NAME [value]", options);

  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);

  const secretValue = value ?? process.env.BGIT_SECRET_VALUE;
  if (!secretValue) emitError("provide value as argument or BGIT_SECRET_VALUE env", options);

  const meta = setSecret(bgitRoot, name, secretValue);
  emit({ name: meta.name, updated_at: meta.updated_at }, options, `secret set: ${name}`);
}

export async function secretGetCommand(name: string, options: OutputOptions): Promise<void> {
  if (!name) emitError("usage: bgit secret get NAME", options);

  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);

  try {
    const value = getSecret(bgitRoot, name);
    if (options.json) {
      emit({ name, value }, options);
    } else {
      console.log(value);
    }
  } catch (e) {
    emitError(e instanceof Error ? e.message : String(e), options);
  }
}

export async function secretListCommand(options: OutputOptions): Promise<void> {
  const repoRoot = requireGitRoot();
  const bgitRoot = requireBgit(repoRoot);
  const names = listSecrets(bgitRoot);
  emit({ secrets: names }, options, names.join("\n") || "(no secrets)");
}
