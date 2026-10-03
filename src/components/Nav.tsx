import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

type NavKey = 'home' | 'work' | 'about' | 'contact';

function currentKey(pathname: string): NavKey {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname.startsWith('/work')) return 'work';
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/contact')) return 'contact';
  return 'home';
}

const links: { to: string; label: string; key: NavKey }[] = [
  { to: '/', label: 'Home', key: 'home' },
  { to: '/work', label: 'Work', key: 'work' },
  { to: '/about', label: 'About', key: 'about' },
  { to: '/contact', label: 'Contact', key: 'contact' },
];

export function Nav() {
  const { pathname } = useLocation();
  const current = currentKey(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const nav = navRef.current!;
    const blocked = Array.from(document.querySelectorAll<HTMLElement>('.page-wrap, footer, .skip-link'));
    const previousInert = blocked.map((element) => element.inert);
    blocked.forEach((element) => { element.inert = true; });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setMenuOpen(false); toggleRef.current?.focus(); }
      if (e.key === 'Tab') {
        const controls = Array.from(nav.querySelectorAll<HTMLElement>('a, button:not([tabindex="-1"])'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      blocked.forEach((element, index) => { element.inert = previousInert[index]; });
    };
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 769px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <nav ref={navRef} className="nav" data-menu-open={menuOpen ? '' : undefined} aria-label="Primary">
      {menuOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
          <span className="dot" />
          <span>W. Lopez-Cordero</span>
        </Link>
        <button
          type="button"
          ref={toggleRef}
          className="nav-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="primary-nav-links"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav-menu-burger" aria-hidden data-open={menuOpen ? '' : undefined}>
            <span />
            <span />
            <span />
          </span>
          <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
        <div className="nav-links" id="primary-nav-links">
          {links.map((l) => (
            <NavLink
              key={l.key}
              to={l.to}
              end={l.key === 'home'}
              className="nav-link"
              data-active={current === l.key ? '' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
