/**
 * Standalone Cloudflare Worker: static assets from ./dist + POST /api/contact.
 * Deploy: bun run cf:worker:deploy  (default wrangler.toml)
 */
import type { ContactEnv } from './server/contact-handler';
import { handleContactRequest } from './server/contact-handler';

export type Env = ContactEnv & {
  ASSETS: { fetch(input: Request | URL | string, init?: RequestInit): Promise<Response> };
};

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
    return res;
  },
};
