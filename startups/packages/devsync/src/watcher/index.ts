import { watch, type FSWatcher } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";

export type WatchEvent = "add" | "change" | "delete";

export interface WatchCallback {
  (event: WatchEvent, path: string): void;
}

export interface WatcherOptions {
  debounceMs?: number;
  recursive?: boolean;
}

/**
 * SYNC-004: Filesystem watcher with debounce.
 */
export class DebouncedWatcher {
  private watchers: FSWatcher[] = [];
  private pending = new Map<string, ReturnType<typeof setTimeout>>();
  private debounceMs: number;

  constructor(
    private rootDir: string,
    private callback: WatchCallback,
    options: WatcherOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? 300;
  }

  start(): void {
    if (!existsSync(this.rootDir)) return;
    const watcher = watch(this.rootDir, { recursive: true }, (event, filename) => {
      if (!filename) return;
      const fullPath = join(this.rootDir, filename);
      const watchEvent: WatchEvent =
        event === "rename" ? "change" : (event as WatchEvent);
      this.schedule(watchEvent, fullPath);
    });
    this.watchers.push(watcher);
  }

  private schedule(event: WatchEvent, path: string): void {
    const key = path;
    const existing = this.pending.get(key);
    if (existing) clearTimeout(existing);

    this.pending.set(
      key,
      setTimeout(() => {
        this.pending.delete(key);
        this.callback(event, path);
      }, this.debounceMs),
    );
  }

  stop(): void {
    for (const w of this.watchers) w.close();
    this.watchers = [];
    for (const timer of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }
}
