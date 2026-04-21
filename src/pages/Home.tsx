import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RESUME_DATA } from '../data/resume';
import type { DisciplineKey } from '../data/resume.types';
import { useTweaks } from '../hooks/useTweaks';
import { Chrome } from '../layout/Chrome';
import { PageHelmet } from '../seo/PageHelmet';

const disciplineCopy: Record<DisciplineKey, string> = {
  ai: 'AI content pipelines powering 1M+ downloads — aggregation, validation, generation. Agent workflows and LLM orchestration shipped to production.',
  software:
    'Full-stack platforms that scale — React, Next.js, TypeScript. End-to-end ownership from prototype to production. 60K+ users in production.',
  protocol:
    'Onchain incentive systems, smart contracts, multi-chain deployments. $2M+ revenue, $1M+ distributed across EVM chains.',
  infra: 'Event-driven ingestion, ClickHouse + BigQuery analytics, Pulumi-driven cloud. 10× query speedups at production scale.',
  aerospace:
    "JPL sequencing software for spacecraft. OSIRIS-REx flight hardware. Skunk Works thermo and structures. MIT Aero '19.",
};

function HeroType() {
  const { hero } = RESUME_DATA;
  const [cycleIdx, setCycleIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCycleIdx((i) => (i + 1) % hero.titles.length), 2400);
    return () => clearInterval(id);
  }, [hero.titles.length]);

  return (
    <section className="hero-type">
      <div className="hero-meta container">
        <div className="hero-meta-row">
          <span className="hero-meta-k">Portfolio</span>
          <span className="hero-meta-v">2026 — ∞</span>
        </div>
        <div className="hero-meta-row">
          <span className="hero-meta-k">Based</span>
          <span className="hero-meta-v">Los Angeles · Remote</span>
        </div>
        <div className="hero-meta-row">
          <span className="hero-meta-k">Status</span>
          <span className="hero-meta-v">
            <span className="status-dot" />
            Taking engagements
          </span>
        </div>
      </div>

      <div className="hero-stack container">
        <div className="hero-cycle">
          {hero.titles.map((t, i) => (
            <div key={t} className="hero-cycle-line" data-active={i === cycleIdx ? '' : undefined}>
              {t.split(' ').map((w, wi) => (
                <span key={wi} className="hero-word">
                  <span>{w}</span>
                </span>
              ))}
              <span className="hero-period">.</span>
            </div>
          ))}
        </div>
        <div className="hero-tag">
          <span className="hero-tag-arrow">→</span>
          <span>{RESUME_DATA.hero.tag}</span>
        </div>
      </div>

      <div className="hero-bottom container">
        <div className="hero-bio">{RESUME_DATA.hero.subtitle}</div>
        <div className="hero-ctas">
          <Link to="/work" className="btn btn-primary">
            See the work <span className="arrow">→</span>
          </Link>
          <Link to="/contact" className="btn">
            Work with me <span className="arrow">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroOrbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const orbits = [
      { r: 0.15, speed: 0.8, size: 4, label: 'software' },
      { r: 0.25, speed: 0.5, size: 6, label: 'protocol' },
      { r: 0.35, speed: 0.32, size: 3, label: 'infra' },
      { r: 0.45, speed: 0.2, size: 8, label: 'aerospace' },
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);
    const start = performance.now();
    const draw = (t: number) => {
      const elapsed = (t - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const unit = Math.min(w, h);
      const style = getComputedStyle(document.documentElement);
      const ink = style.getPropertyValue('--ink').trim();
      const accent = style.getPropertyValue('--accent').trim();
      const line = style.getPropertyValue('--line-strong').trim();

      orbits.forEach((o) => {
        ctx.beginPath();
        ctx.strokeStyle = line;
        ctx.lineWidth = 1 * devicePixelRatio;
        ctx.setLineDash([4 * devicePixelRatio, 8 * devicePixelRatio]);
        ctx.arc(cx, cy, o.r * unit, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();

      orbits.forEach((o, i) => {
        const angle = elapsed * o.speed + i * 1.3;
        const x = cx + Math.cos(angle) * o.r * unit;
        const y = cy + Math.sin(angle) * o.r * unit;
        ctx.fillStyle = i === 1 ? accent : ink;
        ctx.beginPath();
        ctx.arc(x, y, o.size * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="hero-orbit">
      <canvas ref={canvasRef} className="orbit-canvas" />
      <div className="container hero-orbit-content">
        <div className="hero-orbit-label">FIVE DISCIPLINES · ONE OPERATOR</div>
        <h1 className="hero-orbit-title">
          Solving the
          <br />
          hardest problems.
        </h1>
        <div className="hero-orbit-bio">
          AI Automation · Full Stack · Protocol ·
          <br />
          Data Infra · Aerospace.
          <br />
          MIT Aero &apos;19 · 10+ years shipping systems that matter.
        </div>
        <div className="hero-ctas">
          <Link to="/work" className="btn btn-primary">
            See the work <span className="arrow">→</span>
          </Link>
          <Link to="/contact" className="btn">
            Work with me <span className="arrow">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

type TermLine =
  | { prompt: string; text: string; cursor?: boolean }
  | { out: string };

function HeroTerminal() {
  const lines = useMemo<TermLine[]>(
    () => [
      { prompt: '~', text: 'whoami' },
      { out: "william lopez-cordero · MIT '19 · engineer" },
      { prompt: '~', text: 'cat disciplines.txt' },
      { out: '→ ai automation' },
      { out: '→ full stack' },
      { out: '→ protocol' },
      { out: '→ data infra' },
      { out: '→ aerospace' },
      { prompt: '~', text: 'status --last-role' },
      { out: 'founding engineer @ bello · 2023 → apr 2026' },
      { out: '60K users · $2M revenue · $1M distributed' },
      { prompt: '~', text: 'echo "open for engagements"' },
      { out: 'open for engagements — full-time · contract · advisory' },
      { prompt: '~', text: '_', cursor: true },
    ],
    [],
  );

  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (visible >= lines.length) return;
    const delay = 'out' in lines[visible] ? 400 : 600;
    const id = setTimeout(() => setVisible((v) => v + 1), delay);
    return () => clearTimeout(id);
  }, [visible, lines]);

  return (
    <section className="hero-terminal">
      <div className="container">
        <div className="terminal-window">
          <div className="terminal-bar">
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-title">~/portfolio</span>
          </div>
          <div className="terminal-body">
            {lines.slice(0, visible).map((l, i) => (
              <div key={i} className="term-line">
                {'prompt' in l && (
                  <>
                    <span className="term-prompt">{l.prompt} $</span>
                    <span className="term-cmd">
                      {l.text}
                      {l.cursor && <span className="term-cursor">█</span>}
                    </span>
                  </>
                )}
                {'out' in l && <span className="term-out">{l.out}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="hero-terminal-side">
          <h1 className="hero-terminal-title">
            Solving
            <br />
            the hardest
            <br />
            problems.
          </h1>
          <p className="hero-terminal-bio">{RESUME_DATA.hero.subtitle}</p>
          <div className="hero-ctas">
            <Link to="/work" className="btn btn-primary">
              See the work <span className="arrow">→</span>
            </Link>
            <Link to="/contact" className="btn">
              Work with me <span className="arrow">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeHero() {
  const [tweaks] = useTweaks();
  if (tweaks.heroVariant === 'orbit') return <HeroOrbit />;
  if (tweaks.heroVariant === 'terminal') return <HeroTerminal />;
  return <HeroType />;
}

function HomeMetrics() {
  return (
    <section className="home-metrics container" data-reveal>
      <div className="section-head">
        <span className="section-idx">01</span>
        <h3 className="section-kicker">Selected numbers. 10+ years.</h3>
      </div>
      <div className="metrics-grid">
        {RESUME_DATA.metrics.map((m, i) => (
          <div className="metric" key={i} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
            <div className="metric-v">{m.v}</div>
            <div className="metric-l">{m.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeDisciplines() {
  const { disciplines } = RESUME_DATA;
  return (
    <section className="home-disciplines" data-reveal>
      <div className="container">
        <div className="section-head">
          <span className="section-idx">02</span>
          <h3 className="section-kicker">Five disciplines. One operator.</h3>
        </div>
      </div>
      <div className="discipline-grid">
        {disciplines.map((d, i) => (
          <div className="discipline" key={d.key} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="discipline-num">0{i + 1}</div>
            <h4 className="discipline-label">{d.label}</h4>
            <div className="discipline-meta">{d.count}</div>
            <p className="discipline-copy">{disciplineCopy[d.key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeCaseStudiesPreview() {
  const studies = RESUME_DATA.caseStudies.slice(0, 3);
  return (
    <section className="home-cases container" data-reveal>
      <div className="section-head">
        <span className="section-idx">03</span>
        <h3 className="section-kicker">Selected work.</h3>
        <Link to="/work" className="section-link">
          All work →
        </Link>
      </div>
      <div className="cases-list">
        {studies.map((s, i) => (
          <Link
            to={`/work#case-${s.id}`}
            key={s.id}
            className="case-row"
            data-reveal
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className="case-row-idx">{String(i + 1).padStart(2, '0')}</div>
            <div className="case-row-main">
              <div className="case-row-title">{s.title}</div>
              <div className="case-row-sub">
                {s.context} · {s.year}
              </div>
            </div>
            <div className="case-row-summary">{s.summary}</div>
            <div className="case-row-arrow">→</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomeConsulting() {
  return (
    <section className="home-consulting container" data-reveal>
      <div className="section-head">
        <span className="section-idx">04</span>
        <h3 className="section-kicker">Consulting — helping teams scale.</h3>
      </div>
      <div className="consulting-inner">
        <p className="consulting-pitch">{RESUME_DATA.consulting.pitch}</p>
        <div className="consulting-grid">
          {RESUME_DATA.consulting.services.map((s, i) => (
            <div className="consulting-card" key={s.title}>
              <div className="consulting-card-num" style={{ margin: '0px 0px 16px 20px' }}>
                0{i + 1}/
              </div>
              <h4 className="consulting-card-title" style={{ margin: '0px 0px 16px 20px' }}>
                {s.title}
              </h4>
              <p className="consulting-card-blurb" style={{ margin: '0px 0px 0px 20px' }}>
                {s.blurb}
              </p>
            </div>
          ))}
        </div>
        <div className="consulting-cta">
          <Link to="/contact" className="btn btn-accent">
            Let&apos;s talk <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomeMarquee() {
  const tokens = ['AI Automation', 'Full Stack', 'Protocol', 'Data Infra', 'Aerospace'];
  const run = (
    <>
      {tokens.map((t, i) => (
        <span className="marquee-item" key={i}>
          <span className="marquee-word">{t}</span>
          <span className="marquee-sep">✦</span>
        </span>
      ))}
    </>
  );

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span className="marquee-run">{run}</span>
        <span className="marquee-run">{run}</span>
      </div>
    </div>
  );
}

export function HomePage() {
  const [tweaks] = useTweaks();
  const sections = {
    metrics: <HomeMetrics key="metrics" />,
    disciplines: <HomeDisciplines key="disciplines" />,
    cases: <HomeCaseStudiesPreview key="cases" />,
    consulting: <HomeConsulting key="consulting" />,
  };
  let order: (keyof typeof sections)[] = ['metrics', 'disciplines', 'cases', 'consulting'];
  if (tweaks.sectionOrder === 'work-first') order = ['cases', 'disciplines', 'metrics', 'consulting'];
  if (tweaks.sectionOrder === 'skills-first') order = ['disciplines', 'metrics', 'cases', 'consulting'];

  return (
    <>
      <PageHelmet
        title="William Lopez-Cordero — AI · Protocol · Infra Engineer"
        description={RESUME_DATA.hero.subtitle}
        path="/"
      />
      <Chrome>
        <HomeHero />
        <HomeMarquee />
        {order.map((k) => sections[k])}
      </Chrome>
    </>
  );
}
