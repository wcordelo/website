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

function withCacheHeaders(res: Response, pathname: string): Response {
  const type = res.headers.get('Content-Type') ?? '';

  if (IMMUTABLE_ASSET.test(pathname)) {
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }

  if (type.includes('text/html')) {
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }

  return res;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      return handleContactRequest(request, env);
    }

    let res = await env.ASSETS.fetch(request);
    if (res.status === 404 && request.method === 'GET') {
      const accept = request.headers.get('Accept') ?? '';
      if (accept.includes('text/html')) {
        const indexReq = new Request(new URL('/index.html', request.url), request);
        res = await env.ASSETS.fetch(indexReq);
      }
    }
    return withCacheHeaders(res, url.pathname);
  },
};
