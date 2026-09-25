import { defineConfig, devices } from '@playwright/test';

const contactApiPort = 3001;
const sitePort = 5173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e/artifacts/playwright-report' }],
    ['json', { outputFile: 'e2e/artifacts/test-results.json' }],
  ],
  outputDir: 'e2e/artifacts/test-output',
  use: {
    baseURL: `http://127.0.0.1:${sitePort}`,
    trace: 'on-first-retry',
    screenshot: 'on',
    storageState: { cookies: [], origins: [] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run dev:e2e',
    url: `http://127.0.0.1:${sitePort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT: String(contactApiPort),
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_e2e_test_key',
      CONTACT_INBOX_EMAIL: process.env.CONTACT_INBOX_EMAIL ?? 'inbox@example.com',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? 'from@example.com',
    },
  },
});
