import type { DependencyGraph, PackageNode } from "../types.js";
import { parsePackageJson, parseLockfileVersions } from "./package-json-parser.js";

const NATIVE_MODULE_PATTERNS = [
  /^react-native-/,
  /^@react-native-/,
  /^expo-/,
  /^@expo\//,
  /-native$/,
  /^react-native$/,
  /^expo$/,
];

const NATIVE_MODULE_NAMES = new Set([
  "react-native",
  "expo",
  "react-native-reanimated",
  "react-native-screens",
  "react-native-gesture-handler",
  "react-native-safe-area-context",
  "@react-native-async-storage/async-storage",
  "react-native-maps",
  "react-native-svg",
  "react-native-webview",
  "expo-camera",
  "expo-location",
  "expo-notifications",
  "expo-file-system",
  "expo-av",
  "expo-image-picker",
  "expo-secure-store",
  "expo-sqlite",
  "expo-updates",
  "expo-dev-client",
  "expo-modules-core",
  "@sentry/react-native",
  "react-native-firebase",
  "@react-native-firebase/app",
]);

function isNativeModule(name: string): boolean {
  if (NATIVE_MODULE_NAMES.has(name)) return true;
  return NATIVE_MODULE_PATTERNS.some((pattern) => pattern.test(name));
}

function resolveVersion(
  name: string,
  range: string,
  lockVersions: Record<string, string>,
): string {
  return lockVersions[name] ?? range.replace(/^[\^~>=<]*/, "");
}

export function buildDependencyGraph(projectPath: string): DependencyGraph {
  const pkg = parsePackageJson(projectPath);
  const lockVersions = parseLockfileVersions(projectPath);

  if (!pkg) {
    return { root: "unknown", nodes: {}, nativeModules: [] };
  }

  const nodes: Record<string, PackageNode> = {};
  const nativeModules: string[] = [];

  for (const [name, range] of Object.entries(pkg.allDependencies)) {
    const version = resolveVersion(name, range, lockVersions);
    const native = isNativeModule(name);
    const node: PackageNode = {
      name,
      version,
      isNative: native,
      dependencies: [],
    };
    nodes[name] = node;
    if (native) nativeModules.push(name);
  }

  return {
    root: pkg.name,
    nodes,
    nativeModules,
  };
}
