import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

function emitSeoArtifacts() {
  return {
    name: 'emit-seo-artifacts',
    closeBundle() {
      const base = (process.env.VITE_SITE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
      const paths = ['/', '/work', '/about', '/contact'];
      const locs = paths.map((p) => `  <url>\n    <loc>${base}${p === '/' ? '/' : p}</loc>\n  </url>`);
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.join('\n')}\n</urlset>\n`;
      const robots = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
      const outDir = resolve('dist');
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap);
      writeFileSync(resolve(outDir, 'robots.txt'), robots);
    },
  };
}

export default defineConfig({
  plugins: [react(), emitSeoArtifacts(), cloudflare()],
  server: {
    proxy: {
      // `bun run dev` starts the Bun API on 3001; use `bun run dev:site` for Vite only
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
});