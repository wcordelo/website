/**
 * Reads your local .env, extracts Cloudflare Pages bindings for the contact API,
 * and runs `wrangler pages secret bulk` (does not upload other .env keys).
 *
 * Usage: bun run cf:secrets:push
 * Optional: CF_PAGES_PROJECT=my-site (or set in .env) if wrangler.toml name differs
 * Optional: bun run scripts/push-pages-secrets.ts /path/to/.env
 */
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { resolveCfPagesProject } from './cf-pages-project';

const ENV_PATH = process.argv[2] ?? join(process.cwd(), '.env');
const TMP = join(process.cwd(), '.env.cf-pages-secrets.tmp');

const OPTIONAL_KEYS = ['RESEND_FROM_EMAIL'] as const;
const REQUIRED_KEYS = ['RESEND_API_KEY', 'CONTACT_INBOX_EMAIL'] as const;
const ALL_KEYS = [...REQUIRED_KEYS, ...OPTIONAL_KEYS] as const;

function parseDotenv(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (let line of text.split('\n')) {
    line = line.replace(/^\uFEFF/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const exportPrefix = 'export ';
    if (line.startsWith(exportPrefix)) line = line.slice(exportPrefix.length).trim();
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

const file = Bun.file(ENV_PATH);
if (!(await file.exists())) {
  console.error(`Missing ${ENV_PATH}. Copy .env.example → .env and fill in values.`);
  process.exit(1);
}

const map = parseDotenv(await file.text());
const PROJECT = resolveCfPagesProject(map);
const lines: string[] = [];

for (const key of ALL_KEYS) {
  const v = map.get(key);
  if (v === undefined || v === '') {
    if ((REQUIRED_KEYS as readonly string[]).includes(key)) {
      console.error(`Missing required key ${key} in ${ENV_PATH}`);
      process.exit(1);
    }
    continue;
  }
  lines.push(`${key}=${v}`);
}

await Bun.write(TMP, `${lines.join('\n')}\n`);

const proc = Bun.spawnSync(
  ['bunx', 'wrangler', 'pages', 'secret', 'bulk', TMP, '--project-name', PROJECT],
  {
    cwd: process.cwd(),
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  },
);

try {
  unlinkSync(TMP);
} catch {
  /* ignore */
}

if (!proc.success) {
  process.exit(proc.exitCode ?? 1);
}

console.log(`Pushed ${lines.length} secret(s) to Pages project "${PROJECT}" from ${ENV_PATH}.`);
