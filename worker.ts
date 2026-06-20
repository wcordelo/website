/**
 * Standalone Cloudflare Worker: static assets from ./dist + POST /api/contact.
 * Deploy: bun run cf:worker:deploy  (default wrangler.toml)
 */
import type { ContactEnv } from './server/contact-handler';
import { handleContactRequest } from './server/contact-handler';

export type Env = ContactEnv & {
  ASSETS: { fetch(input: Request | URL | string, init?: RequestInit): Promise<Response> };
};

/** Vite fingerprinted chunks — safe for immutable caching at the edge. */
const IMMUTABLE_ASSET = /^\/assets\/[^/]+\.[A-Za-z0-9_-]{6,}\.(js|css|mjs)$/;

function applySecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function finalizeResponse(res: Response, pathname: string): Response {
  const headers = new Headers(res.headers);
  applySecurityHeaders(headers);

  const type = headers.get('Content-Type') ?? '';
  if (IMMUTABLE_ASSET.test(pathname)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (type.includes('text/html')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      const res = await handleContactRequest(request, env);
      const headers = new Headers(res.headers);
      applySecurityHeaders(headers);
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }

    let res = await env.ASSETS.fetch(request);
    if (res.status === 404 && request.method === 'GET') {
      const accept = request.headers.get('Accept') ?? '';
      if (accept.includes('text/html')) {
        const indexReq = new Request(new URL('/index.html', request.url), request);
        res = await env.ASSETS.fetch(indexReq);
      }
    }
    return finalizeResponse(res, url.pathname);
  },
};
