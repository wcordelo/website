import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PRE_COMMIT = `#!/bin/sh
# bgit auto-checkpoint hook
if command -v bgit >/dev/null 2>&1; then
  bgit checkpoint --auto 2>/dev/null || true
fi
exit 0
`;

const POST_COMMIT = `#!/bin/sh
# bgit post-commit session binding
if command -v bgit >/dev/null 2>&1; then
  bgit checkpoint --bind-commit 2>/dev/null || true
fi
exit 0
`;

export function installHooks(repoRoot: string, bgitRoot: string): string[] {
  const hooksDir = join(repoRoot, ".git", "hooks");
  const templatesDir = join(bgitRoot, "hooks");
  mkdirSync(templatesDir, { recursive: true });

  const installed: string[] = [];
  const hooks: Record<string, string> = {
    "pre-commit": PRE_COMMIT,
    "post-commit": POST_COMMIT,
  };

  for (const [name, content] of Object.entries(hooks)) {
    const templatePath = join(templatesDir, name);
    writeFileSync(templatePath, content, "utf8");

    const hookPath = join(hooksDir, name);
    if (!existsSync(hookPath)) {
      writeFileSync(hookPath, content, "utf8");
      chmodSync(hookPath, 0o755);
      installed.push(name);
    } else {
      const existing = readFileSync(hookPath, "utf8");
      if (!existing.includes("bgit")) {
        writeFileSync(hookPath, existing + "\n" + content, "utf8");
        installed.push(name);
      }
    }
  }
  return installed;
}
