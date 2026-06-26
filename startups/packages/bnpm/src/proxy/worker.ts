import { loadBlocklist } from "../intel/loader.js";
import { checkPackage } from "../intel/gate.js";
import type { BetterNpmrc } from "../types.js";

export interface ProxyConfig {
  upstream?: string;
  policy?: BetterNpmrc;
  blocklistPath?: string;
}

const DEFAULT_UPSTREAM = "https://registry.npmjs.org";

export interface ProxyRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Cloudflare-worker-style fetch handler for registry proxy PoC.
 * Intercepts tarball/metadata requests and blocks compromised packages.
 */
export async function handleProxyFetch(
  request: ProxyRequest,
  config: ProxyConfig = {},
): Promise<ProxyResponse> {
  const upstream = config.upstream ?? DEFAULT_UPSTREAM;
  const url = new URL(request.url, upstream);

  const blockDecision = evaluateBlockForUrl(url.pathname, config);
  if (blockDecision) {
    return {
      status: 403,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "blocked_by_bnpm",
        package: blockDecision.package,
        version: blockDecision.version,
        reason: blockDecision.reason,
        remediation: blockDecision.remediation,
      }),
    };
  }

  const target = `${upstream}${url.pathname}${url.search}`;
  const res = await fetch(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const body = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });

  return { status: res.status, headers, body };
}

function evaluateBlockForUrl(pathname: string, config: ProxyConfig) {
  const match = pathname.match(
    /^\/(@[^/]+\/[^/@]+|[^/@]+)(?:\/-\/([^/]+)-(\d+\.\d+\.\d+[^/]*)\.tgz)?$/,
  );
  if (!match) return null;

  const packageName = match[1]!;
  const versionFromTarball = match[3];

  if (!versionFromTarball) return null;

  const block = checkPackage(packageName, versionFromTarball);
  if (!block || block.action !== "block") return null;

  if (config.policy?.blocklist === "off") return null;
  if (config.policy?.blocklist === "warn") return null;

  return block;
}

/** Worker export shape for Cloudflare / edge deployment. */
export function createProxyWorker(config: ProxyConfig = {}) {
  return {
    async fetch(input: Request | string, init?: RequestInit): Promise<Response> {
      const req = typeof input === "string" ? new Request(input, init) : input;
      const result = await handleProxyFetch(
        {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
          body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
        },
        config,
      );
      return new Response(result.body, {
        status: result.status,
        headers: result.headers,
      });
    },
  };
}

export function listBlockedPackages(cwd?: string): Array<{ package: string; version?: string }> {
  const bundle = loadBlocklist(cwd);
  return bundle.entries
    .filter((e) => e.action === "block")
    .map((e) => ({ package: e.package, version: e.version ?? e.version_range }));
}
