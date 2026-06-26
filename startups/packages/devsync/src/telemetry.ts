import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { configDir } from "./config.ts";

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  properties?: Record<string, string | number | boolean>;
}

export interface TelemetryConfig {
  enabled: boolean;
  anonymousId: string;
  optedInAt: string | null;
}

const TELEMETRY_PATH = () => join(configDir(), "telemetry.json");
const EVENTS_PATH = () => join(configDir(), "telemetry-events.jsonl");

/**
 * SYNC-028: Opt-in anonymous telemetry.
 * No file paths, content, or PII — aggregate usage metrics only.
 */
export class Telemetry {
  private config: TelemetryConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  anonymousId(): string {
    return this.config.anonymousId;
  }

  optIn(): void {
    this.config.enabled = true;
    this.config.optedInAt = new Date().toISOString();
    this.saveConfig();
  }

  optOut(): void {
    this.config.enabled = false;
    this.clearEvents();
    this.saveConfig();
  }

  track(name: string, properties?: Record<string, string | number | boolean>): void {
    if (!this.config.enabled) return;

    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      properties: {
        ...properties,
        anonymous_id: this.config.anonymousId,
      },
    };

    this.appendEvent(event);
  }

  /** Flush buffered events (MVP: read local file; production: POST to collector). */
  flush(): TelemetryEvent[] {
    if (!existsSync(EVENTS_PATH())) return [];
    const lines = readFileSync(EVENTS_PATH(), "utf8").trim().split("\n").filter(Boolean);
    return lines.map((line) => JSON.parse(line) as TelemetryEvent);
  }

  clearEvents(): void {
    if (existsSync(EVENTS_PATH())) {
      writeFileSync(EVENTS_PATH(), "", "utf8");
    }
  }

  private appendEvent(event: TelemetryEvent): void {
    const dir = configDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(EVENTS_PATH(), JSON.stringify(event) + "\n", { flag: "a" });
  }

  private loadConfig(): TelemetryConfig {
    const path = TELEMETRY_PATH();
    if (!existsSync(path)) {
      return {
        enabled: false,
        anonymousId: crypto.randomUUID(),
        optedInAt: null,
      };
    }
    return JSON.parse(readFileSync(path, "utf8")) as TelemetryConfig;
  }

  private saveConfig(): void {
    const dir = configDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(TELEMETRY_PATH(), JSON.stringify(this.config, null, 2), "utf8");
  }
}

let defaultTelemetry: Telemetry | null = null;

export function getTelemetry(): Telemetry {
  if (!defaultTelemetry) defaultTelemetry = new Telemetry();
  return defaultTelemetry;
}
