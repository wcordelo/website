/// <reference types="bun-types" />

/**
 * Contact form API — run with: bun run server/contact-api.ts
 * Set RESEND_API_KEY and CONTACT_INBOX_EMAIL in .env
 */
import { handleContactRequest } from './contact-handler';

const PORT = Number(process.env.PORT) || 3001;

Bun.serve({
  port: PORT,
  fetch(req) {
    return handleContactRequest(req, {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      CONTACT_INBOX_EMAIL: process.env.CONTACT_INBOX_EMAIL,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    });
  },
});

console.log(`Contact API at http://127.0.0.1:${PORT} (POST /api/contact)`);
