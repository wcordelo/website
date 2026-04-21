import { Helmet } from 'react-helmet-async';
import { RESUME_DATA } from '../data/resume';
import { getSiteUrl } from '../lib/siteUrl';
import { SITE_FAQ } from './siteFaq';

function personLd() {
  const { identity } = RESUME_DATA;
  const base = getSiteUrl();
  const sameAs = [
    identity.linkedin && `https://linkedin.com/in/${identity.linkedin}`,
    identity.github && `https://github.com/${identity.github}`,
  ].filter(Boolean) as string[];
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: identity.name,
    ...(identity.email ? { email: identity.email } : {}),
    ...(identity.phone ? { telephone: identity.phone } : {}),
    jobTitle: 'Engineer',
    description: RESUME_DATA.hero.subtitle,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    url: base || undefined,
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'MIT',
    },
    knowsAbout: RESUME_DATA.disciplines.map((d) => d.label),
  };
}

function faqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SITE_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function GlobalJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(personLd())}</script>
    </Helmet>
  );
}

export function ContactFaqJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(faqLd())}</script>
    </Helmet>
  );
}
