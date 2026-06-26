import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ConfigMigration {
  from: string;
  to: string;
  description: string;
}

const SDK_MIGRATIONS: Record<number, ConfigMigration[]> = {
  50: [
    { from: "expo.android.adaptiveIcon", to: "expo.android.adaptiveIcon", description: "Verify adaptive icon config" },
    { from: "expo.plugins", to: "expo.plugins", description: "Update plugin references for SDK 50" },
  ],
  51: [
    { from: "expo.newArchEnabled", to: "expo.newArchEnabled", description: "New Architecture opt-in flag" },
  ],
  52: [
    { from: "expo.experiments", to: "expo.experiments", description: "Review experimental flags" },
    { from: "expo.android.edgeToEdgeEnabled", to: "expo.android.edgeToEdgeEnabled", description: "Edge-to-edge Android support" },
  ],
};

export function migrateAppConfig(
  projectPath: string,
  targetSdk: number,
  dryRun = true,
): { applied: string[]; pending: ConfigMigration[] } {
  const configPath = join(projectPath, "app.json");
  if (!existsSync(configPath)) {
    return { applied: [], pending: [] };
  }

  const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
    expo?: Record<string, unknown>;
  };

  const migrations = SDK_MIGRATIONS[targetSdk] ?? [];
  const applied: string[] = [];
  const pending: ConfigMigration[] = [];

  config.expo ??= {};

  if (targetSdk >= 51 && config.expo.newArchEnabled === undefined) {
    if (!dryRun) {
      config.expo.newArchEnabled = false;
    }
    applied.push("Set expo.newArchEnabled = false (opt-in for New Architecture)");
  }

  if (targetSdk >= 52 && config.expo.android === undefined) {
    if (!dryRun) {
      config.expo.android = { edgeToEdgeEnabled: true };
    }
    applied.push("Added expo.android.edgeToEdgeEnabled for SDK 52+");
  }

  for (const migration of migrations) {
    pending.push(migration);
  }

  if (!dryRun && applied.length > 0) {
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }

  return { applied, pending };
}
