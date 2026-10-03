import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

type RouteCheck =
  | { path: string; kind: 'heading'; heading: RegExp | string; screenshot: string }
  | { path: string; kind: 'text'; text: RegExp | string; screenshot: string };

const ROUTES: RouteCheck[] = [
  { path: '/', kind: 'heading', heading: /Solving the hardest problems/i, screenshot: 'home.png' },
  { path: '/work', kind: 'heading', heading: /outcomes/i, screenshot: 'work.png' },
  { path: '/about', kind: 'heading', heading: /Full\s+story/i, screenshot: 'about.png' },
  { path: '/contact', kind: 'heading', heading: /Let's build/i, screenshot: 'contact.png' },
];

test.describe('site routes', () => {
  const routeLog: { path: string; title: string; marker: string; status: string }[] = [];

  for (const route of ROUTES) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();

      const marker =
        route.kind === 'heading'
          ? page.getByRole('heading', { name: route.heading })
          : page.getByText(route.text);
      await expect(marker).toBeVisible();

      const title = await page.title();
      const markerText = await marker.innerText();
      routeLog.push({ path: route.path, title, marker: markerText, status: 'ok' });

      await page.screenshot({
        path: resolve('e2e/artifacts/screenshots', route.screenshot),
        fullPage: true,
      });
    });
  }

  test('navigates across primary links', async ({ page }) => {
    await page.goto('/');
    for (const label of ['Work', 'About', 'Contact', 'Home']) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    }
  });

  test.afterAll(() => {
    const artifactPath = resolve('e2e/artifacts/route-smoke.json');
    writeFileSync(artifactPath, `${JSON.stringify({ checkedAt: new Date().toISOString(), routes: routeLog }, null, 2)}\n`);
  });
});
