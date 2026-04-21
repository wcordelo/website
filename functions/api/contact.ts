import { handleContactRequest } from '../../server/contact-handler';

type Env = {
  RESEND_API_KEY: string;
  CONTACT_INBOX_EMAIL: string;
  RESEND_FROM_EMAIL?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

/** Cloudflare Pages Function — route: /api/contact */
export const onRequest = async (context: PagesContext): Promise<Response> => {
  return handleContactRequest(context.request, {
    RESEND_API_KEY: context.env.RESEND_API_KEY,
    CONTACT_INBOX_EMAIL: context.env.CONTACT_INBOX_EMAIL,
    RESEND_FROM_EMAIL: context.env.RESEND_FROM_EMAIL,
  });
};
