import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { loadEnv } from 'vite';
import { StaticRouter } from 'react-router-dom';
import { HomePage } from '../src/pages/Home';
import { WorkPage } from '../src/pages/Work';
import { AboutPage } from '../src/pages/About';
import { ContactPage } from '../src/pages/Contact';
import { GlobalJsonLd } from '../src/seo/GlobalJsonLd';

const base = (loadEnv('production', process.cwd(), 'VITE_').VITE_SITE_URL || 'https://wcordelo.com').replace(/\/$/, '');
const template = await readFile('dist/client/index.html', 'utf8');
const routes = { '/': HomePage, '/work': WorkPage, '/about': AboutPage, '/contact': ContactPage };
for (const [path, Page] of Object.entries(routes)) {
  const body = renderToString(
    <HelmetProvider>
      <StaticRouter location={path}>
        <GlobalJsonLd />
        <Suspense><Page /></Suspense>
      </StaticRouter>
    </HelmetProvider>,
  );
  const metadata = /<title>[\s\S]*?<\/title>|<meta\s[^>]*\/>|<link\s[^>]*\/>/g;
  const head = (body.match(metadata) || []).join('\n').replaceAll('https://wcordelo.com', base);
  const content = body.replace(metadata, '');
  const html = template.replace(/<title>[^<]*<\/title>/, head).replace('<div id="root"></div>', `<div id="root">${content}</div>\n<noscript><style>[data-reveal]{opacity:1;transform:none}</style><p class="container">Enable JavaScript to use filters and the contact form.</p></noscript>`);
  const directory = path === '/' ? 'dist/client' : `dist/client${path}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html);
}
console.log('Prerendered four public routes with shared page content and metadata.');

await writeFile('dist/client/404.html', template.replace('<title>William Lopez-Cordero</title>', '<title>Page not found · William Lopez-Cordero</title><meta name="robots" content="noindex" />').replace('<div id="root"></div>', '<main class="container"><h1>Page not found</h1><p><a href="/">Return home</a></p></main>').replace(/<script type="module"[^>]*><\/script>/g, ''));
