import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom';
import { HomePage } from '../src/pages/Home';
import { WorkPage } from '../src/pages/Work';
import { AboutPage } from '../src/pages/About';
import { ContactPage } from '../src/pages/Contact';
import { GlobalJsonLd } from '../src/seo/GlobalJsonLd';

for (const [path, Page, heading] of [
  ['/', HomePage, 'William Lopez-Cordero'],
  ['/work', WorkPage, 'Case studies'],
  ['/about', AboutPage, 'About me'],
  ['/contact', ContactPage, 'Send a message'],
] as const) {
  test(`public ${path} content, canonical and identity render without browser JavaScript`, () => {
    const html = renderToString(createElement(HelmetProvider, null, createElement(StaticRouter, { location: path }, createElement(GlobalJsonLd), createElement(Page))));
    expect(html).toContain(heading);
    expect(html).toContain('<main');
    expect(html).toContain(`rel="canonical" href="https://wcordelo.com${path === '/' ? '' : path}"`);
    expect(html).toContain('"worksFor":{"@type":"Organization","name":"Handl Health"}');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('"email":');
  });
}
