import type { IgnoreProfile } from "../config.ts";
import { parseGitignore, createMatcher, type GitignoreMatcher } from "./gitignore.ts";

/**
 * SYNC-008: Built-in ignore profiles.
 */
export const PROFILE_PATTERNS: Record<IgnoreProfile, string[]> = {
  default: [
    "node_modules/",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*.swo",
    "*~",
    ".env.local",
    ".env.*.local",
    "dist/",
    "build/",
    ".next/",
    ".turbo/",
    "target/",
    "__pycache__/",
    "*.pyc",
    ".venv/",
    "venv/",
    ".idea/",
    ".vscode/",
    "*.log",
    ".devsync/",
  ],
  minimal: [
    "node_modules/",
    "dist/",
    "build/",
    ".next/",
    "target/",
    "__pycache__/",
    ".venv/",
    "venv/",
    "*.log",
    ".devsync/",
    // Binary and media
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.ico",
    "*.pdf",
    "*.zip",
    "*.tar",
    "*.gz",
    "*.wasm",
    "*.so",
    "*.dylib",
    "*.dll",
    "*.exe",
  ],
  node_regen: [
    "node_modules/",
    ".pnpm-store/",
    ".yarn/",
    ".pnp.*",
    ".devsync/",
    // Lockfiles are NOT ignored — synced for regen
  ],
};

export function profileMatcher(profile: IgnoreProfile): GitignoreMatcher {
  const patterns = PROFILE_PATTERNS[profile].join("\n");
  return createMatcher(parseGitignore(patterns));
}

export function describeProfile(profile: IgnoreProfile): string {
  switch (profile) {
    case "default":
      return "Standard dev ignores (node_modules, build artifacts, IDE files)";
    case "minimal":
      return "Source-only sync; skips binaries and media";
    case "node_regen":
      return "Sync lockfiles only; peers run install to regenerate node_modules";
  }
}
