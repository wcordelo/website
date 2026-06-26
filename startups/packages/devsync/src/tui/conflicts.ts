import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  isConflictFile,
  parseConflictPath,
  type ConflictPath,
} from "../conflict/index.ts";

export type ConflictResolution = "keep_local" | "keep_remote" | "keep_both" | "skip";

export interface ConflictEntry {
  conflictPath: string;
  originalPath: string;
  peer: string;
  timestamp: number;
  size: number;
}

export interface ConflictReviewResult {
  resolved: number;
  skipped: number;
  actions: { path: string; resolution: ConflictResolution }[];
}

/**
 * SYNC-023: Terminal conflict resolver TUI (non-interactive API + summary renderer).
 * Interactive TUI uses readline prompts; tests use programmatic resolve API.
 */
export class ConflictResolver {
  constructor(private rootPath: string) {}

  listConflicts(): ConflictEntry[] {
    const entries: ConflictEntry[] = [];
    const walk = (dir: string): void => {
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const rel = full.slice(this.rootPath.length + 1);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
          continue;
        }
        if (!isConflictFile(rel)) continue;
        const parsed = parseConflictPath(rel);
        if (!parsed) continue;
        entries.push({
          conflictPath: rel,
          originalPath: parsed.originalPath,
          peer: parsed.peer,
          timestamp: parsed.timestamp,
          size: stat.size,
        });
      }
    };
    walk(this.rootPath);
    return entries.sort((a, b) => a.conflictPath.localeCompare(b.conflictPath));
  }

  resolve(
    conflictPath: string,
    resolution: ConflictResolution,
    remoteContent?: Uint8Array,
  ): ConflictPath | null {
    const rel = conflictPath.startsWith(this.rootPath)
      ? conflictPath.slice(this.rootPath.length + 1)
      : conflictPath;

    if (!isConflictFile(rel)) return null;
    const parsed = parseConflictPath(rel);
    if (!parsed) return null;

    const conflictFull = join(this.rootPath, rel);
    const originalFull = join(this.rootPath, parsed.originalPath);

    switch (resolution) {
      case "keep_local":
        // Conflict file is the local copy; original stays as-is or gets conflict content
        break;
      case "keep_remote":
        if (remoteContent) {
          Bun.write(originalFull, remoteContent);
        }
        break;
      case "keep_both":
        // Both files remain; no action
        break;
      case "skip":
        return null;
    }

    if (resolution !== "keep_both") {
      const content = readFileSync(conflictFull);
      if (resolution === "keep_local") {
        Bun.write(originalFull, content);
      }
    }

    return {
      originalPath: parsed.originalPath,
      conflictPath: rel,
      peer: parsed.peer,
      timestamp: parsed.timestamp,
    };
  }

  resolveAll(
    decisions: Record<string, ConflictResolution>,
    remoteContents?: Record<string, Uint8Array>,
  ): ConflictReviewResult {
    const result: ConflictReviewResult = { resolved: 0, skipped: 0, actions: [] };
    for (const [path, resolution] of Object.entries(decisions)) {
      const remote = remoteContents?.[path];
      const outcome = this.resolve(path, resolution, remote);
      result.actions.push({ path, resolution });
      if (outcome) result.resolved++;
      else result.skipped++;
    }
    return result;
  }

  /** Render conflict list for terminal display. */
  formatSummary(): string {
    const conflicts = this.listConflicts();
    if (conflicts.length === 0) {
      return "No conflicts found.";
    }

    const lines = [
      `DevSync Conflicts (${conflicts.length})`,
      "─".repeat(50),
    ];

    for (const c of conflicts) {
      lines.push(
        `  ${c.conflictPath}`,
        `    original: ${c.originalPath}`,
        `    peer:     ${c.peer}`,
        `    size:     ${c.size} bytes`,
        "",
      );
    }

    lines.push("Resolve with: devsync conflicts resolve <path> --keep local|remote|both");
    return lines.join("\n");
  }
}
