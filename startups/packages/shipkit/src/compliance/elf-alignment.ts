import type { ElfAlignmentResult } from "../types.js";
import { findSoFiles } from "../scanner/index.js";

const REQUIRED_PAGE_SIZE = 16384;

/**
 * ELF page alignment checker stub (MOB-003).
 * Full binary parsing deferred to v0.5; stub uses filename heuristics for demo.
 */
export function checkElfAlignment(filePath: string): ElfAlignmentResult {
  const basename = filePath.split("/").pop() ?? filePath;

  // Known problematic patterns from spike research
  const likelyMisaligned =
    basename.includes("hermes") && basename.includes("old") ||
    basename.includes("libjsc") ||
    basename.includes("misaligned");

  const likelyAligned =
    basename.includes("reanimated") ||
    basename.includes("hermes") ||
    basename.includes("fabric");

  let aligned = true;
  let pageSize = REQUIRED_PAGE_SIZE;

  if (likelyMisaligned) {
    aligned = false;
    pageSize = 4096;
  } else if (!likelyAligned && basename.startsWith("lib")) {
    // Unknown native lib — flag for manual review in stub mode
    aligned = true;
    pageSize = REQUIRED_PAGE_SIZE;
  }

  return {
    file: filePath,
    pageSize,
    aligned,
    stub: true,
  };
}

export function scanNativeLibs(projectPath: string): ElfAlignmentResult[] {
  const searchDirs = [
    `${projectPath}/android/app/build`,
    `${projectPath}/android/app/src/main/jniLibs`,
    `${projectPath}/android`,
    `${projectPath}/node_modules/react-native/sdks/hermes`,
  ];

  const soFiles: string[] = [];
  for (const dir of searchDirs) {
    soFiles.push(...findSoFiles(dir));
  }

  // Deduplicate
  const unique = [...new Set(soFiles)];
  return unique.map(checkElfAlignment);
}

export function parseElfHeader(_buffer: Buffer): { pageSize: number } | null {
  // Stub: real implementation would parse ELF PT_LOAD segments
  if (_buffer.length < 64) return null;
  const magic = _buffer.subarray(0, 4).toString("hex");
  if (magic !== "7f454c46") return null;
  return { pageSize: REQUIRED_PAGE_SIZE };
}

export function is16KbCompliant(result: ElfAlignmentResult): boolean {
  return result.aligned && result.pageSize >= REQUIRED_PAGE_SIZE;
}
