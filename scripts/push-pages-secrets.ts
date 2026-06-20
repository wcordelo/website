/**
 * Reads your local .env, extracts contact API bindings, uploads to Cloudflare.
 *
 * Pages (Git / *.pages.dev):  bun run cf:secrets:push
 * Worker (dashboard Worker):  bun run cf:worker:secrets:push
 *
 * Optional env path: bun run scripts/push-pages-secrets.ts ./path/.env [--worker]
 */
import { unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveCfPagesProject } from './cf-pages-project';

const args = process.argv.slice(2);
const isWorker = args.includes('--worker');
const envPathArg = args.find((a) => !a.startsWith('--'));
const ENV_PATH = envPathArg ? resolve(process.cwd(), envPathArg) : join(process.cwd(), '.env');
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

const pagesProject = !isWorker ? resolveCfPagesProject(map) : '';
const wranglerArgs = isWorker
  ? ['bunx', 'wrangler', 'secret', 'bulk', TMP]
  : ['bunx', 'wrangler', 'pages', 'secret', 'bulk', TMP, '--project-name', pagesProject];

const proc = Bun.spawnSync(wranglerArgs, {
  cwd: process.cwd(),
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
});

try {
  unlinkSync(TMP);
} catch {
  /* ignore */
}

if (!proc.success) {
  process.exit(proc.exitCode ?? 1);
}

if (isWorker) {
  console.log(`Pushed ${lines.length} secret(s) to Worker from ${ENV_PATH} (see wrangler.toml name).`);
} else {
  console.log(`Pushed ${lines.length} secret(s) to Pages project "${pagesProject}" from ${ENV_PATH}.`);
}
