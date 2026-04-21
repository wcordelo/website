import type { MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Footer() {
  const location = useLocation();

  const scrollToContactForm = (e: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/contact') return;
    e.preventDefault();
    document.getElementById('get-in-touch')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ color: 'var(--muted)' }}>Available for select engagements · 2026</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Link
              to="/contact#get-in-touch"
              onClick={scrollToContactForm}
              style={{ borderBottom: '1px solid currentColor' }}
            >
              Get in touch →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
