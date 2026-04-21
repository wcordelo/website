export type ContactPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export async function submitContactForm(payload: ContactPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = (import.meta.env.VITE_CONTACT_API_BASE ?? '').replace(/\/$/, '');
  const url = `${base}/api/contact`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    const devHint =
      import.meta.env.DEV && !(import.meta.env.VITE_CONTACT_API_BASE ?? '').trim()
        ? ' Start the contact API with `bun run dev` (recommended) or `bun run dev:api` in another terminal.'
        : '';
    return { ok: false, error: `Network error — could not reach the server.${devHint}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: res.ok ? 'Unexpected response' : 'Request failed' };
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Could not send message';
    return { ok: false, error: msg };
  }

  return { ok: true };
}
