import { RESUME_DATA } from '../data/resume';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ color: 'var(--muted)' }}>{RESUME_DATA.identity.availability}</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Link
              to="/contact#get-in-touch"
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
