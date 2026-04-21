export const CONTACT_TOPIC_OPTIONS = [
  'Consulting — help us scale',
  'Full-time role',
  'Contract engagement',
  'Speaking / writing',
  'Just saying hi',
] as const;

export type ContactTopicOption = (typeof CONTACT_TOPIC_OPTIONS)[number];

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,199}$/u;
/** Practical email — aligned with server checks */
export const CONTACT_EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 8000;

export type ContactFieldKey = 'name' | 'email' | 'topic' | 'message';
export type ContactFieldErrors = Partial<Record<ContactFieldKey, string>>;

export function validateContactFields(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = input.name.trim();
  if (!NAME_RE.test(name)) {
    errors.name = 'Use 2–200 characters: letters, spaces, apostrophes, hyphens, or periods.';
  }
  const email = input.email.trim();
  if (!CONTACT_EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  const topic = input.topic.trim();
  if (!CONTACT_TOPIC_OPTIONS.includes(topic as ContactTopicOption)) {
    errors.topic = 'Choose a topic from the list.';
  }
  const message = input.message.trim();
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    errors.message = `Message must be ${MESSAGE_MIN}–${MESSAGE_MAX} characters.`;
  }
  return errors;
}
