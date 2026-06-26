import { gunzipSync } from "node:zlib";

export interface PackageJsonSnapshot {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  files?: string[];
}

export interface TarballSnapshot {
  files: string[];
  packageJson: PackageJsonSnapshot;
}

export interface TarballDiffChange {
  category: "files" | "scripts" | "dependencies" | "devDependencies" | "peerDependencies";
  type: "added" | "removed" | "changed";
  key: string;
  before?: string;
  after?: string;
}

export interface TarballDiffReport {
  hasPrevious: boolean;
  currentVersion?: string;
  previousVersion?: string;
  summary: {
    filesAdded: number;
    filesRemoved: number;
    scriptsAdded: number;
    scriptsRemoved: number;
    scriptsChanged: number;
    depsAdded: number;
    depsRemoved: number;
    depsChanged: number;
  };
  changes: TarballDiffChange[];
  risky: string[];
}

interface TarEntry {
  name: string;
  size: number;
  offset: number;
}

/** Parse a .tgz buffer into file listing + package.json snapshot. */
export function parseTarball(tgz: Buffer): TarballSnapshot {
  const tar = gunzipSync(tgz);
  const entries = parseTarEntries(tar);
  const files = entries.map((e) => e.name).filter((n) => n && n !== "./" && n !== ".");

  let packageJson: PackageJsonSnapshot = {};
  const pkgEntry = entries.find((e) => e.name.endsWith("package.json"));
  if (pkgEntry) {
    const raw = tar.subarray(pkgEntry.offset, pkgEntry.offset + pkgEntry.size).toString("utf-8");
    packageJson = JSON.parse(raw) as PackageJsonSnapshot;
  }

  return { files, packageJson };
}

function parseTarEntries(tar: Buffer): TarEntry[] {
  const entries: TarEntry[] = [];
  let offset = 0;

  while (offset < tar.length - 512) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;

    const name = readTarString(header, 0, 100).replace(/\/$/, "");
    const sizeOct = readTarString(header, 124, 12);
    const size = parseInt(sizeOct, 8) || 0;
    const dataOffset = offset + 512;

    if (name) {
      entries.push({ name, size, offset: dataOffset });
    }

    const padded = Math.ceil(size / 512) * 512;
    offset = dataOffset + padded;
  }

  return entries;
}

function readTarString(buf: Buffer, start: number, len: number): string {
  return buf.subarray(start, start + len).toString("utf-8").replace(/\0.*$/, "").trim();
}

export function diffTarballs(
  current: TarballSnapshot,
  previous: TarballSnapshot | null,
  options: { currentVersion?: string; previousVersion?: string } = {},
): TarballDiffReport {
  const changes: TarballDiffChange[] = [];
  const risky: string[] = [];

  if (!previous) {
    return {
      hasPrevious: false,
      currentVersion: options.currentVersion ?? current.packageJson.version,
      summary: {
        filesAdded: current.files.length,
        filesRemoved: 0,
        scriptsAdded: Object.keys(current.packageJson.scripts ?? {}).length,
        scriptsRemoved: 0,
        scriptsChanged: 0,
        depsAdded: Object.keys(current.packageJson.dependencies ?? {}).length,
        depsRemoved: 0,
        depsChanged: 0,
      },
      changes: current.files.map((f) => ({
        category: "files" as const,
        type: "added" as const,
        key: f,
      })),
      risky: flagRiskyScripts(current.packageJson.scripts ?? {}),
    };
  }

  diffRecordMaps(
    "scripts",
    previous.packageJson.scripts ?? {},
    current.packageJson.scripts ?? {},
    changes,
    risky,
  );
  diffRecordMaps(
    "dependencies",
    previous.packageJson.dependencies ?? {},
    current.packageJson.dependencies ?? {},
    changes,
  );
  diffRecordMaps(
    "devDependencies",
    previous.packageJson.devDependencies ?? {},
    current.packageJson.devDependencies ?? {},
    changes,
  );
  diffRecordMaps(
    "peerDependencies",
    previous.packageJson.peerDependencies ?? {},
    current.packageJson.peerDependencies ?? {},
    changes,
  );

  const prevFiles = new Set(previous.files);
  const currFiles = new Set(current.files);

  for (const f of current.files) {
    if (!prevFiles.has(f)) {
      changes.push({ category: "files", type: "added", key: f });
      if (/\.(sh|bash|ps1)$/i.test(f) || f.includes("preinstall") || f.includes("postinstall")) {
        risky.push(`New file: ${f}`);
      }
    }
  }
  for (const f of previous.files) {
    if (!currFiles.has(f)) {
      changes.push({ category: "files", type: "removed", key: f });
    }
  }

  const scriptChanges = changes.filter((c) => c.category === "scripts");
  const depChanges = changes.filter((c) =>
    ["dependencies", "devDependencies", "peerDependencies"].includes(c.category),
  );

  return {
    hasPrevious: true,
    currentVersion: options.currentVersion ?? current.packageJson.version,
    previousVersion: options.previousVersion,
    summary: {
      filesAdded: changes.filter((c) => c.category === "files" && c.type === "added").length,
      filesRemoved: changes.filter((c) => c.category === "files" && c.type === "removed").length,
      scriptsAdded: scriptChanges.filter((c) => c.type === "added").length,
      scriptsRemoved: scriptChanges.filter((c) => c.type === "removed").length,
      scriptsChanged: scriptChanges.filter((c) => c.type === "changed").length,
      depsAdded: depChanges.filter((c) => c.type === "added").length,
      depsRemoved: depChanges.filter((c) => c.type === "removed").length,
      depsChanged: depChanges.filter((c) => c.type === "changed").length,
    },
    changes,
    risky: [...risky, ...flagRiskyScripts(current.packageJson.scripts ?? {})],
  };
}

