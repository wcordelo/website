import { afterEach, expect, mock, test } from 'bun:test';
import { getContactAvailability, submitContactForm } from '../src/lib/contactApi';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const payload = { name: 'Test User', email: 'sender@example.test', topic: 'Full-time role', message: 'A unit test message.' };

function respond(data: unknown, status = 200) {
  globalThis.fetch = mock(async () => Response.json(data, { status })) as unknown as typeof fetch;
}

test('unavailable delivery cannot be presented as a successful submission', async () => {
  respond({ error: 'Message delivery is temporarily unavailable.' }, 500);
  expect((await submitContactForm(payload)).ok).toBe(false);
});

test.each([{}, null, { ok: false }])('a successful HTTP code without delivery confirmation is rejected: %j', async (data) => {
  respond(data);
  expect((await submitContactForm(payload)).ok).toBe(false);
});

test('only an explicit successful delivery response is accepted', async () => {
  respond({ ok: true, id: 'unit-test-id' });
  expect((await submitContactForm(payload)).ok).toBe(true);
});

test('missing delivery settings return unavailable', async () => {
  respond({ available: false });
  expect(await getContactAvailability()).toBe(false);
});

test('availability failure is unknown rather than confirmed unavailable', async () => {
  globalThis.fetch = mock(async () => { throw new Error('Network unavailable'); }) as unknown as typeof fetch;
  expect(await getContactAvailability()).toBeNull();
});

test('requests carry bounded abort signals', async () => {
  const fetchMock = mock(async (_input: unknown, init?: RequestInit) => {
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    return Response.json({ available: false, ok: true });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await getContactAvailability();
  await submitContactForm(payload);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
