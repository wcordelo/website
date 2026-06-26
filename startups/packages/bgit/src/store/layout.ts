import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BgitConfig } from "../types.js";

export const BGIT_VERSION = "0.1.0";

export const LAYOUT = {
  config: "config.yaml",
  masterKey: "master.key",
  sessions: "sessions",
  secrets: "secrets",
  index: "index.json",
  hooks: "hooks",
} as const;

export function ensureLayout(bgitRoot: string): void {
  mkdirSync(join(bgitRoot, LAYOUT.sessions), { recursive: true });
  mkdirSync(join(bgitRoot, LAYOUT.secrets), { recursive: true });
  mkdirSync(join(bgitRoot, LAYOUT.hooks), { recursive: true });
}

export function writeConfig(bgitRoot: string, repoRoot: string): BgitConfig {
  const config: BgitConfig = {
    version: BGIT_VERSION,
    created_at: new Date().toISOString(),
    repo_root: repoRoot,
  };
  const yaml = [
    `version: ${config.version}`,
    `created_at: ${config.created_at}`,
    `repo_root: ${config.repo_root}`,
  ].join("\n");
  writeFileSync(join(bgitRoot, LAYOUT.config), yaml + "\n", "utf8");
  return config;
}

export function readConfig(bgitRoot: string): BgitConfig {
  const raw = readFileSync(join(bgitRoot, LAYOUT.config), "utf8");
  const lines = Object.fromEntries(
    raw.split("\n").filter(Boolean).map((l) => {
      const [k, ...rest] = l.split(": ");
      return [k, rest.join(": ")];
    }),
  );
  return {
    version: lines.version ?? BGIT_VERSION,
    created_at: lines.created_at ?? "",
    repo_root: lines.repo_root ?? "",
  };
}

export interface IndexEntry {
  sessions: Record<string, { path: string; status: string }>;
  file_index: Record<string, Array<{ session_id: string; checkpoint_id: string; lines?: number[] }>>;
  commit_index: Record<string, string>;
}

export function readIndex(bgitRoot: string): IndexEntry {
  const path = join(bgitRoot, LAYOUT.index);
  if (!existsSync(path)) {
    return { sessions: {}, file_index: {}, commit_index: {} };
  }
  return JSON.parse(readFileSync(path, "utf8")) as IndexEntry;
}

export function writeIndex(bgitRoot: string, index: IndexEntry): void {
  writeFileSync(join(bgitRoot, LAYOUT.index), JSON.stringify(index, null, 2) + "\n", "utf8");
}

export function sessionDir(bgitRoot: string, sessionId: string): string {
  return join(bgitRoot, LAYOUT.sessions, sessionId);
}
