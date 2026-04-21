/// <reference types="bun-types" />

/**
 * Contact form API — run with: bun run server/contact-api.ts
 * Set RESEND_API_KEY (replace re_xxxxxxxxx with your real key) and CONTACT_INBOX_EMAIL in .env
 */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const PORT = Number(process.env.PORT) || 3001;
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

Bun.serve({
  port: PORT,
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }

    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/api/contact') {
      return new Response('Not Found', { status: 404 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return Response.json({ error: 'Server misconfigured' }, { status: 500, headers: corsHeaders(req) });
    }

    const to = process.env.CONTACT_INBOX_EMAIL;
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

    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

    const html = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Reply to:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
      <hr />
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(message)}</pre>
    `;

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Portfolio contact] ${topic} — ${name}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: 'Failed to send email' }, { status: 502, headers: corsHeaders(req) });
    }

    return Response.json({ ok: true, id: data?.id ?? null }, { headers: corsHeaders(req) });
  },
});

console.log(`Contact API at http://127.0.0.1:${PORT} (POST /api/contact)`);
