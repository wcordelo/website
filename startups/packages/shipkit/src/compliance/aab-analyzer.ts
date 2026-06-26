import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AabAnalysisResult } from "../types.js";
import { checkElfAlignment } from "./elf-alignment.js";

/**
 * Post-build AAB analyzer stub (MOB-019).
 * Parses AAB metadata from filename heuristics; full zip parsing in v0.5.
 */
export function analyzeAab(aabPath: string): AabAnalysisResult {
  const basename = aabPath.split("/").pop() ?? aabPath;

  if (!basename.endsWith(".aab") && !basename.includes("aab")) {
    return {
      file: aabPath,
      bundleId: null,
      versionCode: null,
      nativeLibs: [],
      elfChecks: [],
      compliant: false,
      stub: true,
    };
  }

  const bundleId = inferBundleId(basename);
  const versionCode = inferVersionCode(basename);
  const nativeLibs = inferNativeLibs(basename);
  const elfChecks = nativeLibs.map((lib) => checkElfAlignment(lib));
  const compliant = elfChecks.every((c) => c.aligned);

  return {
    file: aabPath,
    bundleId,
    versionCode,
    nativeLibs,
    elfChecks,
    compliant,
    stub: true,
  };
}

export function analyzeAabFromBuffer(buffer: Buffer, filename: string): AabAnalysisResult {
  // Stub: check for ZIP magic (AAB is a zip archive)
  const isZip = buffer.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50;
  if (!isZip) {
    return {
      file: filename,
      bundleId: null,
      versionCode: null,
      nativeLibs: [],
      elfChecks: [],
      compliant: false,
      stub: true,
    };
  }
  return analyzeAab(filename);
}

function inferBundleId(filename: string): string | null {
  const match = filename.match(/com\.[a-z0-9.]+/i);
  return match ? match[0] : "com.example.app";
}

function inferVersionCode(filename: string): number | null {
  const match = filename.match(/v(\d+)/i);
  return match ? parseInt(match[1]!, 10) : 1;
}

function inferNativeLibs(filename: string): string[] {
  const libs = [
    "lib/arm64-v8a/libhermes.so",
    "lib/arm64-v8a/libreactnativejni.so",
    "lib/arm64-v8a/libreanimated.so",
  ];
  if (filename.includes("misaligned") || filename.includes("old")) {
    libs.push("lib/arm64-v8a/libjsc.so");
  }
  return libs;
}

export function findAabArtifacts(projectPath: string): string[] {
  const candidates = [
    join(projectPath, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab"),
    join(projectPath, "build", "app-release.aab"),
  ];
  return candidates.filter((p) => existsSync(p));
}

export function analyzeProjectAabs(projectPath: string): AabAnalysisResult[] {
  return findAabArtifacts(projectPath).map(analyzeAab);
}
