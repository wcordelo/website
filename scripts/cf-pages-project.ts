/**
 * Resolves the Cloudflare Pages project slug for Wrangler commands.
 * Precedence: CF_PAGES_PROJECT env → CF_PAGES_PROJECT in .env map → wrangler.toml `name`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readWranglerTomlName(cwd: string = process.cwd()): string | null {
  try {
    const text = readFileSync(join(cwd, 'wrangler.toml'), 'utf8');
    const m = text.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
    return m?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

export function resolveCfPagesProject(envFromDotenv?: Map<string, string>): string {
  const fromProcess = process.env.CF_PAGES_PROJECT?.trim();
  if (fromProcess) return fromProcess;

  const fromDotenv = envFromDotenv?.get('CF_PAGES_PROJECT')?.trim();
  if (fromDotenv) return fromDotenv;

  const fromToml = readWranglerTomlName();
  if (fromToml) return fromToml;

  console.error(
    'No Cloudflare Pages project slug found.\n' +
      'Fix one of:\n' +
      '  • Set `name = \"your-slug\"` in wrangler.toml (must match Workers & Pages → project name)\n' +
      '  • Or: CF_PAGES_PROJECT=your-slug in the shell or in .env\n' +
      '  • Or: bunx wrangler pages project list',
  );
  process.exit(1);
}

if (import.meta.main) {
  console.log(resolveCfPagesProject());
}
