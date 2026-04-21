/**
 * Shared contact handler for Bun (local API) and Cloudflare Pages Functions.
 * Sends mail via Resend REST API (Workers-compatible).
 */

export type ContactEnv = {
  RESEND_API_KEY?: string;
  CONTACT_INBOX_EMAIL?: string;
  RESEND_FROM_EMAIL?: string;
};

const MAX_NAME = 200;
const MIN_MSG = 10;
const MAX_MSG = 8000;

const ALLOWED_TOPICS = new Set([
  'Consulting — help us scale',
  'Full-time role',
  'Contract engagement',
  'Speaking / writing',
  'Just saying hi',
]);

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,199}$/u;
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendViaResend(
  apiKey: string,
  params: { from: string; to: string; replyTo: string; subject: string; html: string },
): Promise<{ ok: true; id: string | null } | { ok: false }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      reply_to: params.replyTo,
      subject: params.subject,
      html: params.html,
    }),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    console.error('Resend error:', data);
    return { ok: false };
  }

  const id =
    typeof data === 'object' && data !== null && 'id' in data && typeof (data as { id: unknown }).id === 'string'
      ? (data as { id: string }).id
      : null;
  return { ok: true, id };
}

export async function handleContactRequest(req: Request, env: ContactEnv): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  if (req.method !== 'POST' || url.pathname !== '/api/contact') {
    return new Response('Not Found', { status: 404 });
  }

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return Response.json({ error: 'Server misconfigured' }, { status: 500, headers: corsHeaders(req) });
  }

  const to = env.CONTACT_INBOX_EMAIL;
  if (!to) {
    console.error('CONTACT_INBOX_EMAIL is not set');
    return Response.json({ error: 'Server misconfigured' }, { status: 500, headers: corsHeaders(req) });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(req) });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Invalid body' }, { status: 400, headers: corsHeaders(req) });
  }

  const rec = body as Record<string, unknown>;
  const name = typeof rec.name === 'string' ? rec.name.trim() : '';
  const email = typeof rec.email === 'string' ? rec.email.trim() : '';
  const topic = typeof rec.topic === 'string' ? rec.topic.trim() : '';
  const message = typeof rec.message === 'string' ? rec.message.trim() : '';

  if (!NAME_RE.test(name) || name.length > MAX_NAME) {
    return Response.json({ error: 'Invalid name' }, { status: 400, headers: corsHeaders(req) });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400, headers: corsHeaders(req) });
  }
  if (!topic || !ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: 'Invalid topic' }, { status: 400, headers: corsHeaders(req) });
  }
  if (message.length < MIN_MSG || message.length > MAX_MSG) {
    return Response.json({ error: 'Invalid message' }, { status: 400, headers: corsHeaders(req) });
  }

  const from = env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  const html = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Reply to:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
      <hr />
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(message)}</pre>
    `;

  const sent = await sendViaResend(env.RESEND_API_KEY, {
    from,
    to,
    replyTo: email,
    subject: `[Portfolio contact] ${topic} — ${name}`,
    html,
  });

  if (!sent.ok) {
    return Response.json({ error: 'Failed to send email' }, { status: 502, headers: corsHeaders(req) });
  }

  return Response.json({ ok: true, id: sent.id }, { headers: corsHeaders(req) });
}
