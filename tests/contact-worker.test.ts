import { afterEach, expect, mock, test } from 'bun:test';
import worker from '../worker';

const originalFetch = globalThis.fetch;
const outbound = mock(async () => Response.json({ id: 'unit-test-id' }));
const env = { ASSETS: { fetch: mock(async () => new Response('site')) } };
afterEach(() => { globalThis.fetch = originalFetch; outbound.mockClear(); });

async function request(method: string, body?: string, configured = false) {
  globalThis.fetch = outbound as unknown as typeof fetch;
  return worker.fetch(new Request('https://example.test/api/contact', {
    method,
    ...(body === undefined ? {} : { body, headers: { 'Content-Type': 'application/json' } }),
  }), {
    ...env,
    ...(configured ? { RESEND_API_KEY: 'unit-test-only', CONTACT_INBOX_EMAIL: 'inbox@example.test' } : {}),
  });
}

test('GET rejects the method, not the form POST route', async () => {
  const response = await request('GET');
  expect(response.status).toBe(405);
  expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
  expect(outbound).not.toHaveBeenCalled();
});

test('OPTIONS succeeds without email credentials or sending', async () => {
  expect((await request('OPTIONS')).status).toBe(204);
  expect(outbound).not.toHaveBeenCalled();
});

test.each(['{}', '[]', 'null', '{broken'])('invalid POST reaches validation without sending: %s', async (body) => {
  expect((await request('POST', body)).status).toBe(400);
  expect(outbound).not.toHaveBeenCalled();
});

test('valid input without delivery settings reports configuration failure', async () => {
  const response = await request('POST', JSON.stringify({ name: 'Test User', email: 'sender@example.test', topic: 'Full-time role', message: 'A unit test message.' }));
  expect(response.status).toBe(500);
  expect(outbound).not.toHaveBeenCalled();
});

test('configured valid input invokes a mocked delivery only', async () => {
  const response = await request('POST', JSON.stringify({ name: 'Test User', email: 'sender@example.test', topic: 'Full-time role', message: 'A unit test message.' }), true);
  expect(response.status).toBe(200);
  expect(outbound).toHaveBeenCalledTimes(1);
  expect((await response.json()).ok).toBe(true);
});

test('availability reports missing settings without sending or exposing values', async () => {
  globalThis.fetch = outbound as unknown as typeof fetch;
  const response = await worker.fetch(new Request('https://example.test/api/contact/status'), env);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ available: false });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(outbound).not.toHaveBeenCalled();
});

test('availability reports configured delivery without contacting the provider', async () => {
  globalThis.fetch = outbound as unknown as typeof fetch;
  const response = await worker.fetch(new Request('https://example.test/api/contact/status'), { ...env, RESEND_API_KEY: 'unit-test-only', CONTACT_INBOX_EMAIL: 'inbox@example.test' });
  expect(await response.json()).toEqual({ available: true });
  expect(outbound).not.toHaveBeenCalled();
});
