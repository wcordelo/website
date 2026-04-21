import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const criticalShellPath = fileURLToPath(new URL('./src/critical-shell.css', import.meta.url));

function perfFirstPaintPlugin() {
  return {
    name: 'perf-first-paint',
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        const critical = readFileSync(criticalShellPath, 'utf-8');
        let next = html.replace(
          /(<meta name="viewport"[^>]*\/>)\s*/,
          `$1\n    <style id="critical-shell">${critical}</style>\n`,
        );
        next = next.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
          `<link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media='all'" />\n    <noscript><link rel="stylesheet" crossorigin href="$1" /></noscript>`,
        );
        return next;
      },
    },
  };
}

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
  plugins: [react(), perfFirstPaintPlugin(), emitSeoArtifacts()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-helmet-async')) return 'vendor-helmet';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      // `bun run dev` starts the Bun API on 3001; use `bun run dev:site` for Vite only
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
});
