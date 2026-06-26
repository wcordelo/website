import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ExpoSdkInfo } from "../types.js";
import { parsePackageJson } from "./package-json-parser.js";

const SDK_TO_EXPO: Record<number, string> = {
  49: "~49.0.0",
  50: "~50.0.0",
  51: "~51.0.0",
  52: "~52.0.0",
  53: "~53.0.0",
};

function detectFromPackageJson(projectPath: string): Partial<ExpoSdkInfo> {
  const pkg = parsePackageJson(projectPath);
  if (!pkg) return {};

  const expoVersion = pkg.allDependencies.expo;
  if (!expoVersion) return {};

  const match = expoVersion.match(/(\d+)/);
  if (!match) return { expoVersion, source: "package.json" };

  const majorMinor = match[1];
  let sdkVersion: number | null = null;

  for (const [sdk, range] of Object.entries(SDK_TO_EXPO)) {
    if (range.includes(majorMinor ?? "")) {
      sdkVersion = Number(sdk);
      break;
    }
  }

  if (!sdkVersion) {
    const num = parseInt(majorMinor ?? "0", 10);
    if (num >= 49 && num <= 53) sdkVersion = num;
  }

  return {
    sdkVersion,
    expoVersion,
    reactNativeVersion: pkg.allDependencies["react-native"] ?? null,
    source: "package.json",
  };
}

function detectFromAppConfig(projectPath: string): Partial<ExpoSdkInfo> {
  const configPaths = [
    join(projectPath, "app.json"),
    join(projectPath, "app.config.json"),
  ];

  for (const configPath of configPaths) {
    if (!existsSync(configPath)) continue;
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
        expo?: { sdkVersion?: string | number };
      };
      const sdk = config.expo?.sdkVersion;
      if (sdk) {
        const sdkVersion = typeof sdk === "number" ? sdk : parseInt(String(sdk), 10);
        return { sdkVersion: Number.isNaN(sdkVersion) ? null : sdkVersion, source: "app.config" };
      }
    } catch {
      // ignore
    }
  }

  const appConfigJs = join(projectPath, "app.config.js");
  if (existsSync(appConfigJs)) {
    const content = readFileSync(appConfigJs, "utf-8");
    const match = content.match(/sdkVersion['":\s]+(\d+)/);
    if (match?.[1]) {
      return { sdkVersion: parseInt(match[1], 10), source: "app.config" };
    }
  }

  return {};
}

export function detectExpoSdk(projectPath: string): ExpoSdkInfo {
  const fromPkg = detectFromPackageJson(projectPath);
  const fromConfig = detectFromAppConfig(projectPath);

  return {
    sdkVersion: fromPkg.sdkVersion ?? fromConfig.sdkVersion ?? null,
    expoVersion: fromPkg.expoVersion ?? null,
    reactNativeVersion: fromPkg.reactNativeVersion ?? null,
    source: fromConfig.sdkVersion ? "app.config" : fromPkg.expoVersion ? "package.json" : "unknown",
  };
}

export function getLatestSdkVersion(): number {
  return Math.max(...Object.keys(SDK_TO_EXPO).map(Number));
}
