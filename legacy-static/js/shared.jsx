/* ============================================
   SHARED COMPONENTS & HOOKS
   ============================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --- Current page detection ---
function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  if (file.includes('work')) return 'work';
  if (file.includes('about')) return 'about';
  if (file.includes('contact')) return 'contact';
  return 'home';
}

// --- Nav ---
function Nav() {
  const current = getCurrentPage();
  const links = [
    { href: 'index.html', label: 'Home', key: 'home' },
    { href: 'work.html', label: 'Work', key: 'work' },
    { href: 'about.html', label: 'About', key: 'about' },
    { href: 'contact.html', label: 'Contact', key: 'contact' },
  ];

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="index.html" className="nav-brand">
          <span className="dot" />
          <span>W. Lopez-Cordero</span>
        </a>
        <div className="nav-links">
          {links.map(l => (
            <a key={l.key} href={l.href} className="nav-link" data-active={current === l.key ? '' : undefined}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ color: 'var(--muted)' }}>Available for select engagements · 2026</div>
          <div style={{ marginTop: '0.5rem' }}>
            <a href="contact.html" style={{ borderBottom: '1px solid currentColor' }}>Get in touch →</a>
          </div>
        </div>
        <div className="footer-meta">
          <a href="https://linkedin.com/in/william-lopez-cordero" style={{ borderBottom: '1px solid currentColor' }}>LinkedIn ↗</a>
          <a href="https://github.com/wcordelo" style={{ borderBottom: '1px solid currentColor' }}>GitHub ↗</a>
        </div>
      </div>
    </footer>
  );
}

// --- Cursor blob ---
function CursorBlob() {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    const handle = (e) => { target.x = e.clientX; target.y = e.clientY; };
    window.addEventListener('mousemove', handle);
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.08;
      pos.y += (target.y - pos.y) * 0.08;
      if (ref.current) {
        ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('mousemove', handle); cancelAnimationFrame(raf); };
  }, []);
  return <div className="cursor-blob" ref={ref} />;
}

// --- Scroll reveal ---
function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// --- Tweaks ---
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "ink",
  "type": "editorial",
  "density": "normal",
  "heroVariant": "type",
  "sectionOrder": "default"
}/*EDITMODE-END*/;

function applyTweaks(t) {
  const root = document.documentElement;
  root.dataset.theme = t.theme === 'ink' ? '' : t.theme;
  if (t.theme === 'ink') root.removeAttribute('data-theme');
  else root.dataset.theme = t.theme;
  root.dataset.type = t.type === 'editorial' ? '' : t.type;
  if (t.type === 'editorial') root.removeAttribute('data-type');
  else root.dataset.type = t.type;
  root.dataset.density = t.density;
  root.dataset.heroVariant = t.heroVariant;
  root.dataset.sectionOrder = t.sectionOrder;
}

function useTweaks() {
  const [tweaks, setTweaks] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolio-tweaks');
      return saved ? { ...TWEAK_DEFAULTS, ...JSON.parse(saved) } : { ...TWEAK_DEFAULTS };
    } catch { return { ...TWEAK_DEFAULTS }; }
  });

  useEffect(() => {
    applyTweaks(tweaks);
    try { localStorage.setItem('portfolio-tweaks', JSON.stringify(tweaks)); } catch {}
  }, [tweaks]);

  const update = useCallback((patch) => {
    setTweaks(prev => {
      const next = { ...prev, ...patch };
      window.parent?.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
      return next;
    });
  }, []);

  return [tweaks, update];
}

function TweaksPanel() {
  const [tweaks, update] = useTweaks();
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') { setOpen(true); setAvailable(true); }
      if (e.data?.type === '__deactivate_edit_mode') { setOpen(false); }
    };
    window.addEventListener('message', handler);
    window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const rows = [
    { key: 'theme', label: 'Color', options: [['ink', 'Ink & Flame'], ['deep-space', 'Deep Space'], ['plasma', 'Plasma']] },
    { key: 'type', label: 'Typography', options: [['editorial', 'Editorial'], ['mono', 'Mono'], ['swiss', 'Swiss']] },
    { key: 'density', label: 'Density', options: [['tight', 'Tight'], ['normal', 'Normal'], ['loose', 'Loose']] },
    { key: 'heroVariant', label: 'Hero', options: [['type', 'Type'], ['orbit', 'Orbit'], ['terminal', 'Terminal']] },
    { key: 'sectionOrder', label: 'Section Order', options: [['default', 'Default'], ['work-first', 'Work First'], ['skills-first', 'Skills First']] },
  ];

  if (!open) return null;

  return (
    <div className="tweaks open">
      <div className="tweaks-header">
        <span className="tweaks-title">Tweaks</span>
        <button className="tweak-btn" onClick={() => setOpen(false)}>✕</button>
      </div>
      {rows.map(row => (
        <div className="tweaks-row" key={row.key}>
          <h5>{row.label}</h5>
          <div className="tweaks-options">
            {row.options.map(([v, l]) => (
              <button
                key={v}
                className="tweak-btn"
                data-active={tweaks[row.key] === v ? '' : undefined}
                onClick={() => update({ [row.key]: v })}
              >{l}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Marquee ---
function Marquee({ children }) {
  const items = React.Children.toArray(children);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>{items}</span>
        <span>{items}</span>
      </div>
    </div>
  );
}

// --- Chrome wrapper ---
function Chrome({ children }) {
  useRevealOnScroll();
  return (
    <>
      <CursorBlob />
      <div className="noise" />
      <Nav />
      <div className="page-wrap">
        {children}
      </div>
      <Footer />
      <TweaksPanel />
    </>
  );
}

Object.assign(window, { Chrome, Nav, Footer, Marquee, CursorBlob, TweaksPanel, useTweaks, useRevealOnScroll, getCurrentPage });
