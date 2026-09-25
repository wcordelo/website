import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:3001';

test.describe('contact API', () => {
  test('returns 400 for invalid payload', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/contact`, {
      data: { name: 'x', email: 'bad', topic: 'Just saying hi', message: 'short' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');

    writeFileSync(
      resolve('e2e/artifacts/contact-api-invalid.json'),
      `${JSON.stringify({ status: res.status(), body }, null, 2)}\n`,
    );
  });

  test('returns 400 for unknown topic', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/contact`, {
      data: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        topic: 'Not a real topic',
        message: 'This message is long enough for validation.',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/topic/i);
  });

  test('handles CORS preflight', async ({ request }) => {
    const res = await request.fetch(`${API_BASE}/api/contact`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:5173' },
    });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
  });
});