function diffRecordMaps(
  category: TarballDiffChange["category"],
  before: Record<string, string>,
  after: Record<string, string>,
  changes: TarballDiffChange[],
  risky: string[] = [],
): void {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    const b = before[key];
    const a = after[key];
    if (b === undefined && a !== undefined) {
      changes.push({ category, type: "added", key, after: a });
      if (category === "dependencies" && isRiskyDep(key)) {
        risky.push(`New dependency: ${key}@${a}`);
      }
    } else if (b !== undefined && a === undefined) {
      changes.push({ category, type: "removed", key, before: b });
    } else if (b !== a) {
      changes.push({ category, type: "changed", key, before: b, after: a });
    }
  }
}

const RISKY_SCRIPT_NAMES = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepublish",
  "prepublishOnly",
  "prepare",
]);

function flagRiskyScripts(scripts: Record<string, string>): string[] {
  const flags: string[] = [];
  for (const [name, cmd] of Object.entries(scripts)) {
    if (RISKY_SCRIPT_NAMES.has(name)) {
      flags.push(`Lifecycle script "${name}": ${cmd}`);
    }
    if (/curl|wget|bash\s+-c|eval\s*\(|node\s+-e/i.test(cmd)) {
      flags.push(`Suspicious script "${name}": ${cmd}`);
    }
  }
  return flags;
}

function isRiskyDep(name: string): boolean {
  return /crypto|wallet|key|token|obfus/i.test(name);
}

export function formatTarballDiffReport(report: TarballDiffReport): string {
  const lines: string[] = ["Tarball diff report", ""];

  if (!report.hasPrevious) {
    lines.push("No previous version on registry — first publish.");
    lines.push(`Files in tarball: ${report.summary.filesAdded}`);
  } else {
    lines.push(`Comparing ${report.previousVersion} → ${report.currentVersion}`);
    lines.push(
      `Files: +${report.summary.filesAdded} / -${report.summary.filesRemoved}`,
    );
    lines.push(
      `Scripts: +${report.summary.scriptsAdded} / -${report.summary.scriptsRemoved} / ~${report.summary.scriptsChanged}`,
    );
    lines.push(
      `Dependencies: +${report.summary.depsAdded} / -${report.summary.depsRemoved} / ~${report.summary.depsChanged}`,
    );
  }

  if (report.risky.length > 0) {
    lines.push("", "⚠ Risk flags:");
    for (const r of report.risky) {
      lines.push(`  • ${r}`);
    }
  }

  const notable = report.changes.filter(
    (c) => c.category !== "files" || c.type === "added",
  ).slice(0, 20);
  if (notable.length > 0 && report.hasPrevious) {
    lines.push("", "Notable changes:");
    for (const c of notable) {
      if (c.type === "added") lines.push(`  + [${c.category}] ${c.key}${c.after ? `: ${c.after}` : ""}`);
      else if (c.type === "removed") lines.push(`  - [${c.category}] ${c.key}`);
      else lines.push(`  ~ [${c.category}] ${c.key}: ${c.before} → ${c.after}`);
    }
  }

  return lines.join("\n");
}

/** Fetch previous published tarball from npm registry. */
export async function fetchPreviousTarball(
  packageName: string,
  currentVersion: string,
): Promise<{ buffer: Buffer; version: string } | null> {
  const metaUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  const res = await fetch(metaUrl);
  if (!res.ok) return null;

  const meta = (await res.json()) as {
    versions?: Record<string, { dist?: { tarball?: string } }>;
    "dist-tags"?: { latest?: string };
  };

  const versions = Object.keys(meta.versions ?? {}).filter((v) => v !== currentVersion);
  if (versions.length === 0) return null;

  const latest = meta["dist-tags"]?.latest;
  const prevVersion =
    latest && latest !== currentVersion && versions.includes(latest)
      ? latest
      : versions.sort((a, b) => (a > b ? -1 : 1))[0]!;

  const tarballUrl = meta.versions?.[prevVersion]?.dist?.tarball;
  if (!tarballUrl) return null;

  const tarRes = await fetch(tarballUrl);
  if (!tarRes.ok) return null;

  const buffer = Buffer.from(await tarRes.arrayBuffer());
  return { buffer, version: prevVersion };
}
