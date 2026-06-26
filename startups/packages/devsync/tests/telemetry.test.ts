import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Telemetry } from "../src/telemetry.ts";

describe("telemetry opt-in (SYNC-028)", () => {
  let telemetryDir: string;
  const originalHome = process.env.HOME;

  beforeEach(() => {
    telemetryDir = join(tmpdir(), `devsync-telemetry-${Date.now()}`);
    mkdirSync(telemetryDir, { recursive: true });
    process.env.HOME = telemetryDir;
    new Telemetry().clearEvents();
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    rmSync(telemetryDir, { recursive: true, force: true });
  });

  test("disabled by default", () => {
    const telemetry = new Telemetry();
    expect(telemetry.isEnabled()).toBe(false);
    telemetry.track("sync_root_added", { count: 1 });
    expect(telemetry.flush()).toHaveLength(0);
  });

  test("opt-in enables tracking", () => {
    const telemetry = new Telemetry();
    telemetry.optIn();
    expect(telemetry.isEnabled()).toBe(true);

    telemetry.track("pairing_completed");
    const events = telemetry.flush();
    expect(events.length).toBe(1);
    expect(events[0]!.name).toBe("pairing_completed");
    expect(events[0]!.properties?.anonymous_id).toBeTruthy();
  });

  test("opt-out stops tracking", () => {
    const telemetry = new Telemetry();
    telemetry.optIn();
    telemetry.optOut();
    telemetry.track("should_not_record");
    expect(telemetry.flush()).toHaveLength(0);
  });
});
