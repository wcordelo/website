import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  validatePrivacyManifest,
  parsePrivacyManifestContent,
} from "../src/preflight/privacy-manifest.js";

const FIXTURE = join(import.meta.dir, "fixtures", "sample-expo-app");

describe("privacy manifest validator (MOB-023)", () => {
  test("flags missing privacy manifest on fixture", () => {
    const result = validatePrivacyManifest(FIXTURE);
    expect(result.exists).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "privacy-manifest-required")).toBe(true);
  });

  test("validates manifest with required keys", () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyAccessedAPITypes</key>
  <array/>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
</dict>
</plist>`;
    const keys = parsePrivacyManifestContent(content);
    expect(keys.NSPrivacyAccessedAPITypes).toBe(true);
    expect(keys.NSPrivacyTracking).toBe(true);
  });
});
