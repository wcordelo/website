import { useEffect, useState, type FormEvent } from 'react';
import { RESUME_DATA } from '../data/resume';
import { Chrome } from '../layout/Chrome';
import { getContactAvailability, submitContactForm } from '../lib/contactApi';
import {
  CONTACT_TOPIC_LABELS,
  CONTACT_TOPIC_OPTIONS,
  type ContactTopicOption,
  validateContactFields,
} from '../lib/contactFormValidation';
import { ContactFaqJsonLd } from '../seo/GlobalJsonLd';
import { PageHelmet } from '../seo/PageHelmet';
import { SITE_FAQ } from '../seo/siteFaq';

const CONTACT_FORM_DEFAULT_TOPIC = CONTACT_TOPIC_OPTIONS[0];

type ContactFormState = {
  name: string;
  email: string;
  topic: ContactTopicOption;
  message: string;
};

function ContactForm() {
  const [form, setForm] = useState<ContactFormState>({
    name: '',
    email: '',
    topic: CONTACT_FORM_DEFAULT_TOPIC,
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [delivery, setDelivery] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');
  const [availabilityCheck, setAvailabilityCheck] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void getContactAvailability().then((available) => {
      if (!cancelled) setDelivery(available === null ? 'error' : available ? 'available' : 'unavailable');
    });
    return () => { cancelled = true; };
  }, [availabilityCheck]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateContactFields>>({});

  const clearFieldError = (key: keyof ContactFormState) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    if (delivery !== 'available') return;
    const trimmed = {
      name: form.name.trim(),
      email: form.email.trim(),
      topic: form.topic.trim(),
      message: form.message.trim(),
    };
    const nextErrors = validateContactFields(trimmed);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    const result = await submitContactForm(trimmed);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSent(true);
    setForm({ name: '', email: '', topic: CONTACT_FORM_DEFAULT_TOPIC, message: '' });
    setFieldErrors({});
    window.setTimeout(() => setSent(false), 8000);
  };

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            minLength={2}
            maxLength={200}
            value={form.name}
            onChange={(e) => {
              clearFieldError('name');
              setForm({ ...form, name: e.target.value });
            }}
            placeholder="your name"
            disabled={submitting}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="contact-name-error" className="form-field-error" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            name="email"
            required
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={form.email}
            onChange={(e) => {
              clearFieldError('email');
              setForm({ ...form, email: e.target.value });
            }}
            placeholder="you@company.com"
            disabled={submitting}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="contact-email-error" className="form-field-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="contact-topic">Topic</label>
        <select
          id="contact-topic"
          name="topic"
          required
          value={form.topic}
          onChange={(e) => {
            clearFieldError('topic');
            setForm({ ...form, topic: e.target.value as ContactTopicOption });
          }}
          disabled={submitting}
          aria-invalid={fieldErrors.topic ? true : undefined}
          aria-describedby={fieldErrors.topic ? 'contact-topic-error' : undefined}
        >
          {CONTACT_TOPIC_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {CONTACT_TOPIC_LABELS[t]}
            </option>
          ))}
        </select>
        {fieldErrors.topic && (
          <p id="contact-topic-error" className="form-field-error" role="alert">
            {fieldErrors.topic}
          </p>
        )}
      </div>
      <div className="form-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={8000}
          value={form.message}
          onChange={(e) => {
            clearFieldError('message');
            setForm({ ...form, message: e.target.value });
          }}
          placeholder="Describe your project, team, and timeline."
          disabled={submitting}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
        />
        {fieldErrors.message && (
          <p id="contact-message-error" className="form-field-error" role="alert">
            {fieldErrors.message}
          </p>
        )}
      </div>
      <div className="form-submit">
        <button type="submit" className="btn btn-primary" disabled={submitting || delivery !== 'available'}>
          {submitting ? 'Sending…' : delivery === 'checking' ? 'Checking…' : 'Send'} <span className="arrow">→</span>
        </button>
      </div>
      {(delivery === 'unavailable' || delivery === 'error') && (
        <div className="form-error">
          <p role="status">{delivery === 'error' ? 'Could not check message delivery. Please try again.' : 'Message delivery is temporarily unavailable. Please check back later.'}</p>
          <button type="button" className="btn" onClick={() => { setDelivery('checking'); setAvailabilityCheck((value) => value + 1); }}>Check again</button>
        </div>
      )}
      {error && <div className="form-error" role="alert">{error}</div>}
      {sent && (
        <div className="form-success" role="status">Thanks. I&apos;ll follow up within 48 hours.</div>
      )}
    </form>
  );
}

export function ContactPage() {
  return (
    <>
      <ContactFaqJsonLd />
      <PageHelmet
        title="Contact · William Lopez-Cordero"
        description="Contact William Lopez-Cordero about AI enablement, workflow automation, IT operations, or a project."
        path="/contact"
      />
      <Chrome>
        <section className="contact-hero container">
          <div className="page-label">/ Contact · 04</div>
          <h1 className="contact-hero-title">
            Get in <span className="accent">touch.</span>
          </h1>
          <p className="contact-hero-sub">
            Tell me about your project, team, and timeline, or ask about AI enablement,
            workflow automation, and IT operations.
          </p>

          <div className="availability">
            <span className="availability-line">
              <span className="availability-dot" />
              {RESUME_DATA.identity.availability}
            </span>
            <span className="availability-meta">Reply within 48 hours</span>
          </div>
        </section>

        <section id="get-in-touch" className="container contact-grid-section">
          <div className="contact-grid">
            <div className="contact-block">
              <div className="contact-block-label">Send a message</div>
              <ContactForm />
            </div>
          </div>
        </section>

        <section className="container contact-faq-section">
          <div className="section-head contact-faq-head">
            <span className="section-idx">FAQ</span>
            <h2 className="section-kicker">Questions</h2>
          </div>
          <div className="about-bio-prose contact-faq-list">
            {SITE_FAQ.map((item) => (
              <details key={item.question} className="contact-faq-item">
                <summary className="contact-faq-toggle">
                  <h3 className="discipline-label contact-faq-q">{item.question}</h3>
                </summary>
                <p className="contact-faq-a">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </Chrome>
    </>
  );
}
