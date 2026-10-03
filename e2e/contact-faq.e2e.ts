import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`contact FAQ toggles independently at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/contact');
    const faq = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schema = faq.map((text) => JSON.parse(text)).find((item) => item['@type'] === 'FAQPage');
    expect(schema.mainEntity).toHaveLength(11);
    const items = page.locator('.contact-faq-item');
    await expect(items).toHaveCount(schema.mainEntity.length);
    for (let i = 0; i < schema.mainEntity.length; i++) {
      const item = items.nth(i);
      const toggle = item.locator('summary');
      const answer = item.locator('.contact-faq-a');
      await expect(answer).toHaveText(schema.mainEntity[i].acceptedAnswer.text);
      await expect(answer).toBeHidden();
      await toggle.click();
      await expect(item).toHaveAttribute('open', '');
      await expect(answer).toBeVisible();
      await toggle.click();
      await expect(answer).toBeHidden();
      await toggle.focus();
      await expect(toggle).toBeFocused();
      await toggle.press('Enter');
      await expect(answer).toBeVisible();
      await toggle.press('Space');
      await expect(answer).toBeHidden();
    }
    await items.nth(0).locator('summary').click();
    await items.nth(1).locator('summary').click();
    await expect(items.nth(0).locator('.contact-faq-a')).toBeVisible();
    await expect(items.nth(1).locator('.contact-faq-a')).toBeVisible();
    await expect(items.nth(2).locator('.contact-faq-a')).toBeHidden();
    await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('autocomplete', 'name');
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('datalist')).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain('resend._domainkey');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.contact-faq-section').scrollIntoViewIfNeeded();
    await page.locator('.contact-faq-section').screenshot({ path: resolve(`e2e/artifacts/screenshots/contact-faq-${viewport.width}-open.png`) });
    await items.nth(0).locator('summary').click();
    await items.nth(1).locator('summary').click();
    await page.locator('.contact-faq-section').screenshot({ path: resolve(`e2e/artifacts/screenshots/contact-faq-${viewport.width}-closed.png`) });
  });
}
