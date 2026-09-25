import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /Let's build/i })).toBeVisible();
  });

  test('shows client-side validation errors for empty submit', async ({ page }) => {
    await page.locator('form.contact-form').getByRole('button', { name: /Send/i }).click();

    await expect(page.getByRole('alert').filter({ hasText: /letters, spaces/i })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: /valid email/i })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: /10–8000 characters/i })).toBeVisible();

    await page.screenshot({ path: resolve('e2e/artifacts/screenshots/contact-validation.png'), fullPage: true });
  });

  test('rejects invalid email before network call', async ({ page }) => {
    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Message').fill('Valid length message here.');
    await page.locator('form.contact-form').getByRole('button', { name: /Send/i }).click();

    await expect(page.getByRole('alert').filter({ hasText: /valid email/i })).toBeVisible();
    await expect(page.locator('.form-success')).toHaveCount(0);
  });

  test.afterAll(() => {
    const artifactPath = resolve('e2e/artifacts/contact-form-validation.json');
    writeFileSync(
      artifactPath,
      `${JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          cases: [
            { case: 'empty-submit', expects: ['name', 'email', 'message'] },
            { case: 'invalid-email', expects: ['email'] },
          ],
        },
        null,
        2,
      )}\n`,
    );
  });
});
