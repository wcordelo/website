import { expect, test } from '@playwright/test';

type ShiftRecord = {
  time: number;
  value: number;
  recentInput: boolean;
  sources: { text: string | null; previous: unknown; current: unknown }[];
};

declare global {
  interface Window { layoutShiftEntries: ShiftRecord[] }
}

for (const delayed of ['none', 'stylesheet', 'font'] as const) {
  test(`mobile homepage stays stable with ${delayed} delayed`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 412, height: 823 });
    await page.addInitScript(() => {
      window.layoutShiftEntries = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number; hadRecentInput: boolean;
            sources: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
          };
          window.layoutShiftEntries.push({
            time: shift.startTime, value: shift.value, recentInput: shift.hadRecentInput,
            sources: shift.sources.map((source) => ({
              text: source.node?.textContent?.slice(0, 140) ?? null,
              previous: source.previousRect.toJSON(), current: source.currentRect.toJSON(),
            })),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const delayedRequests: string[] = [];
    if (delayed !== 'none') {
      await page.route(delayed === 'stylesheet' ? /\/(?:assets|src)\/[^?]+\.css(?:\?|$)/ : 'https://fonts.gstatic.com/**', async (route) => {
        delayedRequests.push(route.request().url());
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });
    }
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { name: 'William Lopez-Cordero', exact: true })).toBeVisible();
    if (delayed !== 'none') expect(delayedRequests.length).toBeGreaterThan(0);
    const entries = await page.evaluate(() => window.layoutShiftEntries);
    let maxCls = 0, sessionValue = 0, sessionStart = 0, previousTime = 0;
    for (const entry of entries.filter((item) => !item.recentInput)) {
      if (entry.time - previousTime > 1000 || entry.time - sessionStart > 5000) {
        sessionStart = entry.time;
        sessionValue = 0;
      }
      sessionValue += entry.value;
      previousTime = entry.time;
      maxCls = Math.max(maxCls, sessionValue);
    }
    await testInfo.attach('layout-shift-attribution', {
      body: JSON.stringify({ delayed, delayedRequests, maxCls, entries }, null, 2), contentType: 'application/json',
    });
    await page.screenshot({ path: testInfo.outputPath('home-mobile.png') });
    expect(maxCls, JSON.stringify(entries)).toBeLessThan(0.1);
  });
}
